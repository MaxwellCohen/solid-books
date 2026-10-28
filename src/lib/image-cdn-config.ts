// Shared by vite.config.ts (host image-optimizer config) and the runtime URL
// builder, so every srcset width is one the host is configured to serve.

// Goodreads "l" covers top out around 320px wide; larger widths would just
// re-encode the original.
export const IMAGE_WIDTHS = [96, 128, 160, 192, 256, 320];
export const IMAGE_QUALITY = 75;
export const IMAGE_HOSTS = ["images.gr-assets.com", "s.gr-assets.com"];

export type ImageCdn = "vercel" | "netlify" | "";

export function detectImageCdn(env: Record<string, string | undefined>): ImageCdn {
  const forced = env.IMAGE_CDN;
  if (forced === "vercel" || forced === "netlify" || forced === "") return forced;
  if (env.VERCEL) return "vercel";
  if (env.NETLIFY) return "netlify";
  return "";
}
