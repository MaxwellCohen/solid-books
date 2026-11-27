import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import "@testing-library/jest-dom/vitest";
import { createSignal, flush } from "solid-js";
import { sharedConfig } from "solid-js/internal";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { EMPTY_IMAGE_URL, ITEMS_PER_PAGE, PRIORITY_COVER_COUNT } from "@/features/book/book-constants";
import { COVER_REVEAL_TIMEOUT_MS, loadBookCover, preloadBookCovers } from "@/features/book/book-images";
import { BookCover } from "./book-cover";

let requests: {
  src: string;
  resolve: () => void;
  reject: (error: Error) => void;
}[];
let observed: { element: Element; callback: IntersectionObserverCallback }[];

beforeEach(() => {
  requests = [];
  observed = [];
  vi.stubGlobal(
    "Image",
    class {
      src = "";
      complete = false;
      naturalWidth = 0;

      decode() {
        const { promise, resolve, reject } = Promise.withResolvers<void>();
        requests.push({ src: this.src, resolve, reject });
        return promise;
      }
    },
  );
  // jsdom has no IntersectionObserver; tests decide when a cover is visible.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(element: Element) {
        observed.push({ element, callback: this.callback });
      }
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function scrollIntoView() {
  for (const { element, callback } of observed) {
    callback(
      [{ target: element, isIntersecting: true } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  }
  flush();
}

function coverImage(name: string) {
  return screen
    .getAllByRole("img", { name })
    .find((image) => image.tagName === "IMG")!;
}

test("priority covers render right away with a high fetch priority", () => {
  render(() => (
    <BookCover
      priority
      title="Dune"
      src="https://images.gr-assets.com/books/123m/456.jpg"
      sizes="33vw"
      thumbhash={null}
    />
  ));
  flush();

  const image = coverImage("Dune");
  expect(image).toHaveAttribute("src", "https://images.gr-assets.com/books/123l/456.jpg");
  expect(image).toHaveAttribute("sizes", "33vw");
  expect(image).toHaveAttribute("fetchpriority", "high");
  expect(image).toHaveAttribute("width", "320");
  expect(image).toHaveAttribute("height", "480");
});

test("books without a cover URL use the no-photo image", () => {
  render(() => <BookCover priority title="No cover" src={null} sizes="33vw" thumbhash={null} />);
  flush();
  expect(coverImage("No cover")).toHaveAttribute("src", EMPTY_IMAGE_URL);
});

test("lazy covers wait until they are near the viewport", () => {
  render(() => <BookCover title="Lazy" src="/lazy.jpg" sizes="33vw" thumbhash={null} />);
  flush();

  expect(screen.queryByRole("img", { name: "Lazy" })).not.toBeInTheDocument();
  scrollIntoView();
  const image = coverImage("Lazy");
  expect(image).toHaveAttribute("src", "/lazy.jpg");
  expect(image).toHaveAttribute("decoding", "async");
  expect(image).not.toHaveAttribute("fetchpriority");
});

test("a failed cover shows the unavailable message", () => {
  render(() => <BookCover priority title="Broken" src="/broken.jpg" sizes="33vw" thumbhash={null} />);
  flush();

  fireEvent.error(coverImage("Broken"));
  flush();
  expect(screen.getByRole("img", { name: "Cover unavailable for Broken" })).toBeInTheDocument();
});

test("changing the book swaps the cover", () => {
  const [src, setSrc] = createSignal("/first.jpg");
  render(() => <BookCover priority title="Book" src={src()} sizes="33vw" thumbhash={null} />);
  flush();
  expect(coverImage("Book")).toHaveAttribute("src", "/first.jpg");

  setSrc("/second.jpg");
  flush();
  expect(coverImage("Book")).toHaveAttribute("src", "/second.jpg");
});

test("loadBookCover resolves to null when the cover cannot be decoded", async () => {
  const pending = loadBookCover("/bad-decode.jpg");
  requests[0].reject(new Error("Image could not be decoded"));
  expect(await pending).toBeNull();
});

test("loadBookCover gives up waiting after the reveal timeout", async () => {
  vi.useFakeTimers();
  const pending = loadBookCover("/stalled.jpg");
  await vi.advanceTimersByTimeAsync(COVER_REVEAL_TIMEOUT_MS);
  expect(await pending).toBe("/stalled.jpg");
  expect(vi.getTimerCount()).toBe(0);
});

test("hydration skips decoding without marking the image ready for later navigation", () => {
  const hydrating = sharedConfig.hydrating;
  try {
    sharedConfig.hydrating = true;
    expect(loadBookCover("/hydrated.jpg")).toBe("/hydrated.jpg");
    expect(requests).toHaveLength(0);
  } finally {
    sharedConfig.hydrating = hydrating;
  }

  const pending = loadBookCover("/hydrated.jpg");
  expect(pending).toBeInstanceOf(Promise);
  expect(requests).toHaveLength(1);
  requests[0].resolve();
  return pending;
});

test("grid preloading starts only priority covers in parallel and preserves the whole page", async () => {
  const books = Array.from({ length: ITEMS_PER_PAGE }, (_, index) => ({
    image_url: `/page-${index}.jpg`,
  }));
  const pending = preloadBookCovers(books);

  expect(requests.map((request) => request.src)).toEqual(
    books.slice(0, PRIORITY_COVER_COUNT).map((book) => book.image_url),
  );
  requests.forEach((request) => request.resolve());
  expect(await pending).toBe(books);
  expect(preloadBookCovers(books)).toBe(books);
  expect(requests).toHaveLength(PRIORITY_COVER_COUNT);
});
