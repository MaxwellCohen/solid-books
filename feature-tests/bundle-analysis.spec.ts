import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { evidence, ROOT, viteBuild } from "./helpers";

test("ANALYZE=1 vite build writes a rollup-plugin-visualizer report", async ({}, testInfo) => {
  test.setTimeout(300_000);
  const report = `${ROOT}feature-tests/.tmp/bundle-stats.html`;
  rmSync(report, { force: true });
  viteBuild({ ANALYZE: "1", ANALYZE_FILE: report, FT_OUT_DIR: `${ROOT}feature-tests/.tmp/analyze-output` });
  expect(existsSync(report)).toBe(true);
  const body = readFileSync(report, "utf8");
  expect(body).toContain("prefetch-target");
  evidence(testInfo, `ANALYZE=1 vite build wrote feature-tests/.tmp/bundle-stats.html (${Math.round(statSync(report).size / 1024)} KiB treemap listing client chunks, e.g. prefetch-target)`);
});
