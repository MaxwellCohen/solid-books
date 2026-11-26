import { createSignal } from "solid-js";

export function CounterIsland() {
  const [count, setCount] = createSignal(0);
  return (
    <button class="rounded border px-3 py-1" data-testid="island" onClick={() => setCount((c) => c + 1)}>
      Island clicks: {count()}
    </button>
  );
}
