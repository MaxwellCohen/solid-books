import { createMemo, createSignal, Show } from "solid-js";
import { thumbHashToDataURL } from "thumbhash";
import { Skeleton } from "@/components/ui/skeleton";
import { EMPTY_IMAGE_URL, getLargeBookImageUrl } from "@/features/book/book-constants";
import { loadBookCover } from "@/features/book/book-images";
import { imageSrcset } from "@/lib/image-cdn";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  src: string | null;
  thumbhash: string | null;
  sizes: string;
  class?: string;
  priority?: boolean;
};

// Intrinsic 2:3 box for the browser; CSS sizes the image to its container.
const COVER_WIDTH = 320;
const COVER_HEIGHT = 480;

function thumbhashUrl(hash: string | null) {
  if (!hash) return undefined;
  try {
    const binary = atob(hash);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return thumbHashToDataURL(bytes);
  } catch {
    return undefined;
  }
}

export function BookCover(props: Props) {
  const readySrc = createMemo(
    () => props.priority
      ? loadBookCover(props.src, true, props.sizes)
      : getLargeBookImageUrl(props.src ?? EMPTY_IMAGE_URL),
    { name: "BookCover.readySrc" },
  );
  const [failedSrc, setFailedSrc] = createSignal<string | null>(null, {
    name: "BookCover.failedSrc",
  });
  const placeholder = () => thumbhashUrl(props.thumbhash);

  return (
    <div
      class={cn(
        "bg-card dark:bg-card-dark relative aspect-[2/3] w-full overflow-hidden rounded-md",
        props.class,
      )}
      style={
        placeholder()
          ? {
              "background-image": `url(${placeholder()})`,
              "background-size": "cover",
              "background-position": "center",
            }
          : undefined
      }
    >
      <Show
        when={readySrc() !== failedSrc() ? readySrc() : null}
        fallback={
          <div
            role="img"
            aria-label={`Cover unavailable for ${props.title}`}
            class="text-muted absolute inset-0 flex items-center justify-center p-3 text-center text-sm"
          >
            Cover unavailable
          </div>
        }
      >
        {(src) => (
          <img
            alt={props.title}
            class="absolute inset-0 h-full w-full object-cover"
            decoding="async"
            loading={props.priority ? "eager" : "lazy"}
            fetchpriority={props.priority ? "high" : undefined}
            width={COVER_WIDTH}
            height={COVER_HEIGHT}
            sizes={props.sizes}
            srcset={imageSrcset(src())}
            src={src()}
            onError={(event) => setFailedSrc(event.currentTarget.getAttribute("src"))}
          />
        )}
      </Show>
    </div>
  );
}

export function BookCoverSkeleton(props: { class?: string }) {
  return <Skeleton class={cn("skeleton-subtle aspect-[2/3] w-full rounded-md", props.class)} />;
}
