import { expect, test } from "@playwright/test";
import { evidence } from "./helpers";

test("a signal update changes only the bound text; the component runs once", async ({ page }, testInfo) => {
  await page.goto("/feature-tests/reactivity");
  await page.waitForFunction(() => (window as any).__ftRenders === 1);
  await page.waitForLoadState("networkidle");

  // Record every DOM mutation under the page while clicking.
  await page.evaluate(() => {
    const log: string[] = [];
    (window as any).__ftMutations = log;
    new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target.nodeType === 1 ? (r.target as Element) : r.target.parentElement;
        log.push(`${r.type}:${el?.getAttribute("data-testid") ?? el?.tagName}`);
      }
    }).observe(document.querySelector("[data-ft-page]")!, { subtree: true, childList: true, characterData: true, attributes: true });
  });

  const inc = page.getByTestId("inc");
  for (let i = 0; i < 3; i++) await inc.click();
  await expect(page.getByTestId("count")).toHaveText("3");
  expect(await page.evaluate(() => (window as any).__ftRenders)).toBe(1);
  await expect(page.getByTestId("renders")).toHaveText("1");
  const mutations: string[] = await page.evaluate(() => (window as any).__ftMutations);
  const targets = [...new Set(mutations.map((m) => m.split(":")[1]))];
  expect(targets).toEqual(["count"]);

  evidence(
    testInfo,
    `3 clicks → count 3, component body ran once on the client (render counter 1); ${mutations.length} DOM mutations, all inside [data-testid=count] (${[...new Set(mutations)].join(", ")})`,
  );
});
