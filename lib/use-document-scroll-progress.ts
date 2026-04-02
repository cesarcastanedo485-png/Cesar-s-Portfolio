"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type Options = {
  enabled: boolean;
  /** 0 = page top, 1 = page bottom (clamped). */
  cssVarName?: string;
};

/**
 * Maps vertical document scroll to a 0–1 CSS custom property on `containerRef`.
 */
export function useDocumentScrollProgress(
  containerRef: RefObject<HTMLElement | null>,
  { enabled, cssVarName = "--arp-scroll-t" }: Options,
) {
  const tickingRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (typeof window === "undefined") {
      return;
    }

    if (!enabled) {
      el?.style.setProperty(cssVarName, "0");
      return;
    }

    const update = () => {
      tickingRef.current = false;
      const target = containerRef.current;
      if (!target) {
        return;
      }
      const root = document.scrollingElement ?? document.documentElement;
      const scrollTop = root.scrollTop;
      const maxScroll = Math.max(0, root.scrollHeight - root.clientHeight);
      const t =
        maxScroll <= 0
          ? 0
          : Math.min(1, Math.max(0, scrollTop / maxScroll));
      target.style.setProperty(cssVarName, t.toFixed(4));
    };

    const onScrollOrResize = () => {
      if (tickingRef.current) {
        return;
      }
      tickingRef.current = true;
      rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      cancelAnimationFrame(rafRef.current);
      containerRef.current?.style.setProperty(cssVarName, "0");
    };
  }, [containerRef, cssVarName, enabled]);
}
