import { FtPage } from "@/feature-tests/ft-page";

export default function Caching() {
  return (
    <FtPage title="Caching">
      <p>
        Manual: <code>/feature-tests/api/manual-cache</code> keeps a value in a hand-rolled
        in-memory TTL cache (2 s) and sends <code>Cache-Control: public, max-age=2, s-maxage=2</code>.
      </p>
      <p>
        Also probed: <code>/feature-tests/api/nitro-cache</code> under a Nitro{" "}
        <code>routeRules</code> <code>cache: {"{ maxAge: 2 }"}</code> rule.
      </p>
    </FtPage>
  );
}
