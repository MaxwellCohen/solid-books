import type { JSX } from "@solidjs/web";
import { FtPage } from "@/feature-tests/ft-page";

export default function RenderModes(props: { children?: JSX.Element }) {
  return (
    <FtPage title="Render modes">
      <ul class="list-disc pl-6">
        <li>
          <a class="underline" href="/feature-tests/render-modes/prerendered">Prerendered at build</a>{" "}
          (nitro.prerender.routes)
        </li>
        <li>
          <a class="underline" href="/feature-tests/render-modes/ssr">Server-rendered per request</a>
        </li>
      </ul>
      {props.children}
    </FtPage>
  );
}
