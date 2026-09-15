import { Errored } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { BookMark } from "@/components/book-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { FastLink } from "@/components/ui/fast-link";
import { GitHubIcon } from "@/components/ui/github-icon";
import { ApiDelay } from "@/features/book/components/api-delay";
import { BookFilters } from "@/features/book/components/book-filters";
import { CatalogSize } from "@/features/book/components/catalog-size";
import { buildHref, parseSearchParams } from "@/lib/url-state";

export function BookSidebar(props: { idPrefix: string; mobile?: boolean }) {
  const [searchParams] = useSearchParams();
  const homeHref = () =>
    buildHref({ delay: parseSearchParams(searchParams).delay });

  return (
    <>
      <div class="flex items-center justify-between gap-2">
        <FastLink
          aria-label="Solid Books home"
          class="inline-flex items-center gap-2 text-base font-semibold tracking-tight"
          href={homeHref()}
          prefetch={true}
        >
          <BookMark class="text-action size-5" />
          Solid Books
        </FastLink>
      </div>
      <div class="border-divider dark:border-divider-dark mt-6 border-b pb-5">
        <CatalogSize />
      </div>
      <div class="mt-5 mb-4">
        <ApiDelay idPrefix={props.idPrefix} />
      </div>
      <p class="text-muted mb-4 text-xs font-semibold tracking-wide uppercase">
        Filters
      </p>
      <Errored
        fallback={(_error, reset) => (
          <ErrorState compact title="Filters unavailable">
            <Button class="mt-1" onClick={reset} size="sm" variant="secondary">
              Try again
            </Button>
          </ErrorState>
        )}
      >
        <BookFilters idPrefix={props.idPrefix} />
      </Errored>
      {props.mobile ? null : (
        <div class="border-divider dark:border-divider-dark mt-4 flex items-center justify-between gap-2 border-t pt-4">
          <ThemeToggle variant="inline" />
          <a
            aria-label="View source on GitHub"
            class="text-muted rounded-full p-1.5 transition-colors hover:text-black dark:hover:text-white"
            href="https://github.com/brenelz/solid-books"
            rel="noopener noreferrer"
            target="_blank"
          >
            <GitHubIcon class="size-4" />
          </a>
        </div>
      )}
    </>
  );
}
