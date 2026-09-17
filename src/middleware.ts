import { createAPIHandler } from "filesystem-routing/api";
import routes from "virtual:file-routes";
import {
  HTML_CACHE_CONTROL,
  matchCachedHtml,
  storeCachedHtml,
} from "./lib/catalog-cache";
import { getApiDelayMs, parseSearchParams } from "./lib/url-state";

const HTML_NO_STORE = "private, no-store";

function hasHtmlDelay(request: Request) {
  const url = new URL(request.url);
  const delayMs = getApiDelayMs(
    parseSearchParams(Object.fromEntries(url.searchParams)),
  );
  const envMs = Number(process.env.API_DELAY_MS ?? 0);
  return delayMs > 0 || (Number.isFinite(envMs) && envMs > 0);
}

function applyHtmlCacheHeaders(response: Response, cacheControl: string) {
  response.headers.set("Cache-Control", cacheControl);
  response.headers.set("CDN-Cache-Control", cacheControl);
  response.headers.set("Vercel-CDN-Cache-Control", cacheControl);
  response.headers.set("Netlify-CDN-Cache-Control", cacheControl);
}

async function withHtmlCacheControl(
  request: Request,
  next: (request?: Request) => Response | Promise<Response>,
) {
  const delayed = hasHtmlDelay(request);
  if (!delayed) {
    const cached = await matchCachedHtml(request);
    if (cached) return cached;
  }

  const response = await next();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const cacheControl = delayed ? HTML_NO_STORE : HTML_CACHE_CONTROL;
  applyHtmlCacheHeaders(response, cacheControl);
  if (!delayed) void storeCachedHtml(request, response);
  return response;
}

export default [withHtmlCacheControl, createAPIHandler(routes)];
