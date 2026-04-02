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
    shiftStartVh,
    shiftEndVh,
  }: Options,
) {
  const tickingRef = useRef(false);
  const rafRef = useRef(0);
  const parallaxLogBucketRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (typeof window === "undefined") {
      return;
    }

    if (!enabled) {
      // #region agent log
      fetch("http://127.0.0.1:7531/ingest/a2f6d748-df85-4288-afaf-dcecbfdaa24b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "901510",
        },
        body: JSON.stringify({
          sessionId: "901510",
          runId: "pre-fix",
          hypothesisId: "H5",
          location: "use-scroll-driven-shift-x.ts:enabled-off",
          message: "scroll parallax hook disabled",
          data: { enabled: false },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      // #region agent log
      fetch("http://127.0.0.1:7531/ingest/a2f6d748-df85-4288-afaf-dcecbfdaa24b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "2431dd",
        },
        body: JSON.stringify({
          sessionId: "2431dd",
          runId: "pre-fix",
          hypothesisId: "H3_H4",
          location: "use-scroll-driven-shift-x.ts:disabled",
          message: "scroll hook disabled for target",
          data: {
            enabled: false,
            cssVarName,
            cssVarNameY,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (el) {
        el.style.setProperty(cssVarName, "0vw");
        el.style.setProperty(cssVarNameY, "0vh");
      }
      if (mirrorVarToDocumentElement) {
        document.documentElement.style.removeProperty(cssVarName);
        document.documentElement.style.removeProperty(cssVarNameY);
      }
      return;
    }

    // #region agent log
    fetch("http://127.0.0.1:7531/ingest/a2f6d748-df85-4288-afaf-dcecbfdaa24b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "901510",
      },
      body: JSON.stringify({
        sessionId: "901510",
        runId: "pre-fix",
        hypothesisId: "H3",
        location: "use-scroll-driven-shift-x.ts:effect-start",
        message: "scroll parallax options",
        data: {
          rangeVw,
          rangeVh,
          shiftStartVw,
          shiftEndVw,
          shiftStartVh,
          shiftEndVh,
          mirrorVarToDocumentElement,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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

      // #region agent log
      const bucket = Math.round(t * 20);
      if (parallaxLogBucketRef.current !== bucket) {
        parallaxLogBucketRef.current = bucket;
        const cs = getComputedStyle(target);
        fetch("http://127.0.0.1:7531/ingest/a2f6d748-df85-4288-afaf-dcecbfdaa24b", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "901510",
          },
          body: JSON.stringify({
            sessionId: "901510",
            runId: "pre-fix",
            hypothesisId: "H1_H2_H4",
            location: "use-scroll-driven-shift-x.ts:update",
            message: "scroll parallax sample",
            data: {
              t,
              scrollTop,
              maxScroll,
              rootClientHeight: root.clientHeight,
              rootScrollHeight: root.scrollHeight,
              useLinearY,
              shiftVw,
              shiftVh,
              deltaVw: useLinear
                ? (shiftEndVw ?? 0) - (shiftStartVw ?? 0)
                : rangeVw,
              deltaVh: useLinearY
                ? (shiftEndVh ?? 0) - (shiftStartVh ?? 0)
                : rangeVh,
              cssVarX: cs.getPropertyValue(cssVarName).trim(),
              cssVarY: cs.getPropertyValue(cssVarNameY).trim(),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #region agent log
        fetch("http://127.0.0.1:7531/ingest/a2f6d748-df85-4288-afaf-dcecbfdaa24b", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "2431dd",
          },
          body: JSON.stringify({
            sessionId: "2431dd",
            runId: "pre-fix",
            hypothesisId: "H3_H5",
            location: "use-scroll-driven-shift-x.ts:update-sample",
            message: "scroll parallax computed sample",
            data: {
              t,
              scrollTop,
              maxScroll,
              useLinear,
              useLinearY,
              shiftStartVw,
              shiftEndVw,
              shiftVw,
              shiftVh,
              cssVarX: cs.getPropertyValue(cssVarName).trim(),
              cssVarY: cs.getPropertyValue(cssVarNameY).trim(),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      }
      // #endregion
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
      if (containerRef.current) {
        containerRef.current.style.setProperty(cssVarName, "0vw");
        containerRef.current.style.setProperty(cssVarNameY, "0vh");
      }
      if (mirrorVarToDocumentElement) {
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
    rangeVh,
    rangeVw,
    shiftStartVh,
    shiftStartVw,
    shiftEndVh,
    shiftEndVw,
  ]);
}
