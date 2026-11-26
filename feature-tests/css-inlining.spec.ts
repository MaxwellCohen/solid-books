import { expect, test } from "@playwright/test";
import { evidence, gotoSettled, html } from "./helpers";

test("route CSS ships inline in a <style>, with no render-blocking stylesheet", async ({ page }, testInfo) => {
  const { text } = await html("/feature-tests/css-inlining");
  const styles = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  const routeStyle = styles.find((css) => css.includes(".ft-inline-marker"));
  expect(routeStyle, "inline <style> with the route's .ft-inline-marker rule").toBeTruthy();
  const stylesheetLinks = text.match(/<link[^>]*rel=["']?stylesheet[^>]*>/g) ?? [];
  expect(stylesheetLinks).toEqual([]);

  const cssRequests: string[] = [];
  const jsBodies: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "stylesheet" || r.url().endsWith(".css")) cssRequests.push(r.url());
  });
  page.on("response", async (r) => {
    if (r.url().endsWith(".js")) jsBodies.push(await r.text().catch(() => ""));
  });
  await gotoSettled(page, "/feature-tests/css-inlining");
  const outline = await page.getByTestId("marker").evaluate((el) => getComputedStyle(el).outlineColor);
  expect(outline).toBe("rgb(1, 2, 3)");
  expect(cssRequests).toEqual([]);
  const cssInJs = jsBodies.some((b) => b.includes("ft-inline-marker{"));
  expect(cssInJs, "route CSS string kept out of client JS").toBe(false);

  evidence(
    testInfo,
    `HTML has ${styles.length} inline <style> blocks (route one: ${routeStyle!.length} B incl. .ft-inline-marker), 0 <link rel=stylesheet>, 0 CSS requests, outline rgb(1, 2, 3) applied, CSS not in ${jsBodies.length} client JS files`,
  );
});
