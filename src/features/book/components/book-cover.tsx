import { createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js";
import { Skeleton } from "@/components/ui/skeleton";
import { EMPTY_IMAGE_URL, getLargeBookImageUrl } from "@/features/book/book-constants";
import { loadBookCover } from "@/features/book/book-images";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  src: string | null;
  thumbhash: string | null;
  sizes: string;
  class?: string;
  priority?: boolean;
};

function decodeThumbhash(hash: string, thumbHashToDataURL: (bytes: Uint8Array) => string) {
  const binary = atob(hash);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return thumbHashToDataURL(bytes);
}

export function BookCover(props: Props) {
  const readySrc = createMemo(
    () => props.priority
      ? loadBookCover(props.src, true)
      : getLargeBookImageUrl(props.src ?? EMPTY_IMAGE_URL),
    { name: "BookCover.readySrc" },
  );
  const [failedSrc, setFailedSrc] = createSignal<string | null>(null, {
    name: "BookCover.failedSrc",
  });
  const [placeholder, setPlaceholder] = createSignal<string | undefined>(undefined, {
    name: "BookCover.placeholder",
  });

  createEffect(
    () => props.thumbhash,
    (hash) => {
      if (!hash) {
        setPlaceholder(undefined);
        return;
      }

      let cancelled = false;
      void import("thumbhash").then(({ thumbHashToDataURL }) => {
        if (cancelled) return;
        try {
          setPlaceholder(decodeThumbhash(hash, thumbHashToDataURL));
        } catch {
          setPlaceholder(undefined);
        }
      });
      onCleanup(() => {
        cancelled = true;
      });
    },
  );

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
            sizes={props.sizes}
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
