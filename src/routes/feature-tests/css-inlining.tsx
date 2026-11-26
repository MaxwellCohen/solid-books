import { NoHydration } from "@solidjs/web";
import routeCss from "@/feature-tests/css-inlining.css?inline";
import { FtPage } from "@/feature-tests/ft-page";

// Manual: Vite's `?inline` gives the CSS as a string; render it in a <style>
// tag. NoHydration keeps the string out of the client bundle.
export default function CssInlining() {
  return (
    <FtPage title="CSS inlining">
      <NoHydration>
        <style>{import.meta.env.SSR ? routeCss : ""}</style>
      </NoHydration>
      <p class="ft-inline-marker" data-testid="marker">
        This box is styled by route CSS that ships inline in the HTML.
      </p>
    </FtPage>
  );
}
