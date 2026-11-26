import { expect, test } from "@playwright/test";
import { evidence, html } from "./helpers";

test("stand-in third-party script loads after load+idle and runs", async ({ page }, testInfo) => {
  const { text } = await html("/feature-tests/third-party-scripts");
  const head = text.slice(0, text.indexOf("</head>"));
  expect(text).not.toMatch(/<script[^>]*src="\/feature-tests\/third-party\.js"/);
  expect(head).not.toContain("third-party.js");
  expect(text).toMatch(/<script>addEventListener\("load"[^<]*requestIdleCallback[^<]*third-party\.js/);

  let requestedAt = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/feature-tests/third-party.js")) requestedAt = Date.now();
  });
  await page.goto("/feature-tests/third-party-scripts");
  await page.waitForFunction(() => (window as any).__ftThirdParty, null, { timeout: 15_000 });
  const info = await page.evaluate(() => ({
    ...(window as any).__ftThirdParty,
    loadEventEnd: (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming).loadEventEnd,
    fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
  }));
  expect(requestedAt).toBeGreaterThan(0);
  expect(info.readyState).toBe("complete");
  expect(info.ranAt).toBeGreaterThanOrEqual(info.loadEventEnd);
  if (info.fcp !== null) expect(info.ranAt).toBeGreaterThan(info.fcp);

  evidence(
    testInfo,
    `no third-party <script src> in SSR HTML (only an inline load+requestIdleCallback loader); script ran at ${info.ranAt.toFixed(0)} ms, after loadEventEnd ${info.loadEventEnd.toFixed(0)} ms${info.fcp !== null ? ` and FCP ${info.fcp.toFixed(0)} ms` : ""}; global __ftThirdParty set`,
  );
});
