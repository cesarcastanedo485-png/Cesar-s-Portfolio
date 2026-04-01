"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type Options = {
  enabled: boolean;
  /** Total horizontal sweep in vw (e.g. 8 → −4vw at page top to +4vw at bottom). */
  rangeVw?: number;
};

/**
 * Maps vertical scroll progress to `--arp-scroll-x` (vw) for parallax pan.
 * Updates via rAF; respects `enabled` (e.g. off when prefers-reduced-motion).
 */
export function useScrollDrivenShiftX(
  containerRef: RefObject<HTMLElement | null>,
  { enabled, rangeVw = 8 }: Options,
) {
  const tickingRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (typeof window === "undefined") {
      return;
    }

    if (!enabled) {
      if (el) {
        el.style.setProperty("--arp-scroll-x", "0vw");
      }
      return;
    }

    const update = () => {
      tickingRef.current = false;
      const target = containerRef.current;
      if (!target) {
        return;
      }
      const doc = document.documentElement;
      const scrollY = window.scrollY ?? doc.scrollTop;
      const maxScroll = Math.max(
        1,
        doc.scrollHeight - window.innerHeight,
      );
      const t = Math.min(1, Math.max(0, scrollY / maxScroll));
      const shiftVw = (t - 0.5) * rangeVw;
      target.style.setProperty("--arp-scroll-x", `${shiftVw}vw`);
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
      if (containerRef.current) {
        containerRef.current.style.setProperty("--arp-scroll-x", "0vw");
      }
    };
  }, [containerRef, enabled, rangeVw]);
}
