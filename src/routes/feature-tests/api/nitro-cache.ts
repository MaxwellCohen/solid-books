// Fresh value on every invocation; vite.config.ts sets a Nitro routeRules
// `cache: { maxAge: 2 }` on this path to check whether Nitro caches it.
export function GET() {
  return new Response(
    JSON.stringify({ value: `${new Date().toISOString()}#${Math.random().toString(36).slice(2)}` }),
    { headers: { "content-type": "application/json" } },
  );
}
