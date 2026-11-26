import type { JSX } from "@solidjs/web";
import { Title } from "@solidjs/meta";

export const FEATURES = [
  ["css-inlining", "CSS inlining (Manual: Vite ?inline + <style>)"],
  ["font-optimization", "Font optimization (Third-party: @fontsource-variable + preload)"],
  ["image-pipeline", "Image pipeline (1st-party: @solidjs/image)"],
  ["caching", "Caching (Manual: hand-rolled TTL cache + Cache-Control)"],
  ["route-prefetching", "Route prefetching (1st-party: Solid Router link preload)"],
  ["islands", "Islands (Experimental: Solid 2 server components)"],
  ["render-modes", "Render modes (1st-party: Nitro prerender + SSR)"],
  ["reactivity", "Reactivity (1st-party: signals)"],
  ["bundle-analysis", "Bundle analysis (Third-party: rollup-plugin-visualizer)"],
  ["third-party-scripts", "Third-party scripts (Manual: idle loader)"],
  ["multi-host-deployment", "Multi-host deployment (Third-party: Nitro presets)"],
] as const;

export function FtPage(props: { title: string; children?: JSX.Element }) {
  return (
    <div class="flex flex-col gap-4 px-4 py-5 sm:px-6" data-ft-page>
      <Title>{`${props.title} · Feature tests`}</Title>
      <p>
        <a class="underline" href="/feature-tests">
          ← Feature tests
        </a>
      </p>
      <h1 class="text-2xl font-semibold">{props.title}</h1>
      {props.children}
    </div>
  );
}
