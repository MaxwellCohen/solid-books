import { FtPage } from "@/feature-tests/ft-page";

export default function MultiHostDeployment() {
  return (
    <FtPage title="Multi-host deployment">
      <p>
        Third-party: Nitro presets. The test builds with the default node-server preset and with{" "}
        <code>NITRO_PRESET=vercel</code> and <code>NITRO_PRESET=netlify</code>, then checks each
        output directory.
      </p>
    </FtPage>
  );
}
