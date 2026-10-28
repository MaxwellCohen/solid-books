// Bundle budgets for the home page, measured in gzip bytes against a
// production build (`pnpm build` first). Starts the built server without a
// database so the preview catalog renders, then checks what the HTML ships.
//
// Deferred downloads still count: every script and modulepreload in the
// document is part of initial JS, whether or not it blocks rendering.
import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const BUDGETS = {
  renderBlockingCssBytes: 0,
  totalCssBytes: 9_000,
  initialJsBytes: 62_000,
  modulePreloadCount: 8,
  fontPreloadCount: 1,
  thirdPartyRenderBlocking: 0,
};

const port = 3900 + Math.floor(Math.random() * 90);
const origin = `http://localhost:${port}`;
const env = { ...process.env, PORT: String(port) };
delete env.DATABASE_URL;
delete env.DATABASE_URL_UNPOOLED;
const server = spawn(process.execPath, [".output/server/index.mjs"], { env, stdio: "ignore" });

const gzip = (text) => gzipSync(text, { level: 9 }).length;
const asset = (path) => fetch(new URL(path, origin)).then((r) => r.text());

try {
  let html;
  for (let i = 0; i < 50 && !html; i++) {
    html = await fetch(origin).then((r) => r.text(), () => undefined);
    if (!html) await new Promise((r) => setTimeout(r, 100));
  }
  if (!html) throw new Error("built server did not start");

  const head = html.slice(0, html.indexOf("</head>"));
  const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].slice(1).map((m) => [m[1], m[2] ?? ""]));
  const links = [...head.matchAll(/<link\b[^>]*>/g)].map((m) => attrs(m[0]));
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]);

  const blockingCss = links.filter((l) => l.rel === "stylesheet" && (!l.media || l.media === "all"));
  const modulePreloads = links.filter((l) => l.rel === "modulepreload");
  const inlineCss = [...head.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("");
  const builtCss = await Promise.all(
    (await readdir(".output/public/assets")).filter((f) => f.endsWith(".css"))
      .map((f) => readFile(`.output/public/assets/${f}`, "utf8")),
  );
  const jsUrls = [...new Set([...scripts, ...modulePreloads.map((l) => l.href)])];
  const js = await Promise.all(jsUrls.map(asset));
  const blockingCssText = await Promise.all(blockingCss.map((l) => asset(l.href)));

  const actual = {
    renderBlockingCssBytes: blockingCssText.reduce((n, css) => n + gzip(css), 0),
    totalCssBytes: gzip(inlineCss) + builtCss.reduce((n, css) => n + gzip(css), 0),
    initialJsBytes: js.reduce((n, code) => n + gzip(code), 0),
    modulePreloadCount: modulePreloads.length,
    fontPreloadCount: links.filter((l) => l.rel === "preload" && l.as === "font").length,
    thirdPartyRenderBlocking: [...blockingCss.map((l) => l.href), ...scripts]
      .filter((u) => /^(https?:)?\/\//.test(u) && !u.startsWith(origin)).length,
  };

  let failed = false;
  for (const [key, budget] of Object.entries(BUDGETS)) {
    const ok = actual[key] <= budget;
    failed ||= !ok;
    console.log(`${ok ? "ok  " : "FAIL"} ${key.padEnd(26)} ${String(actual[key]).padStart(7)} / ${budget}`);
  }
  if (failed) process.exitCode = 1;
} finally {
  server.kill();
}
