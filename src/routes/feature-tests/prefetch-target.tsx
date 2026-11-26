import type { RouteDefinition } from "@solidjs/router";
import { createMemo, Loading } from "solid-js";
import { getPrefetchTargetData } from "@/feature-tests/prefetch-data";
import { FtPage } from "@/feature-tests/ft-page";

// Loaded on demand: a static import here lands in the client entry (route
// exports are bundled with the router), which would put the server-function
// runtime on every page, including the home page.
export const route = {
  preload: () => {
    void import("@/feature-tests/prefetch-data").then((m) => m.getPrefetchTargetData());
  },
} satisfies RouteDefinition;

export default function PrefetchTarget() {
  const data = createMemo(() => getPrefetchTargetData());
  return (
    <FtPage title="Prefetch target">
      <Loading fallback={<p>Loading…</p>}>
        <p data-testid="target-data">FT_PREFETCH_TARGET served at {data().servedAt}</p>
      </Loading>
    </FtPage>
  );
}
