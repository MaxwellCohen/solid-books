import { Link } from "@solidjs/meta";
import { createMemo, For } from "solid-js";
import {
  EMPTY_IMAGE_URL,
  getLargeBookImageUrl,
  GRID_COVER_SIZES,
  PRIORITY_COVER_COUNT,
} from "@/features/book/book-constants";
import { imageSrcset } from "@/lib/image-cdn";

export function BookCoverPreloads(props: {
  books: readonly { image_url: string | null }[];
}) {
  const sources = createMemo(
    () => [
      ...new Set(
        props.books.slice(0, PRIORITY_COVER_COUNT).map((book) =>
          getLargeBookImageUrl(book.image_url ?? EMPTY_IMAGE_URL),
        ),
      ),
    ],
    { name: "BookCoverPreloads.sources" },
  );

  return (
    <For each={sources()}>
      {(src) => (
        // imagesrcset/imagesizes must mirror the <img> or the preload is
        // wasted and the cover downloads twice.
        <Link
          rel="preload"
          as="image"
          href={src}
          imagesrcset={imageSrcset(src)}
          imagesizes={imageSrcset(src) ? GRID_COVER_SIZES : undefined}
          fetchpriority="high"
        />
      )}
    </For>
  );
}
