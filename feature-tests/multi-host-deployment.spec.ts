import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { evidence, ROOT, viteBuild } from "./helpers";

test("the same app builds for node-server, Vercel and Netlify via Nitro presets", async ({}, testInfo) => {
  test.setTimeout(600_000);
  // node-server (default preset) is the build being served by run.mjs.
  const node = JSON.parse(readFileSync(`${ROOT}.output/nitro.json`, "utf8"));
  expect(node.preset).toBe("node-server");
  expect(existsSync(`${ROOT}.output/server/index.mjs`)).toBe(true);

  const presetOf = (p: string) => JSON.parse(readFileSync(ROOT + p, "utf8")).preset;
  viteBuild({ NITRO_PRESET: "vercel" });
  expect(presetOf(".vercel/output/nitro.json")).toBe("vercel");
  for (const p of [".vercel/output/config.json", ".vercel/output/functions/__server.func", ".vercel/output/static/assets"]) {
    expect(existsSync(ROOT + p), p).toBe(true);
  }
  const vercelConfig = JSON.parse(readFileSync(`${ROOT}.vercel/output/config.json`, "utf8"));
  expect(vercelConfig.version).toBe(3);

  viteBuild({ NITRO_PRESET: "netlify" });
  expect(presetOf(".netlify/functions-internal/nitro.json")).toBe("netlify");
  for (const p of [".netlify/functions-internal/server", "dist/assets", "dist/_headers"]) {
    expect(existsSync(ROOT + p), p).toBe(true);
  }

  evidence(
    testInfo,
    `node-server .output/server/index.mjs; NITRO_PRESET=vercel → .vercel/output (Build Output API v3, __server.func, images config ${vercelConfig.images ? "present" : "absent"}); NITRO_PRESET=netlify → .netlify/functions-internal/server + dist/`,
  );
});
