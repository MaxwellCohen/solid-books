import type { RouteDefinition } from "@solidjs/router";
import { createMemo, Loading } from "solid-js";
import { getPrefetchTargetData } from "@/feature-tests/prefetch-data";
import { FtPage } from "@/feature-tests/ft-page";

export const route = {
  preload: () => {
    void getPrefetchTargetData();
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
