import { expect, test } from "@playwright/test";
import { BASE, evidence, suggestLabel } from "./helpers";

const get = async (path: string) => {
  const res = await fetch(BASE + path);
  return { headers: res.headers, body: (await res.json()) as { value: string } };
};

test("hand-rolled TTL cache reuses a value within the TTL and refreshes after it", async ({}, testInfo) => {
  const first = await get("/feature-tests/api/manual-cache");
  const second = await get("/feature-tests/api/manual-cache");
  expect(second.body.value).toBe(first.body.value);
  const cacheControl = first.headers.get("cache-control") ?? "";
  expect(cacheControl).toMatch(/max-age=2/);
  expect(cacheControl).toMatch(/s-maxage=2/);
  await new Promise((r) => setTimeout(r, 2300));
  const third = await get("/feature-tests/api/manual-cache");
  expect(third.body.value).not.toBe(first.body.value);
  evidence(testInfo, `manual TTL cache: 2 requests returned the same value, a request after 2.3 s returned a new one; Cache-Control "${cacheControl}"`);
});

test("probe: Nitro routeRules cache (not hand-rolled) also caches the handler", async ({}, testInfo) => {
  const first = await get("/feature-tests/api/nitro-cache");
  const second = await get("/feature-tests/api/nitro-cache");
  await new Promise((r) => setTimeout(r, 3500));
  // swr: the first request after expiry may still get the stale entry while revalidating.
  await get("/feature-tests/api/nitro-cache");
  await new Promise((r) => setTimeout(r, 300));
  const later = await get("/feature-tests/api/nitro-cache");
  expect(second.body.value).toBe(first.body.value);
  expect(later.body.value).not.toBe(first.body.value);
  suggestLabel(
    testInfo,
    "third-party",
    `Nitro routeRules {cache:{maxAge:2}} cached a handler that returns a fresh value per call (x-cache ${second.headers.get("x-cache")}, Cache-Control "${second.headers.get("cache-control")}") and revalidated after expiry: no hand-rolling needed, via Nitro (not Solid-team maintained, same basis as the multi-host cell)`,
  );
});
