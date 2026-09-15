import {
  createContext,
  createSignal,
  createTrackedEffect,
  useContext,
  type ParentProps,
} from "solid-js";

export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function themeIsDark(theme: Theme, systemDark: boolean) {
  return theme === "dark" || (theme === "system" && systemDark);
}

export function applyThemeClass(theme: Theme) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", themeIsDark(theme, systemDark));
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : "system";
}

const ThemeContext = createContext<{
  theme: () => Theme;
  setTheme: (theme: Theme) => void;
}>();

export function ThemeProvider(props: ParentProps) {
  const [theme, setThemeSignal] = createSignal<Theme>(readStoredTheme());

  createTrackedEffect(() => {
    if (typeof window === "undefined") return;
    const current = theme();
    applyThemeClass(current);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeClass(current);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  });

  function setTheme(next: Theme) {
    setThemeSignal(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, next);
      applyThemeClass(next);
    }
  }

  return (
    <ThemeContext value={{ theme, setTheme }}>{props.children}</ThemeContext>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
