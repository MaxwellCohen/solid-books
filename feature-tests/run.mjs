// Builds the app, serves the production build on FT_PORT (4107), runs every
// feature spec, and writes feature-tests/results.json from the real run.
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = process.env.FT_PORT ?? "4107";
const bin = (name) => `${root}node_modules/.bin/${name}`;
mkdirSync(`${root}feature-tests/.tmp`, { recursive: true });

const META = {
  "css-inlining": ["manual", "Vite `?inline` CSS import rendered in a <style> inside <NoHydration> (hand-rolled, per the cell)"],
  "font-optimization": ["third-party", "@fontsource-variable/geist via app.css + <link rel=preload as=font> to the hashed woff2 in Document.tsx"],
  "image-pipeline": ["first-party", "@solidjs/image 1.0.0: imagePlugin (sharp, avif+webp at 480/800/1200) + <SolidImage>"],
  caching: ["manual", "hand-rolled in-memory TTL cache + Cache-Control in a GET route; probe of Nitro routeRules cache"],
  "route-prefetching": ["first-party", "@solidjs/router createRouter preloadLinks (default on) preloading a plain <a> on hover"],
  islands: ["experimental", "@solidjs/vite-plugin serverFunctions.components (experimental server components) + a normal hydrated island"],
  "render-modes": ["first-party", "nitro({ prerender: { routes } }) for one route, default per-request SSR for another"],
  reactivity: ["first-party", "solid-js createSignal; component body render counter + MutationObserver"],
  "bundle-analysis": ["third-party", "rollup-plugin-visualizer behind ANALYZE=1 (client environment)"],
  "third-party-scripts": ["manual", "inline load + requestIdleCallback loader injecting a local stand-in script (cell's example)"],
  "multi-host-deployment": ["third-party", "Nitro presets: node-server (default), NITRO_PRESET=vercel, NITRO_PRESET=netlify"],
};

let server;
const stop = () => server && !server.killed && server.kill("SIGTERM");
process.on("exit", stop);
process.on("SIGINT", () => process.exit(130));

if (!process.argv.includes("--skip-build")) {
  console.log("› vite build");
  execFileSync(bin("vite"), ["build"], { cwd: root, stdio: "inherit", env: { ...process.env, FT_COMPONENTS: "1" } });
}

console.log(`› serving .output on :${port}`);
server = spawn(process.execPath, [".output/server/index.mjs"], {
  cwd: root,
  env: { ...process.env, PORT: port },
  stdio: ["ignore", "inherit", "inherit"],
});
for (let i = 0; ; i++) {
  try {
    if ((await fetch(`http://localhost:${port}/feature-tests`)).ok) break;
  } catch {}
  if (i > 100) throw new Error("server did not start");
  await new Promise((r) => setTimeout(r, 200));
}

let exitCode = 0;
try {
  execFileSync(bin("playwright"), ["test", "-c", "feature-tests/playwright.config.ts"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, FT_PORT: port },
  });
} catch {
  exitCode = 1;
}
stop();

const reportPath = `${root}feature-tests/.tmp/playwright-report.json`;
const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, "utf8")) : { suites: [] };
const byFile = {};
const walk = (suite, file) => {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const r = t.results.at(-1) ?? {};
      (byFile[file] ??= []).push({
        title: spec.title,
        status: r.status,
        error: r.error?.message?.split("\n").find((l) => l.trim())?.replace(/\u001b\[\d+m/g, ""),
        annotations: [...new Map([...(t.annotations ?? []), ...(r.annotations ?? [])].map((a) => [a.type + a.description, a])).values()],
      });
    }
  }
  for (const s of suite.suites ?? []) walk(s, file);
};
for (const s of report.suites ?? []) walk(s, s.file.replace(/^.*\//, ""));

const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const results = {};
for (const [id, [claimedLabel, method]] of Object.entries(META)) {
  const file = `${id}.spec.ts`;
  const tests = byFile[file] ?? [];
  // The primary test decides the status; "probe:" tests only add evidence / label suggestions.
  const primary = tests.filter((t) => !t.title.startsWith("probe:"));
  const passed = primary.length > 0 && primary.every((t) => t.status === "passed");
  const ann = tests.flatMap((t) => (t.status === "passed" ? t.annotations : []));
  const evidence = [
    ...tests.flatMap((t) => t.annotations).filter((a) => a.type === "evidence").map((a) => a.description),
    ...tests.filter((t) => t.status !== "passed").map((t) => `${t.title}: ${t.status}${t.error ? ` — ${t.error}` : ""}`),
  ].join(" | ");
  const blocked = ann.find((a) => a.type === "blocked");
  const suggested = ann.find((a) => a.type === "suggestedLabel")?.description;
  results[id] = {
    claimedLabel,
    status: blocked ? "blocked" : passed ? "pass" : "fail",
    method,
    evidence: evidence || "no test result",
    ...(suggested ? { suggestedLabel: suggested } : {}),
    test: `feature-tests/${file}`,
  };
}
writeFileSync(
  `${root}feature-tests/results.json`,
  JSON.stringify({ framework: "solidstart", repo: "solid-books", commit, ranAt: new Date().toISOString(), results }, null, 2) + "\n",
);
console.log("› wrote feature-tests/results.json");
for (const [id, r] of Object.entries(results)) console.log(`  ${r.status.padEnd(7)} ${id}${r.suggestedLabel ? ` (suggest ${r.suggestedLabel})` : ""}`);
process.exit(exitCode);
