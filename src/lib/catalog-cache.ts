/** Matches Next `cacheLife('hours')`: revalidate 1h, expire 24h. */
export const CATALOG_CACHE_REVALIDATE_SECONDS = 3600;
export const CATALOG_CACHE_EXPIRE_SECONDS = 86400;

export const HTML_CACHE_CONTROL = `public, s-maxage=${CATALOG_CACHE_REVALIDATE_SECONDS}, stale-while-revalidate=${CATALOG_CACHE_EXPIRE_SECONDS}`;

const TTL_MS = CATALOG_CACHE_REVALIDATE_SECONDS * 1000;

type Entry<T> = { expiresAt: number; value: T };

const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function isVercel() {
  return typeof process !== "undefined" && Boolean(process.env.VERCEL) && !process.env.CLOUDFLARE;
}

function isNetlify() {
  return typeof process !== "undefined" && Boolean(process.env.NETLIFY) && !process.env.CLOUDFLARE;
}

function memoryGet<T>(key: string): T | undefined {
  const hit = memory.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;
}

function memorySet<T>(key: string, value: T) {
  memory.set(key, { expiresAt: Date.now() + TTL_MS, value });
}

function edgeRequest(key: string) {
  return new Request(`https://books-catalog-cache.local/v1/${encodeURIComponent(key)}`);
}

function edgeCache(): Cache | undefined {
  const cachesApi = (globalThis as typeof globalThis & { caches?: CacheStorage }).caches;
  return cachesApi?.default;
}

function delayFromRequest(request: Request): number {
  try {
    const delay = Number(new URL(request.url).searchParams.get("delay") ?? 0);
    return Number.isFinite(delay) ? Math.max(0, delay) : 0;
  } catch {
    return 0;
  }
}

function isCacheableHtmlRequest(request: Request): boolean {
  return request.method === "GET" && delayFromRequest(request) <= 0;
}

function applyHtmlCacheHeaders(headers: Headers) {
  headers.set("Cache-Control", HTML_CACHE_CONTROL);
  headers.set("CDN-Cache-Control", HTML_CACHE_CONTROL);
  headers.set("Vercel-CDN-Cache-Control", HTML_CACHE_CONTROL);
  headers.set("Netlify-CDN-Cache-Control", HTML_CACHE_CONTROL);
}

async function platformGet<T>(key: string): Promise<T | undefined> {
  try {
    if (isVercel()) {
      const { getCache } = await import("@vercel/functions");
      const value = await getCache({ namespace: "catalog" }).get(key);
      if (value != null) return value as T;
      return;
    }
  } catch {
    // Optional dependency / not running on Vercel.
  }

  try {
    if (isNetlify()) {
      const { getStore } = await import("@netlify/blobs");
      const stored = (await getStore("catalog-cache").get(key, { type: "json" })) as Entry<T> | null;
      if (stored && stored.expiresAt > Date.now()) return stored.value;
      return;
    }
  } catch {
    // Optional dependency / not running on Netlify.
  }

  try {
    const cache = edgeCache();
    if (cache) {
      const hit = await cache.match(edgeRequest(key));
      if (hit?.ok) return (await hit.json()) as T;
    }
  } catch {
    // Ignore Cache API failures.
  }
}

async function platformSet<T>(key: string, value: T): Promise<void> {
  try {
    if (isVercel()) {
      const { getCache } = await import("@vercel/functions");
      await getCache({ namespace: "catalog" }).set(key, value, {
        tags: ["catalog"],
        ttl: CATALOG_CACHE_REVALIDATE_SECONDS,
      });
      return;
    }
  } catch {
    // Optional dependency / not running on Vercel.
  }

  try {
    if (isNetlify()) {
      const { getStore } = await import("@netlify/blobs");
      await getStore("catalog-cache").setJSON(key, {
        expiresAt: Date.now() + TTL_MS,
        value,
      });
      return;
    }
  } catch {
    // Optional dependency / not running on Netlify.
  }

  try {
    const cache = edgeCache();
    if (cache) {
      await cache.put(
        edgeRequest(key),
        new Response(JSON.stringify(value), {
          headers: {
            "Cache-Control": `max-age=${CATALOG_CACHE_REVALIDATE_SECONDS}`,
            "Content-Type": "application/json",
          },
        }),
      );
    }
  } catch {
    // Ignore Cache API write failures.
  }
}

export async function cacheLifeHours<T>(key: string, load: () => Promise<T>): Promise<T> {
  const cached = memoryGet<T>(key);
  if (cached !== undefined) return cached;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const next = (async () => {
    const remote = await platformGet<T>(key);
    if (remote !== undefined) {
      memorySet(key, remote);
      return remote;
    }

    const value = await load();
    memorySet(key, value);
    await platformSet(key, value);
    return value;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, next);
  return next;
}

export function withTtlCache<Args extends unknown[], Result>(
  name: string,
  fn: (...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return (...args: Args) => cacheLifeHours(`${name}:${JSON.stringify(args)}`, () => fn(...args));
}

export async function matchCachedHtml(request: Request): Promise<Response | undefined> {
  if (!isCacheableHtmlRequest(request)) return;
  const cache = edgeCache();
  if (!cache) return;
  try {
    const hit = await cache.match(request);
    return hit?.ok ? hit : undefined;
  } catch {
    return;
  }
}

export async function storeCachedHtml(request: Request, response: Response): Promise<void> {
  if (!isCacheableHtmlRequest(request) || !response.ok) return;
  if (!response.headers.get("content-type")?.includes("text/html")) return;
  const cache = edgeCache();
  if (!cache) return;
  try {
    const copy = response.clone();
    applyHtmlCacheHeaders(copy.headers);
    await cache.put(request, copy);
  } catch {
    // Best-effort HTML edge cache.
  }
}
