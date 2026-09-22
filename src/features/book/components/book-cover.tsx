import { createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COVER_IMAGE_HEIGHT,
  COVER_IMAGE_WIDTH,
  EMPTY_IMAGE_URL,
  getLargeBookImageUrl,
} from "@/features/book/book-constants";
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
  const source = createMemo(
    () => getLargeBookImageUrl(props.src ?? EMPTY_IMAGE_URL),
    { name: "BookCover.source" },
  );
  const readySrc = createMemo(
    () => (props.priority ? loadBookCover(props.src, true) : source()),
    { name: "BookCover.readySrc" },
  );
  const [failed, setFailed] = createSignal(false, { name: "BookCover.failed" });
  const [placeholder, setPlaceholder] = createSignal<string | undefined>(undefined, {
    name: "BookCover.placeholder",
  });

  createEffect(
    () => source(),
    () => {
      setFailed(false);
    },
  );

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
        when={!failed() ? readySrc() : null}
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
          <Image
            alt={props.title}
            class="absolute inset-0 h-full w-full object-cover"
            decoding="async"
            layout="constrained"
            objectFit="cover"
            priority={props.priority}
            sizes={props.sizes}
            src={src()}
            unstyled
            width={COVER_IMAGE_WIDTH}
            height={COVER_IMAGE_HEIGHT}
            onError={() => setFailed(true)}
          />
        )}
      </Show>
    </div>
  );
}

export function BookCoverSkeleton(props: { class?: string }) {
  return <Skeleton class={cn("skeleton-subtle aspect-[2/3] w-full rounded-md", props.class)} />;
}
