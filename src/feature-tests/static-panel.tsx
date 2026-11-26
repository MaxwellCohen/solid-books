// Experimental Solid 2 server component: a "use server" function that returns
// a component. Its body (and this marker) should stay on the server.
export async function getStaticPanel() {
  "use server";
  return function StaticPanel() {
    return (
      <section data-testid="static-panel" class="rounded border p-3">
        FT_STATIC_ISLAND_MARKER_9c41: rendered on the server, no client code.
      </section>
    );
  };
}
