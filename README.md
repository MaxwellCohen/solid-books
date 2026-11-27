## Solid Books

A Solid copy of next-books.dev

### Cover preloading

The app follows the [image reveal gating proposal's Phase 0](https://github.com/solidjs/solid/blob/next/documentation/proposals/image-reveal-gating.md):

- Covers render with `SolidImage` from `@solidjs/image`. The first 10 grid
  covers (and the detail cover) are `eager`, so they get image preload links
  and `fetchpriority="high"`. The other covers render as a blank placeholder
  and load once they are within 500px of the viewport after hydration. They
  never hold a reveal. Thumbhash previews show behind every cover until it loads.
- Client navigation warms priority covers in parallel and holds the existing
  `Loading` boundary until decoding settles, with a maximum 500 ms image wait.
  Failed requests release the boundary; timed-out requests continue loading.
- SSR renders real images as soon as book data is ready. Hydration does not
  wait for decoding or replace that content with a loading fallback.

The installed Solid release has no server export for `waitAsset`, so this uses
async memos, the same mechanism used by its client implementation. The grid
already shares one `Loading` boundary, so no additional `Reveal` coordination
is needed. Preload hints warm the streamed first load but do not gate its swap;
that requires the upstream compiler/runtime work in Phase 1.
