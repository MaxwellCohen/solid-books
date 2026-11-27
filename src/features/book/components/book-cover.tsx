import { SolidImage } from "@solidjs/image";
import { thumbHashToDataURL } from "thumbhash";
import { Skeleton } from "@/components/ui/skeleton";
import { EMPTY_IMAGE_URL, getLargeBookImageUrl } from "@/features/book/book-constants";
import { imageVariants } from "@/lib/image-cdn";
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
// Shown behind the cover until it loads when a book has no thumbhash.
const PLACEHOLDER_COLOR = "transparent";

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

// Host image CDN variants (Vercel/Netlify). Empty on other hosts, where the
// original cover URL is used as-is.
const transformer = { transform: (src: { source: string }) => imageVariants(src.source) };
const hasCdn = imageVariants(EMPTY_IMAGE_URL).length > 0;

export function BookCover(props: Props) {
  const source = () => getLargeBookImageUrl(props.src ?? EMPTY_IMAGE_URL);
  const placeholder = () => {
    const url = thumbhashUrl(props.thumbhash);
    return url ? { url, color: PLACEHOLDER_COLOR } : undefined;
  };

  return (
    <div
      class={cn(
        "bg-card dark:bg-card-dark relative aspect-[2/3] w-full overflow-hidden rounded-md",
        props.class,
      )}
    >
      <SolidImage
        src={{
          source: source(),
          width: COVER_WIDTH,
          height: COVER_HEIGHT,
          options: {},
          placeholder: placeholder(),
        }}
        alt={props.title}
        sizes={props.sizes}
        eager={props.priority}
        transformer={hasCdn ? transformer : undefined}
        errorFallback={() => (
          <div
            role="img"
            aria-label={`Cover unavailable for ${props.title}`}
            class="bg-card dark:bg-card-dark text-muted absolute inset-0 flex items-center justify-center p-3 text-center text-sm"
          >
            Cover unavailable
          </div>
        )}
      />
    </div>
  );
}

export function BookCoverSkeleton(props: { class?: string }) {
  return <Skeleton class={cn("skeleton-subtle aspect-[2/3] w-full rounded-md", props.class)} />;
}
