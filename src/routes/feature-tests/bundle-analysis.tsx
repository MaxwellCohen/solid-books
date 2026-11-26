import { FtPage } from "@/feature-tests/ft-page";

export default function BundleAnalysis() {
  return (
    <FtPage title="Bundle analysis">
      <p>
        Third-party: <code>ANALYZE=1 vite build</code> adds <code>rollup-plugin-visualizer</code> (client
        environment only) and writes a treemap HTML report. The test runs the build.
      </p>
    </FtPage>
  );
}
