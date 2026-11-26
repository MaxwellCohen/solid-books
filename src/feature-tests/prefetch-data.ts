import { query } from "@solidjs/router";

export const getPrefetchTargetData = query(async function getPrefetchTargetData() {
  "use server";
  return { servedAt: new Date().toISOString() };
}, "ftPrefetchTarget");
