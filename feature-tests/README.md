# Feature tests

Validates the 11 Framework Compare labels for **SolidStart (Solid 2 start mode)** against
a production build of this app. Each feature has a page under `/feature-tests/<id>`
(index at `/feature-tests`) and a spec here.

```sh
pnpm test:features          # vite build → serve .output on :4107 → playwright → results.json
node feature-tests/run.mjs --skip-build   # reuse the existing .output
```

`FT_PORT` changes the port; `CHROME_PATH` the browser (defaults to the system Chrome; no
Playwright browser download needed). Results land in `feature-tests/results.json`;
scratch output (reports, the analyzer build, Playwright artifacts) in `feature-tests/.tmp/`.
The multi-host spec also writes `.vercel/output`, `.netlify/` and `dist/` (all gitignored).

| Feature | Label | What the test proves |
| --- | --- | --- |
| css-inlining | Manual | Route CSS imported with `?inline` is in an inline `<style>`; no `<link rel=stylesheet>`, no CSS requests, style applied, CSS string not in client JS. |
| font-optimization | Third-party | `<link rel=preload as=font>` to the hashed Geist woff2, `@font-face` with `font-display: swap` inline, only same-origin font requests, font loaded. |
| image-pipeline | 1st-party | `@solidjs/image`: srcset with 3 widths, width/height, AVIF+WebP `<source>`s served with the right content type, and the offscreen image not fetched before scrolling. |
| caching | Manual | Hand-rolled TTL cache returns the same value twice, then a fresh one after the TTL; `Cache-Control` with `s-maxage`. A probe checks Nitro `routeRules` `cache` too. |
| route-prefetching | 1st-party | Hovering a plain `<a>` requests the target route chunk and its `route.preload` server query before the click. |
| islands | Experimental | `serverFunctions.components`: a `"use server"` component renders inline but its marker string is in no JS response; a sibling island hydrates and counts clicks. |
| render-modes | 1st-party | `nitro.prerender` writes `/feature-tests/render-modes/prerendered/index.html` whose timestamp is served unchanged; `/ssr` changes per request. |
| reactivity | 1st-party | 3 clicks update the count while the component body runs once; every DOM mutation is inside the bound `<b>`. |
| bundle-analysis | Third-party | `ANALYZE=1 vite build` (rollup-plugin-visualizer, client env) writes a treemap HTML report. |
| third-party-scripts | Manual | No third-party `<script src>` in the HTML; an inline load + `requestIdleCallback` loader injects a local stand-in that runs after `load`. |
| multi-host-deployment | Third-party | Default node-server output plus `NITRO_PRESET=vercel` (`.vercel/output`) and `NITRO_PRESET=netlify` (`.netlify/` + `dist/`) builds. |

Notes:

- `@solidjs/image` needed two workarounds here: a relative import (the plugin mis-joins
  `@/` alias paths) and a `resolveFileUrl` plugin in `vite.config.ts`, because the SSR build
  otherwise renders variant URLs as `file://` paths.
- The islands page creates the `dynamic()` server component inside the route component and
  wraps it in `<Loading>`; created at module scope, client hydration crashed.
