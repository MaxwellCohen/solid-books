import "@solidjs/image/style.css";
import { SolidImage } from "@solidjs/image";
import sample from "../../feature-tests/assets/sample.jpg?image";
import offscreen from "../../feature-tests/assets/offscreen.jpg?image";
import { FtPage } from "@/feature-tests/ft-page";

// 1st-party (Solid team package): @solidjs/image's imagePlugin resizes and
// (Relative import: the plugin mis-joins "@/" alias paths.)
// re-encodes the local JPEG at build time; SolidImage emits the srcset.
export default function ImagePipeline() {
  return (
    <FtPage title="Image pipeline">
      <div data-testid="hero" style={{ width: "480px" }}>
        <SolidImage {...sample} alt="Hero sample" eager sizes="480px" />
      </div>
      <div style={{ height: "2400px" }} aria-hidden="true" />
      <div data-testid="below-fold" style={{ width: "480px" }}>
        <SolidImage {...offscreen} alt="Offscreen sample" sizes="480px" />
      </div>
    </FtPage>
  );
}
