import { createAPIHandler } from "filesystem-routing/api";
import routes from "virtual:file-routes";
import { hostDocumentCacheControl } from "./lib/catalog-cache";

async function withHtmlCacheControl(
  request: Request,
  next: (request?: Request) => Response | Promise<Response>,
) {
  const response = await next();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  response.headers.set("Cache-Control", hostDocumentCacheControl());
  response.headers.delete("CDN-Cache-Control");
  response.headers.delete("Vercel-CDN-Cache-Control");
  response.headers.delete("Netlify-CDN-Cache-Control");
  return response;
}

export default [withHtmlCacheControl, createAPIHandler(routes)];
