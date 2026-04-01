"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import {
  FOREGROUND_SMOKE_PROFILES,
  SMOKE_MASKS,
  type ForegroundSmokeIntensity,
} from "@/lib/smoke-parallax-presets";
import { useScrollDrivenShiftX } from "@/lib/use-scroll-driven-shift-x";

type ForegroundSmokeParallaxProps = {
  enabled: boolean;
  intensity?: ForegroundSmokeIntensity;
};

export function ForegroundSmokeParallax({
  enabled,
  intensity = "default",
}: ForegroundSmokeParallaxProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const profile = FOREGROUND_SMOKE_PROFILES[intensity];
  const motionPrimary = reduceMotion ? profile.motionPrimary * 0.45 : profile.motionPrimary;
  const motionSecondary = reduceMotion ? profile.motionSecondary * 0.45 : profile.motionSecondary;

  useScrollDrivenShiftX(layerRef, {
    enabled,
    rangeVw: reduceMotion ? 12 : 22,
    cssVarName: "--fg-smoke-scroll-x",
  });

  if (!enabled) return null;

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
        className="foreground-smoke-parallax absolute inset-0 mix-blend-screen"
        style={{
          WebkitMaskImage: SMOKE_MASKS.foreground,
          maskImage: SMOKE_MASKS.foreground,
          backgroundImage: `
            radial-gradient(ellipse 96% 54% at calc(18% + var(--fg-smoke-scroll-x, 0vw) * ${motionPrimary}) 52%, rgba(255,255,255,0.22) 0%, rgba(236,254,255,0.14) 34%, rgba(165,243,252,0.08) 58%, transparent 78%),
            radial-gradient(ellipse 74% 44% at calc(84% + var(--fg-smoke-scroll-x, 0vw) * ${motionSecondary}) 56%, rgba(250,245,255,0.16) 0%, rgba(233,213,255,0.12) 40%, transparent 72%)
          `,
        }}
      />
      <div
        className="foreground-smoke-parallax-slow absolute inset-0 mix-blend-screen"
        style={{
          WebkitMaskImage: SMOKE_MASKS.foreground,
          maskImage: SMOKE_MASKS.foreground,
          backgroundImage: `
            radial-gradient(ellipse 90% 48% at calc(88% - var(--fg-smoke-scroll-x, 0vw) * ${motionPrimary}) 62%, rgba(244,232,255,0.2) 0%, rgba(196,181,253,0.13) 44%, transparent 74%),
            radial-gradient(ellipse 70% 38% at calc(16% - var(--fg-smoke-scroll-x, 0vw) * ${motionSecondary}) 60%, rgba(255,255,255,0.12) 0%, transparent 62%)
          `,
        }}
      />
    </div>
  );
}
