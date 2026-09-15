import { useNavigate, usePreloadRoute } from "@solidjs/router";
import { createTrackedEffect } from "solid-js";
import type { JSX } from "@solidjs/web";

type Props = {
  "aria-label"?: string;
  children?: JSX.Element;
  class?: string;
  href: string;
  prefetch?: boolean;
};

function useOptionalNavigate() {
  try {
    return useNavigate();
  } catch {
    return undefined;
  }
}

function useOptionalPreload() {
  try {
    return usePreloadRoute();
  } catch {
    return undefined;
  }
}

export function FastLink(props: Props) {
  const navigate = useOptionalNavigate();
  const preload = useOptionalPreload();

  function warm() {
    preload?.(props.href, { preloadData: true });
  }

  createTrackedEffect(() => {
    if (typeof window === "undefined") return;
    if (props.prefetch) warm();
  });

  function shouldFastNavigate(event: MouseEvent) {
    const target = (event.currentTarget as HTMLAnchorElement).getAttribute("target");
    const interactiveTarget =
      event.target instanceof Element
        ? event.target.closest(
            "button, input, select, textarea, [contenteditable='true'], [role='button']",
          )
        : null;
    return (
      Boolean(navigate) &&
      !interactiveTarget &&
      (!target || target === "_self") &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      !(event.currentTarget as HTMLAnchorElement).hasAttribute("download") &&
      event.button === 0
    );
  }

  return (
    <a
      aria-label={props["aria-label"]}
      class={props.class}
      href={props.href}
      onFocus={warm}
      onMouseDown={(event) => {
        if (!shouldFastNavigate(event)) return;
        event.preventDefault();
        navigate?.(props.href);
      }}
      onMouseEnter={warm}
    >
      {props.children}
    </a>
  );
}
