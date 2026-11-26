import { expect, test } from "@playwright/test";
import { BASE, evidence, html } from "./helpers";

const widthsOf = (srcset: string) => [...srcset.matchAll(/\s(\d+)w/g)].map((m) => Number(m[1]));

test("SolidImage emits a multi-width srcset, dimensions, lazy loading and modern formats", async ({ page }, testInfo) => {
  const { text } = await html("/feature-tests/image-pipeline");
  const heroImg = text.match(/<img[^>]*alt="Hero sample"[^>]*>/)![0];
  const srcset = heroImg.match(/srcset="([^"]+)"/)![1];
  const widths = widthsOf(srcset);
  expect(widths.length).toBeGreaterThanOrEqual(2);
  expect(heroImg).toMatch(/\swidth="\d+"/);
  expect(heroImg).toMatch(/\sheight="\d+"/);
  const sources = [...text.matchAll(/<source[^>]*type="(image\/[a-z]+)"[^>]*srcset="([^"]+)"/g)];
  const types = [...new Set(sources.map((s) => s[1]))];
  expect(types).toEqual(expect.arrayContaining(["image/avif", "image/webp"]));

  // Fetch one variant from each format and check the served content type.
  const avifUrl = sources.find((s) => s[1] === "image/avif")![2].split(",")[0].trim().split(" ")[0];
  const webpUrl = srcset.split(",")[0].trim().split(" ")[0];
  const avifType = (await fetch(BASE + avifUrl)).headers.get("content-type");
  const webpType = (await fetch(BASE + webpUrl)).headers.get("content-type");
  expect(avifType).toBe("image/avif");
  expect(webpType).toBe("image/webp");

  // The offscreen image is a different file; its variants must not load until scrolled near.
  const offscreenHtml = text.slice(text.indexOf('data-testid="below-fold"'));
  const offscreenNoscript = offscreenHtml.match(/<noscript[\s\S]*?<\/noscript>/)?.[0] ?? "";
  const offscreenFiles = [...offscreenHtml.matchAll(/\/assets\/(i-[\w-]+\.(?:avif|webp))/g)].map((m) => m[1]);
  expect(offscreenFiles.length).toBeGreaterThan(0);
  const requested: string[] = [];
  page.on("request", (r) => requested.push(r.url()));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/feature-tests/image-pipeline");
  await page.waitForLoadState("networkidle");
  const offscreenBefore = requested.filter((u) => offscreenFiles.some((f) => u.endsWith(f)));
  const heroCurrent = await page.getByAltText("Hero sample").first().evaluate((img: HTMLImageElement) => img.currentSrc);
  const lazyAttrInSsr = /<source[^>]*srcset=/.test(offscreenHtml.slice(0, offscreenHtml.indexOf("<noscript")));

  await page.getByTestId("below-fold").scrollIntoViewIfNeeded();
  const offscreenImg = page.getByTestId("below-fold").locator("img[alt='Offscreen sample']").first();
  await expect
    .poll(() => offscreenImg.evaluate((img: HTMLImageElement) => (img.complete ? img.currentSrc : "")), { timeout: 10_000 })
    .toMatch(/\/assets\/i-[\w-]+\.(avif|webp)$/);
  const offscreenAfter = requested.filter((u) => offscreenFiles.some((f) => u.endsWith(f)));

  evidence(
    testInfo,
    `hero srcset widths ${widths.join("/")} with width/height; <source> types ${types.join("+")}; variants served as ${avifType} and ${webpType}; hero currentSrc ${heroCurrent.split("/").pop()}; offscreen image (2400px below the fold): ${offscreenBefore.length} variant request(s) before scrolling (${offscreenBefore.map((u) => u.split("/").pop()).join(", ") || "none"}), ${offscreenAfter.length} after; SSR <source srcset> present for the lazy image: ${lazyAttrInSsr}; noscript fallback loading=lazy: ${offscreenNoscript.includes('loading="lazy"')}`,
  );
  expect(offscreenBefore, "offscreen image variants must not be fetched before scrolling (lazy loading)").toEqual([]);
});
