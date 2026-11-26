import { FtPage } from "@/feature-tests/ft-page";

// 1st-party: createRouter's preloadLinks: intentPreload() preloads a plain
// <a>'s route code and its route.preload data on hover/focus.
export default function RoutePrefetching() {
  return (
    <FtPage title="Route prefetching">
      <a class="underline" data-testid="target-link" href="/feature-tests/prefetch-target">
        Go to the prefetch target
      </a>
    </FtPage>
  );
}
