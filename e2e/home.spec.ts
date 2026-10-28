import { expect, test, type Page } from "@playwright/test";

// 1x1 WebP; covers are stubbed so the tests never hit Goodreads or a CDN.
const PIXEL = Buffer.from("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==", "base64");

async function stubCovers(page: Page) {
  const optimized: string[] = [];
  const original: string[] = [];
  await page.route("**/_vercel/image?**", (route) => {
    optimized.push(new URL(route.request().url()).searchParams.get("url")!);
    return route.fulfill({ body: PIXEL, contentType: "image/webp" });
  });
  await page.route(/^https:\/\/(images|s)\.gr-assets\.com\//, (route) => {
    original.push(route.request().url());
    return route.fulfill({ body: PIXEL, contentType: "image/webp" });
  });
  return { optimized, original };
}

const hydrated = (page: Page) =>
  page.waitForFunction(() => (window as { _$HY?: { done?: boolean } })._$HY?.done === true);

test("main content and the LCP cover are in the HTML before hydration", async ({ page }) => {
  await stubCovers(page);
  // No client JS at all: only the server HTML and its inline stream scripts.
  await page.route("**/assets/*.js", (route) => route.abort());
  await page.goto("/");

  const covers = page.locator("main img");
  await expect(covers).toHaveCount(28);
  const lcp = covers.first();
  await expect(lcp).toBeVisible();
  await expect(lcp).toHaveAttribute("loading", "eager");
  await expect(lcp).toHaveAttribute("fetchpriority", "high");
  await expect(lcp).toHaveAttribute("width", /\d+/);
  await expect(lcp).toHaveAttribute("height", /\d+/);
  await expect(lcp).toHaveAttribute("srcset", /\/_vercel\/image\?/);
  await expect(covers.nth(10)).toHaveAttribute("loading", "lazy");
  expect(await page.evaluate(() => document.querySelectorAll('link[rel="stylesheet"]').length)).toBe(0);
});

test("fonts load from the preload without layout shift", async ({ page }) => {
  await stubCovers(page);
  const fontRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font" || /fonts\.(googleapis|gstatic)\.com/.test(request.url())) {
      fontRequests.push(request.url());
    }
  });
  await page.addInitScript(() => {
    (window as { __cls?: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) (window as { __cls?: number }).__cls! += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/");
  await hydrated(page);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");

  expect(await page.evaluate(() => document.fonts.check('600 16px "Geist Variable"'))).toBe(true);
  expect(await page.evaluate(() => (window as { __cls?: number }).__cls)).toBe(0);
  expect(fontRequests.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([]);
  const latin = fontRequests.filter((url) => url.includes("geist-latin-wght-normal"));
  expect(latin).toHaveLength(1); // the preload is reused, not refetched
  expect(fontRequests.some((url) => url.includes("geist-mono"))).toBe(false); // unused on this page
});

test.describe("at DPR 1", () => {
  // At high DPR every candidate rounds up to the largest width, which would
  // hide a sizes mismatch between the preload and the <img>.
  test.use({ deviceScaleFactor: 1 });

  test("covers download once, through the optimizer, at the rendered size", async ({ page }) => {
    const { optimized, original } = await stubCovers(page);
    const widths: number[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/_vercel/image?")) {
        widths.push(Number(new URL(request.url()).searchParams.get("w")));
      }
    });
    await page.goto("/");
    await hydrated(page);
    await page.waitForLoadState("networkidle");

    expect(original).toEqual([]);
    expect(optimized.length).toBeGreaterThan(0);
    // A preload whose imagesrcset/imagesizes drift from the <img> shows up as a
    // second request for the same cover.
    expect(new Set(optimized).size).toBe(optimized.length);
    // ~116 CSS px columns at DPR 1 → the 128w candidate, never the original size.
    expect(Math.max(...widths)).toBeLessThanOrEqual(128);
  });
});

test("an early scroll survives hydration", async ({ page }) => {
  await stubCovers(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/assets/*.js", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator("main img").first()).toBeVisible();

  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  const before = await page.evaluate(() => window.scrollY);

  release();
  await hydrated(page);
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
});
