import { MonitorIcon, MoonIcon, SunIcon } from "@/components/ui/icons";
import { useTheme } from "@/components/theme/theme";
import { cn } from "@/lib/utils";
import type { JSX } from "@solidjs/web";

export function ThemeToggle(props: { variant?: "inline" | "pill" }) {
  const { theme, setTheme } = useTheme();
  const variant = () => props.variant ?? "pill";

  return (
    <div
      class={
        variant() === "inline"
          ? "inline-flex items-center gap-0.5"
          : "border-divider dark:border-divider-dark inline-flex items-center rounded-full border p-0.5"
      }
    >
      <ToggleButton
        active={theme() === "light"}
        label="Light mode"
        onClick={() => setTheme("light")}
      >
        <SunIcon class="size-4" />
      </ToggleButton>
      <ToggleButton
        active={theme() === "dark"}
        label="Dark mode"
        onClick={() => setTheme("dark")}
      >
        <MoonIcon class="size-4" />
      </ToggleButton>
      <ToggleButton
        active={theme() === "system"}
        label="System theme"
        onClick={() => setTheme("system")}
      >
        <MonitorIcon class="size-4" />
      </ToggleButton>
    </div>
  );
}

function ToggleButton(props: {
  active: boolean;
  children: JSX.Element;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={props.label}
      aria-pressed={props.active ? "true" : "false"}
      class={cn(
        "rounded-full p-1.5 transition-colors",
        props.active
          ? "bg-card dark:bg-card-dark text-black dark:text-white"
          : "text-muted hover:text-black dark:hover:text-white",
      )}
      onClick={props.onClick}
      type="button"
    >
      {props.children}
    </button>
  );
}
