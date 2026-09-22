import { Image as UnpicImage } from "@unpic/solid";
import type { ComponentProps } from "solid-js";

const IPX_OPTIONS = { ipx: { baseURL: "/_ipx" } } as const;

type UnpicProps = ComponentProps<typeof UnpicImage>;

export type ImageProps = Omit<UnpicProps, "cdn" | "fallback" | "options"> & {
  options?: UnpicProps["options"];
};

/** App image component: always optimized through the local IPX endpoint. */
export function Image(props: ImageProps) {
  return (
    <UnpicImage
      {...props}
      cdn="ipx"
      options={{ ...IPX_OPTIONS, ...props.options }}
    />
  );
}
