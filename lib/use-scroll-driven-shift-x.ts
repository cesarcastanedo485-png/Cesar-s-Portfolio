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
  /** Vertical sweep in vh (page top -> bottom). */
  rangeVh?: number;
  /** Linear map for Y: shiftY = shiftStartVh + t * (shiftEndVh - shiftStartVh). */
  shiftStartVh?: number;
  shiftEndVh?: number;
  /** Custom property on `containerRef` (default `--arp-scroll-x`). */
  cssVarName?: string;
  /** Custom Y property on `containerRef` (default `--arp-scroll-y`). */
  cssVarNameY?: string;
  /** Mirror `--arp-scroll-x` onto `document.documentElement` (portaled layers). */
  mirrorVarToDocumentElement?: boolean;
  /**
   * Optional near-bottom snap threshold for linear maps.
   * Useful on mobile browsers where dynamic URL bars prevent t from reaching 1.0.
   */
  snapToEndWithinPx?: number;
  /** When disabled, keep last CSS vars instead of forcing 0. */
  resetOnDisable?: boolean;
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
    rangeVh = 10,
    shiftStartVw,
    shiftEndVw,
    cssVarName = "--arp-scroll-x",
    cssVarNameY = "--arp-scroll-y",
    mirrorVarToDocumentElement = false,
    snapToEndWithinPx = 0,
    resetOnDisable = true,
    shiftStartVh,
    shiftEndVh,
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
      if (resetOnDisable) {
        if (el) {
          el.style.setProperty(cssVarName, "0vw");
          el.style.setProperty(cssVarNameY, "0vh");
        }
        if (mirrorVarToDocumentElement) {
          document.documentElement.style.removeProperty(cssVarName);
          document.documentElement.style.removeProperty(cssVarNameY);
        }
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
      const useLinear =
        typeof shiftStartVw === "number" && typeof shiftEndVw === "number";
      const distanceToBottom = Math.max(0, maxScroll - scrollTop);
      const tRaw =
        maxScroll <= 0
          ? 0
          : Math.min(1, Math.max(0, scrollTop / maxScroll));
      const shouldSnapToEnd =
        useLinear && snapToEndWithinPx > 0 && distanceToBottom <= snapToEndWithinPx;
      const t = shouldSnapToEnd ? 1 : tRaw;
      const useLinearY =
        typeof shiftStartVh === "number" && typeof shiftEndVh === "number";
      const shiftVw = useLinear
        ? shiftStartVw + t * (shiftEndVw - shiftStartVw)
        : (0.5 - t) * rangeVw;
      const shiftVh = useLinearY
        ? shiftStartVh + t * (shiftEndVh - shiftStartVh)
        : (0.5 - t) * rangeVh;
      const value = `${shiftVw}vw`;
      const valueY = `${shiftVh}vh`;
      target.style.setProperty(cssVarName, value);
      target.style.setProperty(cssVarNameY, valueY);
      if (mirrorVarToDocumentElement) {
        document.documentElement.style.setProperty(cssVarName, value);
        document.documentElement.style.setProperty(cssVarNameY, valueY);
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
      if (resetOnDisable && containerRef.current) {
        containerRef.current.style.setProperty(cssVarName, "0vw");
        containerRef.current.style.setProperty(cssVarNameY, "0vh");
      }
      if (resetOnDisable && mirrorVarToDocumentElement) {
        document.documentElement.style.removeProperty(cssVarName);
        document.documentElement.style.removeProperty(cssVarNameY);
      }
    };
  }, [
    containerRef,
    cssVarName,
    cssVarNameY,
    enabled,
    mirrorVarToDocumentElement,
    resetOnDisable,
    snapToEndWithinPx,
    rangeVh,
    rangeVw,
    shiftStartVh,
    shiftStartVw,
    shiftEndVh,
    shiftEndVw,
  ]);
}
