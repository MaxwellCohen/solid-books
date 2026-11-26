import { NoHydration } from "@solidjs/web";

// Server time baked into the HTML. NoHydration keeps the client from
// re-rendering it, so the value seen is the one the server produced.
export function RenderStamp(props: { mode: string }) {
  return (
    <NoHydration>
      <p>
        {props.mode} rendered at <time data-testid="stamp">{new Date().toISOString()}</time>
      </p>
    </NoHydration>
  );
}
