import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { evidence, html, ROOT } from "./helpers";

const stampOf = (text: string) => text.match(/data-testid="stamp"[^>]*>([^<]+)</)?.[1];

test("one route is prerendered at build, another is server-rendered per request", async ({}, testInfo) => {
  const file = `${ROOT}.output/public/feature-tests/render-modes/prerendered/index.html`;
  expect(existsSync(file), file).toBe(true);
  const builtStamp = stampOf(readFileSync(file, "utf8"));
  expect(builtStamp).toBeTruthy();

  const pre1 = stampOf((await html("/feature-tests/render-modes/prerendered")).text);
  await new Promise((r) => setTimeout(r, 50));
  const pre2 = stampOf((await html("/feature-tests/render-modes/prerendered")).text);
  expect(pre1).toBe(builtStamp);
  expect(pre2).toBe(builtStamp);

  const ssr1 = stampOf((await html("/feature-tests/render-modes/ssr")).text);
  await new Promise((r) => setTimeout(r, 50));
  const ssr2 = stampOf((await html("/feature-tests/render-modes/ssr")).text);
  expect(ssr1).toBeTruthy();
  expect(ssr2).not.toBe(ssr1);

  evidence(
    testInfo,
    `nitro.prerender wrote .output/public/feature-tests/render-modes/prerendered/index.html; its stamp ${builtStamp} is served unchanged on 2 requests; /ssr stamp changed per request (${ssr1} → ${ssr2})`,
  );
});
