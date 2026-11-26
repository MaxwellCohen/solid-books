import { expect, test } from "@playwright/test";
import { evidence, gotoSettled, html } from "./helpers";

test("Geist is self-hosted, preloaded and uses font-display", async ({ page }, testInfo) => {
  const { text } = await html("/feature-tests/font-optimization");
  const preload = text.match(/<link[^>]*rel=["']?preload["']?[^>]*as=["']?font[^>]*>/)?.[0];
  expect(preload, "<link rel=preload as=font>").toBeTruthy();
  const href = preload!.match(/href=["']?([^"' >]+)/)![1];
  expect(href).toMatch(/^\/assets\/geist-latin-wght-normal-[\w-]+\.woff2$/);
  const faces = text.match(/@font-face\{[^}]*\}/g) ?? [];
  const geistFaces = faces.filter((f) => /Geist Variable/.test(f));
  expect(geistFaces.length).toBeGreaterThan(0);
  expect(geistFaces.every((f) => /font-display:\s*swap/.test(f))).toBe(true);

  const fontRequests: string[] = [];
  const thirdParty: string[] = [];
  page.on("request", (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) thirdParty.push(r.url());
    if (r.resourceType() === "font" || r.url().endsWith(".woff2")) fontRequests.push(r.url());
  });
  await gotoSettled(page, "/feature-tests/font-optimization");
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('16px "Geist Variable"');
  });
  expect(loaded).toBe(true);
  expect(thirdParty).toEqual([]);
  expect(fontRequests.length).toBeGreaterThan(0);
  expect(fontRequests.every((u) => u.startsWith(new URL(page.url()).origin))).toBe(true);
  expect(fontRequests.some((u) => u.endsWith(href))).toBe(true);

  evidence(
    testInfo,
    `preload ${href}; ${geistFaces.length} Geist @font-face rules with font-display:swap in inline CSS; ${fontRequests.length} same-origin woff2 requests, 0 to Google Fonts; document.fonts.check = true`,
  );
});
