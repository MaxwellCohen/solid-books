import { IMAGE_QUALITY, IMAGE_WIDTHS } from "./image-cdn-config";

const endpoints = {
  vercel: "/_vercel/image",
  netlify: "/.netlify/images",
} as const;

/**
 * Responsive srcset through the host's image optimizer (AVIF/WebP negotiated
 * from the Accept header). Undefined on hosts without one, where the original
 * `src` is used as-is.
 */
export function imageSrcset(src: string): string | undefined {
  const cdn = import.meta.env.VITE_IMAGE_CDN;
  if (!cdn) return undefined;
  const url = encodeURIComponent(src);
  return IMAGE_WIDTHS.map(
    (width) => `${endpoints[cdn]}?url=${url}&w=${width}&q=${IMAGE_QUALITY} ${width}w`,
  ).join(", ");
}
