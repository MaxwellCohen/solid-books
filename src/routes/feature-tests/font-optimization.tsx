import { FtPage } from "@/feature-tests/ft-page";

// Third-party: @fontsource-variable/geist is imported by src/app.css (inlined)
// and src/Document.tsx adds <link rel="preload" as="font"> for the latin woff2.
export default function FontOptimization() {
  return (
    <FtPage title="Font optimization">
      <p data-testid="geist" style={{ "font-family": "'Geist Variable', sans-serif" }}>
        Self-hosted Geist Variable via @fontsource-variable/geist, preloaded from the document head.
      </p>
    </FtPage>
  );
}
