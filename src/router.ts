import { pageRoutes } from "virtual:file-routes";
import { createRouter, intentPreload } from "@solidjs/router";
import { fileRoutes } from "@solidjs/router/fs";

// Router 2.0 no longer preloads links by default; keep hover/focus preloading.
export const Router = createRouter({
  routes: fileRoutes(pageRoutes),
  preloadLinks: intentPreload(),
});

export const { paths } = Router;
