"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import {
  FOREGROUND_SMOKE_PROFILES,
  SMOKE_MASKS,
  type ForegroundSmokeIntensity,
} from "@/lib/smoke-parallax-presets";
import { useIsNarrowViewport } from "@/lib/use-max-width-media";
import { useScrollDrivenShiftX } from "@/lib/use-scroll-driven-shift-x";

type ForegroundSmokeParallaxProps = {
  enabled: boolean;
  intensity?: ForegroundSmokeIntensity;
  /** When true, replaces subtle mist with an impossible-to-miss centered CSS stack (see portfolio.json). */
  debugBlatantCenter?: boolean;
};

export function ForegroundSmokeParallax({
  enabled,
  intensity = "default",
  debugBlatantCenter = false,
}: ForegroundSmokeParallaxProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const narrowViewport = useIsNarrowViewport();
  const profile = FOREGROUND_SMOKE_PROFILES[intensity];
  const motionPrimary = reduceMotion ? profile.motionPrimary * 0.45 : profile.motionPrimary;
  const motionSecondary = reduceMotion ? profile.motionSecondary * 0.45 : profile.motionSecondary;
  const smokeMask = narrowViewport ? SMOKE_MASKS.foregroundMobile : SMOKE_MASKS.foreground;
  const scrollRangeVw = narrowViewport ? 30 : reduceMotion ? 12 : 22;

  useScrollDrivenShiftX(layerRef, {
    enabled: enabled && !debugBlatantCenter,
    rangeVw: scrollRangeVw,
    cssVarName: "--fg-smoke-scroll-x",
  });

  if (!enabled) return null;

  /** Verifies the React/CSS foreground layer — not haze painted into alice-parallax.png */
  if (debugBlatantCenter) {
    return (
      <div
        ref={layerRef}
        className="pointer-events-none fixed inset-0 z-[45]"
        aria-hidden
      >
        {/* Full-screen wash so the layer is undeniable */}
        <div
          className="absolute inset-0 mix-blend-normal opacity-100"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(236, 72, 153, 0.92) 0%, rgba(34, 211, 238, 0.72) 38%, rgba(250, 204, 21, 0.45) 58%, rgba(0, 0, 0, 0.15) 100%)",
          }}
        />
        <div
          className="absolute inset-0 mix-blend-normal opacity-100"
          style={{
            background:
              "radial-gradient(ellipse 42% 36% at 50% 50%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 68%)",
          }}
        />
        <div className="absolute left-1/2 top-1/2 z-[2] flex w-[min(92vw,22rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
          <div className="h-1.5 w-full rounded-full bg-yellow-300 shadow-[0_0_20px_#fde047]" />
          <div className="w-full rounded-2xl border-4 border-neutral-950 bg-fuchsia-600 px-3 py-4 shadow-[0_0_60px_rgba(192,38,211,0.9)]">
            <p className="text-center text-xs font-black uppercase leading-tight tracking-[0.18em] text-white">
              Foreground CSS layer (debug)
            </p>
            <p className="mt-2 text-center text-[11px] font-semibold leading-snug text-yellow-100">
              This is not the smoke in your background file. Turn off{" "}
              <span className="whitespace-nowrap font-mono text-[10px] text-white">
                site.foregroundSmoke.debugBlatantCenter
              </span>{" "}
              in content/portfolio.json when done.
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-yellow-300 shadow-[0_0_20px_#fde047]" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={layerRef}
      className="pointer-events-none fixed inset-0 z-30 [--fg-smoke-scroll-x:0vw]"
      style={
        {
          "--fg-smoke-primary-opacity": profile.opacityPrimary,
          "--fg-smoke-secondary-opacity": profile.opacitySecondary,
          "--fg-smoke-primary-mobile-opacity": profile.mobileOpacityPrimary,
          "--fg-smoke-secondary-mobile-opacity": profile.mobileOpacitySecondary,
        } as CSSProperties
      }
      aria-hidden
    >
      <div
        className="foreground-smoke-parallax absolute inset-0 mix-blend-screen max-md:mix-blend-soft-light"
        style={{
          WebkitMaskImage: smokeMask,
          maskImage: smokeMask,
          backgroundImage: `
            radial-gradient(ellipse 96% 54% at calc(18% + var(--fg-smoke-scroll-x, 0vw) * ${motionPrimary}) 52%, rgba(255,255,255,0.22) 0%, rgba(236,254,255,0.14) 34%, rgba(165,243,252,0.08) 58%, transparent 78%),
            radial-gradient(ellipse 74% 44% at calc(84% + var(--fg-smoke-scroll-x, 0vw) * ${motionSecondary}) 56%, rgba(250,245,255,0.16) 0%, rgba(233,213,255,0.12) 40%, transparent 72%)
          `,
        }}
      />
      <div
        className="foreground-smoke-parallax-slow absolute inset-0 mix-blend-normal"
        style={{
          WebkitMaskImage: smokeMask,
          maskImage: smokeMask,
          backgroundImage: `
            radial-gradient(ellipse 90% 48% at calc(88% - var(--fg-smoke-scroll-x, 0vw) * ${motionPrimary}) 62%, rgba(244,232,255,0.2) 0%, rgba(196,181,253,0.13) 44%, transparent 74%),
            radial-gradient(ellipse 70% 38% at calc(16% - var(--fg-smoke-scroll-x, 0vw) * ${motionSecondary}) 60%, rgba(255,255,255,0.12) 0%, transparent 62%)
          `,
        }}
      />
    </div>
  );
}
