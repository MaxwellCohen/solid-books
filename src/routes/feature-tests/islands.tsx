import { dynamic } from "@solidjs/web";
import { Loading } from "solid-js";
import { CounterIsland } from "@/feature-tests/counter-island";
import { FtPage } from "@/feature-tests/ft-page";
import { getStaticPanel } from "@/feature-tests/static-panel";

// Experimental: serverFunctions.components (vite.config.ts) lets a
// "use server" function return a component, mounted here with dynamic().
export default function Islands() {
  const StaticPanel = dynamic(() => getStaticPanel());
  return (
    <FtPage title="Islands">
      <Loading fallback={<p>Loading server component…</p>}>
        <StaticPanel />
      </Loading>
      <CounterIsland />
    </FtPage>
  );
}
