"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type Options = {
  enabled: boolean;
  /**
   * Total horizontal sweep in vw. With default mapping: page top → left side of the framed
   * layer, page bottom → right (shift = (0.5 − t) × rangeVw).
   * Ignored when both `shiftStartVw` and `shiftEndVw` are set.
   */
  rangeVw?: number;
  /**
   * Linear map: shift = shiftStartVw + t × (shiftEndVw − shiftStartVw).
   * Use on mobile to frame left billboard at top and right billboard at bottom.
   */
  shiftStartVw?: number;
  shiftEndVw?: number;
  /** Custom property on `containerRef` (default `--arp-scroll-x`). */
  cssVarName?: string;
  /** Mirror `--arp-scroll-x` onto `document.documentElement` (portaled layers). */
  mirrorVarToDocumentElement?: boolean;
};

/**
 * Maps vertical scroll to horizontal translate (default `--arp-scroll-x`, vw).
 * Top of page = panorama left; scrolling down moves the view toward the right.
 */
export function useScrollDrivenShiftX(
  containerRef: RefObject<HTMLElement | null>,
  {
    enabled,
    rangeVw = 8,
    shiftStartVw,
    shiftEndVw,
    cssVarName = "--arp-scroll-x",
    mirrorVarToDocumentElement = false,
  }: Options,
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
        el.style.setProperty(cssVarName, "0vw");
      }
      if (mirrorVarToDocumentElement) {
        document.documentElement.style.removeProperty(cssVarName);
      }
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
      const useLinear =
        typeof shiftStartVw === "number" && typeof shiftEndVw === "number";
      const shiftVw = useLinear
        ? shiftStartVw + t * (shiftEndVw - shiftStartVw)
        : (0.5 - t) * rangeVw;
      const value = `${shiftVw}vw`;
      target.style.setProperty(cssVarName, value);
      if (mirrorVarToDocumentElement) {
        document.documentElement.style.setProperty(cssVarName, value);
      }
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
        containerRef.current.style.setProperty(cssVarName, "0vw");
      }
      if (mirrorVarToDocumentElement) {
        document.documentElement.style.removeProperty(cssVarName);
      }
    };
  }, [
    containerRef,
    cssVarName,
    enabled,
    mirrorVarToDocumentElement,
    rangeVw,
    shiftStartVw,
    shiftEndVw,
  ]);
}
