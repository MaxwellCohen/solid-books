import type { SolidImageVariant } from "@solidjs/image";
import { IMAGE_QUALITY, IMAGE_WIDTHS } from "./image-cdn-config";

const endpoints = {
  vercel: "/_vercel/image",
  netlify: "/.netlify/images",
} as const;

/**
 * Responsive variants through the host's image optimizer. The optimizer
 * negotiates AVIF/WebP from the Accept header, so one group of URLs serves
 * every format. Empty on hosts without an optimizer, where the original
 * `src` is used as-is.
 */
export function imageVariants(src: string): SolidImageVariant[] {
  const cdn = import.meta.env.VITE_IMAGE_CDN;
  if (!cdn) return [];
  const url = encodeURIComponent(src);
  return IMAGE_WIDTHS.map((width) => ({
    path: `${endpoints[cdn]}?url=${url}&w=${width}&q=${IMAGE_QUALITY}`,
    width,
    // The original format; the optimizer picks the format it actually serves.
    type: "image/jpeg",
  }));
}

/** The same variants as one `srcset` value, matching what SolidImage renders. */
export function imageSrcset(src: string): string | undefined {
  const variants = imageVariants(src);
  if (variants.length === 0) return undefined;
  return variants.map((variant) => `${variant.path} ${variant.width}w`).join(",");
}
