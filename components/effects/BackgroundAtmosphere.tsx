"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { ATMOSPHERE_SMOKE } from "@/lib/smoke-parallax-presets";

type BackgroundAtmosphereProps = {
  /** Only when the main column is transparent over a photo/video bg. */
  enabled: boolean;
  /** Blue-pill mode: single soft wash, no scroll-linked smoke. */
  matrixCalm?: boolean;
  /**
   * When false, only scroll-linked color grades (no radial mist). Use with AudioReactiveBackground
   * so mist isn’t stacked twice (was reading as a harsh center glow + killed parallax clarity).
   */
  mistLayers?: boolean;
};

const FORCE_CENTER_SMOKE_DEBUG = false;

/**
 * Fixed layer behind page chrome: scroll-linked cool→warm grade + dual smoke.
 */
export function BackgroundAtmosphere({
  enabled,
  matrixCalm = false,
  mistLayers = true,
}: BackgroundAtmosphereProps) {
  const reduceMotion = useReducedMotion();
  const elRef = useRef<HTMLDivElement>(null);
  const rafScroll = useRef(0);

  useEffect(() => {
    if (!enabled || matrixCalm || typeof window === "undefined") {
      return;
    }

    const root = () => document.scrollingElement ?? document.documentElement;

    const setScrollT = () => {
      rafScroll.current = 0;
      const r = root();
      const max = Math.max(0, r.scrollHeight - r.clientHeight);
      const t = max <= 0 ? 0 : Math.min(1, Math.max(0, r.scrollTop / max));
      elRef.current?.style.setProperty("--atmo-scroll-t", t.toFixed(4));
    };

    const onScroll = () => {
      if (rafScroll.current) return;
      rafScroll.current = requestAnimationFrame(setScrollT);
    };

    setScrollT();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(rafScroll.current);
    };
  }, [enabled, matrixCalm]);

  if (!enabled) {
    return null;
  }

  if (matrixCalm) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.5) 0%, transparent 50%, rgba(15,23,42,0.35) 100%)",
          }}
        />
      </div>
    );
  }

  if (reduceMotion === true) {
    return (
      <div
        ref={elRef}
        className="pointer-events-none fixed inset-0 z-[1] [--atmo-scroll-t:0]"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "linear-gradient(180deg, rgba(56,189,248,0.06) 0%, transparent 55%, rgba(232,121,249,0.05) 100%)",
          }}
        />
        {mistLayers ? (
          <>
            {/* Same dual mist as full-motion; drift keyframes are off — scroll still shifts gradients */}
            <div
              className="pointer-events-none absolute inset-0 mix-blend-screen opacity-90 max-md:opacity-[0.85]"
              style={{
                backgroundImage: `
            radial-gradient(ellipse 88% 44% at calc(50% + var(--atmo-scroll-t) * ${ATMOSPHERE_SMOKE.primary.xMotion}%) calc(52% + var(--atmo-scroll-t) * ${ATMOSPHERE_SMOKE.primary.yMotion}%), rgba(255,255,255,0.42) 0%, rgba(226,232,240,0.26) 30%, rgba(186,230,253,0.16) 50%, transparent 68%),
            radial-gradient(ellipse 40% 34% at calc(50% + var(--atmo-scroll-t) * ${ATMOSPHERE_SMOKE.primary.xMotionB}%) 50%, rgba(255,255,255,0.3) 0%, transparent 56%)
          `,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 mix-blend-screen opacity-[0.88] max-md:opacity-[0.82]"
              style={{
                backgroundImage: `
            radial-gradient(ellipse 78% 60% at calc(50% - var(--atmo-scroll-t) * ${ATMOSPHERE_SMOKE.secondary.xMotion}%) 57%, rgba(244,232,255,0.42) 0%, rgba(168,85,247,0.28) 44%, transparent 68%),
            radial-gradient(ellipse 62% 40% at calc(50% - var(--atmo-scroll-t) * ${ATMOSPHERE_SMOKE.secondary.xMotionB}%) 62%, rgba(255,255,255,0.24) 0%, transparent 58%)
          `,
              }}
            />
          </>
        ) : null}
        {FORCE_CENTER_SMOKE_DEBUG ? (
          <div
            className="absolute inset-0 opacity-[0.66]"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 72% 40% at 50% 52%, rgba(255,255,255,0.58) 0%, rgba(216,180,254,0.42) 38%, rgba(147,197,253,0.2) 58%, transparent 74%)",
            }}
            aria-hidden
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={elRef}
      className="pointer-events-none fixed inset-0 z-[1] [--atmo-scroll-t:0]"
      aria-hidden
    >
      {/* Scroll-linked grade: cooler top of page → warmer / magenta toward bottom */}
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-[0.85] max-md:opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(185deg, rgba(56,189,248,calc(0.1 + (1 - var(--atmo-scroll-t)) * 0.16)) 0%, transparent 42%, rgba(244,114,182,calc(0.06 + var(--atmo-scroll-t) * 0.18)) 58%, rgba(168,85,247,calc(0.05 + var(--atmo-scroll-t) * 0.12)) 100%)",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-35 max-md:opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(251,191,36,calc(var(--atmo-scroll-t) * 0.08)) 0%, transparent 35%)",
        }}
      />
      {mistLayers ? (
        <>
          {/* Smoke — two parallax layers; stronger scroll coupling so drift reads while scrolling */}
          <div
            className="portfolio-smoke-parallax pointer-events-none absolute inset-0 mix-blend-screen opacity-95 max-md:opacity-[0.9]"
            style={{
              backgroundImage: `
            radial-gradient(ellipse 88% 44% at calc(50% + var(--atmo-scroll-t) * ${ATMOSPHERE_SMOKE.primary.xMotion}%) calc(52% + var(--atmo-scroll-t) * ${ATMOSPHERE_SMOKE.primary.yMotion}%), rgba(255,255,255,0.42) 0%, rgba(226,232,240,0.26) 30%, rgba(186,230,253,0.16) 50%, transparent 68%),
            radial-gradient(ellipse 40% 34% at calc(50% + var(--atmo-scroll-t) * ${ATMOSPHERE_SMOKE.primary.xMotionB}%) 50%, rgba(255,255,255,0.3) 0%, transparent 56%)
          `,
            }}
            aria-hidden
          />
          <div
            className="portfolio-smoke-parallax-slow pointer-events-none absolute inset-0 mix-blend-screen opacity-90 max-md:opacity-[0.86]"
            style={{
              backgroundImage: `
            radial-gradient(ellipse 78% 60% at calc(50% - var(--atmo-scroll-t) * ${ATMOSPHERE_SMOKE.secondary.xMotion}%) 57%, rgba(244,232,255,0.42) 0%, rgba(168,85,247,0.28) 44%, transparent 68%),
            radial-gradient(ellipse 62% 40% at calc(50% - var(--atmo-scroll-t) * ${ATMOSPHERE_SMOKE.secondary.xMotionB}%) 62%, rgba(255,255,255,0.24) 0%, transparent 58%)
          `,
            }}
            aria-hidden
          />
        </>
      ) : null}
      {FORCE_CENTER_SMOKE_DEBUG ? (
        <div
          className="absolute inset-0 mix-blend-normal opacity-[0.42]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 66% 36% at 50% 52%, rgba(250,250,255,0.64) 0%, rgba(244,232,255,0.45) 34%, rgba(167,139,250,0.2) 58%, transparent 74%)",
          }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
