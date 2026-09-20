/** Matches Next `cacheLife('hours')`: revalidate 1h, expire 24h. */
export const CATALOG_CACHE_REVALIDATE_SECONDS = 3600;
export const CATALOG_CACHE_EXPIRE_SECONDS = 86400;

/** Match next-books HTML Cache-Control per host (Vercel vs Netlify/Cloudflare/local). */
export const VERCEL_DOCUMENT_CACHE_CONTROL = "public, max-age=0, must-revalidate";
export const PRIVATE_DOCUMENT_CACHE_CONTROL =
  "private, no-cache, no-store, max-age=0, must-revalidate";

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

/** Public document Cache-Control matching next-books on this host. */
export function hostDocumentCacheControl(): string {
  return isVercel() ? VERCEL_DOCUMENT_CACHE_CONTROL : PRIVATE_DOCUMENT_CACHE_CONTROL;
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
