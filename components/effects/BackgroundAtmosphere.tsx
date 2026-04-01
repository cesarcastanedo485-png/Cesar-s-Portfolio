"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

type BackgroundAtmosphereProps = {
  /** Only when the main column is transparent over a photo/video bg. */
  enabled: boolean;
};

/**
 * Fixed layer behind page chrome: scroll-linked cool→warm grade + pointer sheen.
 * On coarse pointers, sheen is weaker and drifts slowly instead of tracking.
 */
export function BackgroundAtmosphere({ enabled }: BackgroundAtmosphereProps) {
  const reduceMotion = useReducedMotion();
  const elRef = useRef<HTMLDivElement>(null);
  const ptrRef = useRef({ x: 50, y: 42 });
  const rafScroll = useRef(0);
  const rafPtr = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
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

    const coarse =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;

    const applyPtr = () => {
      rafPtr.current = 0;
      const { x, y } = ptrRef.current;
      elRef.current?.style.setProperty("--atmo-ptr-x", `${x.toFixed(2)}%`);
      elRef.current?.style.setProperty("--atmo-ptr-y", `${y.toFixed(2)}%`);
    };

    const onMove = (e: MouseEvent) => {
      if (coarse) return;
      ptrRef.current = {
        x: (e.clientX / Math.max(1, window.innerWidth)) * 100,
        y: (e.clientY / Math.max(1, window.innerHeight)) * 100,
      };
      if (rafPtr.current) return;
      rafPtr.current = requestAnimationFrame(applyPtr);
    };

    let driftRaf = 0;
    let driftStart = 0;
    const drift = (time: number) => {
      if (!coarse) {
        return;
      }
      if (!driftStart) {
        driftStart = time;
      }
      const phase = (time - driftStart) / 1000;
      ptrRef.current = {
        x: 50 + Math.sin(phase * 0.42) * 38,
        y: 42 + Math.cos(phase * 0.36) * 32,
      };
      elRef.current?.style.setProperty(
        "--atmo-ptr-x",
        `${ptrRef.current.x.toFixed(2)}%`,
      );
      elRef.current?.style.setProperty(
        "--atmo-ptr-y",
        `${ptrRef.current.y.toFixed(2)}%`,
      );
      driftRaf = requestAnimationFrame(drift);
    };

    setScrollT();
    applyPtr();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });

    if (coarse) {
      driftRaf = requestAnimationFrame(drift);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafScroll.current);
      cancelAnimationFrame(rafPtr.current);
      cancelAnimationFrame(driftRaf);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  if (reduceMotion === true) {
    return (
      <div
        ref={elRef}
        className="pointer-events-none fixed inset-0 -z-[15] [--atmo-scroll-t:0] [--atmo-ptr-x:50%] [--atmo-ptr-y:45%]"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "linear-gradient(180deg, rgba(56,189,248,0.06) 0%, transparent 55%, rgba(232,121,249,0.05) 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={elRef}
      className="pointer-events-none fixed inset-0 -z-[15] [--atmo-ptr-x:50%] [--atmo-ptr-y:42%] [--atmo-scroll-t:0]"
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
      {/* Pointer (or drift) sheen */}
      <div
        className="absolute inset-0 mix-blend-screen opacity-45 motion-reduce:opacity-25 max-md:opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 48% at var(--atmo-ptr-x) var(--atmo-ptr-y), rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 28%, transparent 52%)",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-30 max-md:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 38% 40% at var(--atmo-ptr-x) var(--atmo-ptr-y), rgba(196,181,253,0.35) 0%, transparent 45%)",
        }}
      />
    </div>
  );
}
