import { For } from "solid-js";
import { FEATURES, FtPage } from "@/feature-tests/ft-page";

export default function FeatureTestsIndex() {
  return (
    <FtPage title="Feature tests">
      <ul class="list-disc pl-6">
        <For each={FEATURES}>
          {(feature) => (
            <li>
              <a class="underline" href={`/feature-tests/${feature[0]}`}>
                {feature[1]}
              </a>
            </li>
          )}
        </For>
      </ul>
    </FtPage>
  );
}
