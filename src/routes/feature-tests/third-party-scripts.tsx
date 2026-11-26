import { NoHydration } from "@solidjs/web";
import { FtPage } from "@/feature-tests/ft-page";

// Manual: an inline loader injects the third-party script once the page has
// loaded and the browser is idle (the pattern from the cell's example).
const lazyLoader = `addEventListener("load",function(){(window.requestIdleCallback||setTimeout)(function(){var s=document.createElement("script");s.src="/feature-tests/third-party.js";s.async=true;document.head.appendChild(s);});});`;

export default function ThirdPartyScripts() {
  return (
    <FtPage title="Third-party scripts">
      <NoHydration>
        <script>{lazyLoader}</script>
      </NoHydration>
      <p>/feature-tests/third-party.js is injected after load, when the browser is idle.</p>
    </FtPage>
  );
}
