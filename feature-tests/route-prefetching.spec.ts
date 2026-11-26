import { expect, test } from "@playwright/test";
import { evidence, gotoSettled } from "./helpers";

test("hovering a plain <a> preloads the target route's code and data before the click", async ({ page }, testInfo) => {
  await gotoSettled(page, "/feature-tests/route-prefetching");
  const seen: string[] = [];
  page.on("request", (r) => seen.push(r.url()));

  await page.getByTestId("target-link").hover();
  await page.waitForTimeout(1000);
  expect(page.url()).toMatch(/\/feature-tests\/route-prefetching$/);
  const code = seen.filter((u) => /\/assets\/prefetch-target-[\w-]+\.js$/.test(u));
  const data = seen.filter((u) => u.includes("/_server"));
  expect(code.length, "target route chunk requested on hover").toBeGreaterThan(0);
  expect(data.length, "target route.preload server query requested on hover").toBeGreaterThan(0);

  const beforeClick = seen.length;
  await page.getByTestId("target-link").click();
  await expect(page.getByTestId("target-data")).toContainText("FT_PREFETCH_TARGET");
  const afterClick = seen.slice(beforeClick).filter((u) => /prefetch-target|\/_server/.test(u));
  evidence(
    testInfo,
    `on hover (before click): ${code.map((u) => new URL(u).pathname).join(", ")} + ${data.length} /_server data request(s); after click: ${afterClick.length} more for the target`,
  );
});
