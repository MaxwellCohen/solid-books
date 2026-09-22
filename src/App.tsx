import { Title } from "@solidjs/meta";
import { useLocation } from "@solidjs/router";
import { For, Loading, Show } from "solid-js";
import { env } from "virtual:env/client";
import { MobileBookSidebar, MobileBookSidebarTrigger } from "@/components/mobile-book-sidebar";
import { ThemeProvider } from "@/components/theme/theme";
import { BookSearch } from "@/features/book/components/book-search";
import { BookSidebar } from "@/features/book/components/book-sidebar";
import { Router } from "./router";
import "./app.css";

const SHELL_PLACEHOLDERS = Array.from({ length: 12 }, (_, index) => index);

function RouteShellFallback() {
  const location = useLocation();
  const isBookDetail = () => /^\/\d+\/?$/.test(location.pathname);

  return (
    <Show
      when={isBookDetail()}
      fallback={
        <div class="flex min-h-0 flex-1 flex-col">
          <div class="flex-1 px-4 py-5 sm:px-6">
            <div
              aria-hidden="true"
              class="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
            >
              <For each={SHELL_PLACEHOLDERS}>
                {() => (
                  <div class="skeleton-animation skeleton-subtle aspect-[2/3] w-full rounded-md" />
                )}
              </For>
            </div>
          </div>
        </div>
      }
    >
      <div aria-hidden="true" class="flex flex-1 flex-col gap-8 px-4 py-5 sm:px-6 md:flex-row md:gap-10">
        <div class="skeleton-animation skeleton-subtle mx-auto aspect-[2/3] w-40 rounded-md sm:w-48 md:mx-0 md:w-72" />
        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <div class="skeleton-animation skeleton-subtle h-8 w-3/4 max-w-md rounded-md" />
          <div class="skeleton-animation skeleton-subtle h-4 w-40 rounded-md" />
          <div class="skeleton-animation skeleton-subtle mt-2 h-3.5 w-full max-w-prose rounded-md" />
          <div class="skeleton-animation skeleton-subtle h-3.5 w-4/5 max-w-prose rounded-md" />
        </div>
      </div>
    </Show>
  );
}

export default function App() {
  return (
    <Router>
      {(props) => (
        <ThemeProvider>
          <Title>{env.VITE_APP_NAME}</Title>
          <MobileBookSidebar sidebar={<BookSidebar idPrefix="mobile" mobile />}>
            <div class="group flex min-h-dvh">
              <aside class="border-divider bg-surface dark:border-divider-dark dark:bg-surface-dark sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r px-5 py-5 md:flex">
                <BookSidebar idPrefix="desktop" />
              </aside>

              <div class="flex min-w-0 flex-1 flex-col">
                <header class="border-divider bg-surface dark:border-divider-dark dark:bg-surface-dark sticky top-0 z-20 flex items-center gap-2 border-b px-4 py-3 sm:gap-3 sm:px-6">
                  <MobileBookSidebarTrigger />
                  <BookSearch />
                </header>

                <main class="flex min-w-0 flex-1 flex-col">
                  <Loading fallback={<RouteShellFallback />}>
                    {props.children}
                  </Loading>
                </main>
              </div>
            </div>
          </MobileBookSidebar>
        </ThemeProvider>
      )}
    </Router>
  );
}
