import { fileURLToPath } from "node:url";
import { fileRoutes } from "filesystem-routing/vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import solid from "@solidjs/vite-plugin";
import { imagePlugin } from "@solidjs/image/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { detectImageCdn, IMAGE_HOSTS, IMAGE_WIDTHS } from "./src/lib/image-cdn-config";

const imageCdn = detectImageCdn(process.env);

// Feature tests (feature-tests/): optional build-time switches.
// FT_OUT_DIR sends the Nitro output elsewhere so a test build cannot clobber
// the .output being served; ANALYZE=1 adds the bundle visualizer.
const ftOutDir = process.env.FT_OUT_DIR;
const analyze = process.env.ANALYZE === "1";
// serverFunctions.components adds ~18 KB gzip to the client entry of every page,
// so only feature-tests/run.mjs turns it on (the islands page needs it).
const ftComponents = process.env.FT_COMPONENTS === "1";

export default defineConfig({
  define: {
    "import.meta.env.VITE_IMAGE_CDN": JSON.stringify(imageCdn),
  },
  plugins: [
    tailwindcss(),
    solid({
      start: {
        middleware: "./src/middleware.ts",
        devtools: false,
      },
      ssr: true,
      // components: experimental server components (feature-tests/islands), off unless FT_COMPONENTS=1.
      serverFunctions: { serverSetup: "./src/server-config.ts", ...(ftComponents ? { components: true } : {}) },
    }),
    // @solidjs/image: build-time resizing for `?image` imports (feature-tests/image-pipeline).
    imagePlugin({
      local: {
        input: ["jpeg"],
        output: ["avif", "webp"],
        sizes: [480, 800, 1200],
      },
    }),
    fileRoutes({ httpMethods: true, types: true }),
    nitro({
      ...(process.env.CLOUDFLARE || process.env.WORKERS_CI
        ? { preset: "cloudflare_module" }
        : {}),
      ...(ftOutDir ? { output: { dir: ftOutDir } } : {}),
      // feature-tests/render-modes: one prerendered route next to per-request SSR.
      prerender: { routes: ["/feature-tests/render-modes/prerendered"] },
      // feature-tests/caching: Nitro's response cache on one handler.
      routeRules: {
        "/feature-tests/api/nitro-cache": { cache: { maxAge: 2 } },
      },
      // Host image optimizers for cover srcsets (see src/lib/image-cdn.ts).
      // Each preset only reads its own key.
      vercel: {
        config: {
          version: 3,
          images: {
            sizes: IMAGE_WIDTHS,
            domains: [],
            remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname })),
            formats: ["image/avif", "image/webp"],
            minimumCacheTTL: 60 * 60 * 24 * 30,
          },
        },
      },
      netlify: {
        config: {
          images: {
            remote_images: IMAGE_HOSTS.map((host) => `https://${host.replaceAll(".", "\\.")}/.*`),
          },
        },
      },
    }),
    // @solidjs/image emits variants via import.meta.ROLLUP_FILE_URL, which
    // server builds resolve to file:// paths. The client build emits the same
    // hashed files under /assets, so point server-rendered URLs there.
    {
      name: "feature-tests:image-ssr-urls",
      applyToEnvironment: (environment: { name: string }) => environment.name !== "client",
      resolveFileUrl({ fileName }: { fileName: string }) {
        if (/(^|\/)i-[0-9a-f]+-\d+-[\w-]+\.(avif|webp|jpe?g|png)$/.test(fileName)) {
          return JSON.stringify("/" + fileName);
        }
        return undefined;
      },
    },
    // The feature-test routes import slices of the same packages as the home page.
    // Left alone, that splits the Solid runtime into four small chunks (web, router,
    // solid-js, server-function client) that the home page preloads one by one.
    // Packages shared by three or more chunks go into one vendor chunk instead.
    {
      name: "vendor-chunk",
      configEnvironment(name: string) {
        if (name !== "client") return;
        return {
          build: {
            rolldownOptions: {
              output: {
                codeSplitting: {
                  groups: [{ name: "vendor", test: /node_modules/, minShareCount: 3 }],
                },
              },
            },
          },
        };
      },
    },
    // feature-tests/bundle-analysis: `ANALYZE=1 vite build` writes a treemap
    // of the client bundle.
    analyze && {
      ...visualizer({
        filename: process.env.ANALYZE_FILE ?? "stats.html",
        template: "treemap",
        gzipSize: true,
      }),
      applyToEnvironment: (environment: { name: string }) => environment.name === "client",
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "client",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.ssr.test.tsx"],
        },
      },
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.ssr.test.tsx"],
        },
      },
    ],
  },
});
