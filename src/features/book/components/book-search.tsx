import { createSignal, createTrackedEffect, createUniqueId, isPending } from "solid-js";
import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";
import { IconButton } from "@/components/ui/icon-button";
import { SearchIcon, XIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { buildHref, parseSearchParams, withFilters } from "@/lib/url-state";

const DEBOUNCE_MS = 220;

export function BookSearch() {
  const location = useLocation();
  const navigateTo = useNavigate();
  const [searchParams] = useSearchParams();
  const [draft, setDraft] = createSignal<string>();
  const inputId = createUniqueId();
  const committed = () => parseSearchParams(searchParams).search ?? "";
  const value = () => draft() ?? committed();

  createTrackedEffect(() => {
    committed();
    setDraft(undefined);
  });

  let timer: ReturnType<typeof setTimeout> | undefined;

  createTrackedEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  });

  function navigate(nextValue: string) {
    const query = nextValue.trim();
    const current = parseSearchParams(searchParams);
    navigateTo(buildHref(withFilters(current, { search: query || undefined })), {
      replace: location.pathname === "/",
      scroll: false,
    });
  }

  function schedule(nextValue: string) {
    setDraft(nextValue);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => navigate(nextValue), DEBOUNCE_MS);
  }

  return (
    <form
      aria-busy={isPending(() => searchParams.search) ? "true" : undefined}
      class="relative flex-1"
      data-filtering={isPending(() => searchParams.search) ? "" : undefined}
      onSubmit={(event) => {
        event.preventDefault();
        if (timer) clearTimeout(timer);
        navigate(value());
      }}
      role="search"
    >
      <label class="sr-only" for={inputId}>
        Search books
      </label>
      <span
        aria-hidden="true"
        class="text-muted pointer-events-none absolute top-1/2 left-3.5 flex size-4 -translate-y-1/2 items-center justify-center"
      >
        {isPending(() => searchParams.search) ? (
          <Spinner class="size-4" />
        ) : (
          <SearchIcon class="size-4" />
        )}
      </span>
      <Input
        class="peer"
        id={inputId}
        name="search"
        onInput={(event) => {
          schedule((event.currentTarget as HTMLInputElement).value);
        }}
        placeholder="Search books…"
        type="search"
        value={value()}
        variant="search"
      />
      <IconButton
        class="absolute top-1/2 right-1.5 -translate-y-1/2 peer-placeholder-shown:hidden"
        label="Clear search"
        onClick={() => {
          if (timer) clearTimeout(timer);
          setDraft("");
          navigate("");
        }}
      >
        <XIcon class="size-4" />
      </IconButton>
    </form>
  );
}
