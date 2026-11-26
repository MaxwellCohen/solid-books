import { createSignal } from "solid-js";
import { FtPage } from "@/feature-tests/ft-page";

let renders = 0;

function Counter() {
  renders += 1;
  if (typeof window !== "undefined") (window as unknown as { __ftRenders: number }).__ftRenders = renders;
  const [count, setCount] = createSignal(0, { name: "ft.count" });
  return (
    <div class="flex items-center gap-3">
      <button class="rounded border px-3 py-1" data-testid="inc" onClick={() => setCount((c) => c + 1)}>
        Increment
      </button>
      <span>
        count: <b data-testid="count">{count()}</b>
      </span>
      <span>
        component runs: <b data-testid="renders">{renders}</b>
      </span>
    </div>
  );
}

export default function Reactivity() {
  return (
    <FtPage title="Reactivity">
      <Counter />
    </FtPage>
  );
}
