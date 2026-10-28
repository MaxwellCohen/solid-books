import type { ParentProps } from "solid-js";
import { HydrationScript, NoHydration } from "@solidjs/web";
import geistLatin from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import appCss from "./app.css?inline";

const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((t==="system"||!t)&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/favicon.ico" />
        {/* Self-hosted variable Geist: no cross-origin stylesheet on the
            critical path, and the latin face starts downloading with the HTML. */}
        <link rel="preload" as="font" type="font/woff2" href={geistLatin} crossorigin="" />
        <title>Solid Books</title>
        {/* The whole stylesheet is ~8 KiB gzip; inlining it lets the first
            HTML chunk paint without a render-blocking CSS round-trip.
            NoHydration leaves the server node in place, so the CSS string
            stays out of the client bundle. */}
        <NoHydration>
          <style>{import.meta.env.SSR ? appCss : ""}</style>
        </NoHydration>
        <script>{themeScript}</script>
        <HydrationScript />
      </head>
      <body class="bg-surface text-black antialiased dark:bg-surface-dark dark:text-white">
        {props.children}
      </body>
    </html>
  );
}
