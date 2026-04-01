"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useHydrated } from "@/lib/use-hydrated";
import {
  BG_PANORAMA_MIN_WIDTH_VW,
  BG_SCROLL_SHIFT_RANGE_VW,
} from "@/lib/background-parallax";
import { useScrollDrivenShiftX } from "@/lib/use-scroll-driven-shift-x";

type SiteBackgroundVideoProps = {
  mp4Src?: string;
  posterSrc?: string;
};

const mediaTransform =
  "translate3d(calc(-50% + var(--sbg-scroll-x, 0vw)), -50%, 0)" as const;

const mediaStyle: CSSProperties = {
  minWidth: `${BG_PANORAMA_MIN_WIDTH_VW}vw`,
  transform: mediaTransform,
};

/** Full-viewport loop behind the page. Scroll-parallax pan + respects reduced motion (static poster or off). */
export function SiteBackgroundVideo({
  mp4Src,
  posterSrc,
}: SiteBackgroundVideoProps) {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const src = mp4Src?.trim();
  const poster = posterSrc?.trim();
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollParallaxEnabled = hydrated && reduceMotion !== true;
  useScrollDrivenShiftX(containerRef, {
    enabled: scrollParallaxEnabled,
    rangeVw: BG_SCROLL_SHIFT_RANGE_VW,
    cssVarName: "--sbg-scroll-x",
  });

  if (!src) {
    return null;
  }

  const preferStill = !hydrated || reduceMotion === true;

  const mediaClassName =
    "absolute left-1/2 top-1/2 h-full min-h-full max-w-none object-cover will-change-transform";

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {preferStill && poster ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- poster is optional decorative full-bleed */}
          <img
            src={poster}
            alt=""
            className={mediaClassName}
            style={mediaStyle}
          />
        </>
      ) : null}
      {!preferStill ? (
        <>
          <video
            className={mediaClassName}
            style={mediaStyle}
            src={src}
            poster={poster || undefined}
            muted
            playsInline
            autoPlay
            loop
            preload="auto"
          />
        </>
      ) : null}
      {preferStill && !poster ? (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17] to-[#000]" />
      ) : null}
    </div>
  );
}
