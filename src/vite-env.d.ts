/// <reference types="vite/client" />
/// <reference types="@solidjs/vite-plugin/boundary-modules" />
/// <reference types="../file-routes.d.ts" />

interface ImportMetaEnv {
  /** Host image optimizer, set at build time by vite.config.ts. */
  readonly VITE_IMAGE_CDN: import("./lib/image-cdn-config").ImageCdn;
}
