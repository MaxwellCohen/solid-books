// Manual caching: a hand-rolled in-memory TTL cache plus HTTP Cache-Control.
const TTL_MS = 2000;
let entry: { value: string; expires: number } | undefined;

export function GET() {
  const now = Date.now();
  if (!entry || entry.expires <= now) {
    entry = { value: `${new Date(now).toISOString()}#${Math.random().toString(36).slice(2)}`, expires: now + TTL_MS };
  }
  return new Response(JSON.stringify({ value: entry.value, expires: entry.expires }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=2, s-maxage=2, stale-while-revalidate=30",
    },
  });
}
