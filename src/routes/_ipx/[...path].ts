import {
  createIPX,
  createIPXFetchHandler,
  ipxFSStorage,
  ipxHttpStorage,
  parseIPXURL,
} from "ipx";

const IPX_BASE = "/_ipx";

const ipx = createIPX({
  storage: ipxFSStorage({ dir: "./public" }),
  httpStorage: ipxHttpStorage({
    domains: ["images.gr-assets.com", "s.gr-assets.com"],
    fetchOptions: {
      headers: {
        // Goodreads CDN rejects bare server fetches without a UA.
        "User-Agent":
          "Mozilla/5.0 (compatible; SolidBooksIPX/1.0; +https://github.com/solidjs)",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.goodreads.com/",
      },
    },
  }),
});

const handle = createIPXFetchHandler(ipx, {
  parseURL(url) {
    const parsed = new URL(url);
    if (parsed.pathname === IPX_BASE || parsed.pathname.startsWith(`${IPX_BASE}/`)) {
      parsed.pathname = parsed.pathname.slice(IPX_BASE.length) || "/";
    }
    return parseIPXURL(parsed.href);
  },
});

export function GET(event: { request: Request }) {
  return handle(event.request);
}
