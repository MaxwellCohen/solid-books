import { expect, test } from "@playwright/test";
import { evidence, html } from "./helpers";

const MARKER = "FT_STATIC_ISLAND_MARKER_9c41";

test("server component stays out of client JS while the island hydrates", async ({ page }, testInfo) => {
  const { text } = await html("/feature-tests/islands");
  expect(text).toContain(MARKER);

  const js: { url: string; body: string }[] = [];
  const serverCalls: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/_server")) serverCalls.push(r.url());
  });
  page.on("response", async (r) => {
    const type = r.headers()["content-type"] ?? "";
    if (r.url().endsWith(".js") || type.includes("javascript")) js.push({ url: r.url(), body: await r.text().catch(() => "") });
  });
  await page.goto("/feature-tests/islands");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("static-panel")).toContainText(MARKER);

  const island = page.getByTestId("island");
  await expect(async () => {
    await island.click();
    await expect(island).not.toHaveText("Island clicks: 0", { timeout: 500 });
  }).toPass({ timeout: 10_000 });
  await expect(page.getByTestId("static-panel")).toContainText(MARKER);

  const leaking = js.filter((f) => f.body.includes(MARKER)).map((f) => f.url);
  expect(leaking).toEqual([]);
  // Sanity: the island's own code is in the client bundle.
  expect(js.some((f) => f.body.includes("Island clicks"))).toBe(true);

  evidence(
    testInfo,
    `"use server" component rendered inline (marker in HTML and DOM), marker absent from all ${js.length} JS responses, island counter works after hydration (${await island.textContent()}), ${serverCalls.length} /_server requests`,
  );
});
