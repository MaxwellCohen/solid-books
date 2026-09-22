import type { ParentProps } from "solid-js";
import { HydrationScript } from "@solidjs/web";
import geistLatin from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";

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
        <link rel="preload" as="font" type="font/woff2" href={geistLatin} crossorigin="" />
        <title>Solid Books</title>
        <script>{themeScript}</script>
        <HydrationScript />
      </head>
      <body class="bg-surface text-black antialiased dark:bg-surface-dark dark:text-white">
        {props.children}
      </body>
    </html>
  );
}
