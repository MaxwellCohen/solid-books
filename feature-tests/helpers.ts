import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { TestInfo } from "@playwright/test";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const BASE = `http://localhost:${process.env.FT_PORT ?? 4107}`;

/** One-line evidence, collected into results.json by run.mjs. */
export function evidence(testInfo: TestInfo, text: string) {
  testInfo.annotations.push({ type: "evidence", description: text });
}

export function suggestLabel(testInfo: TestInfo, label: string, why: string) {
  testInfo.annotations.push({ type: "suggestedLabel", description: label });
  testInfo.annotations.push({ type: "evidence", description: why });
}

export async function html(path: string) {
  const res = await fetch(BASE + path);
  return { res, text: await res.text() };
}

/** Runs `vite build` with extra env; returns combined output. */
export function viteBuild(env: Record<string, string>) {
  return execFileSync(`${ROOT}node_modules/.bin/vite`, ["build"], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: "pipe",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Loads a page and waits for the network to settle (hydration done). */
export async function gotoSettled(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}
