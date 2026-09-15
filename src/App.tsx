import { Title } from "@solidjs/meta";
import { env } from "virtual:env/client";
import { MobileBookSidebar, MobileBookSidebarTrigger } from "@/components/mobile-book-sidebar";
import { ThemeProvider } from "@/components/theme/theme";
import { BookSearch } from "@/features/book/components/book-search";
import { BookSidebar } from "@/features/book/components/book-sidebar";
import { Router } from "./router";
import "./app.css";

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
                <header class="border-divider bg-surface/80 dark:border-divider-dark dark:bg-surface-dark/80 sticky top-0 z-20 flex items-center gap-2 border-b px-4 py-3 backdrop-blur-md backdrop-saturate-150 sm:gap-3 sm:px-6">
                  <MobileBookSidebarTrigger />
                  <BookSearch />
                </header>

                <main class="flex min-w-0 flex-1 flex-col">
                  {props.children}
                </main>
              </div>
            </div>
          </MobileBookSidebar>
        </ThemeProvider>
      )}
    </Router>
  );
}
