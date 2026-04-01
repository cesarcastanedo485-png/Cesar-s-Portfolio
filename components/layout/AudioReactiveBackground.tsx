"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Music2,
  Pause,
  Play,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useHydrated } from "@/lib/use-hydrated";
import { useAudioReactiveDrive } from "@/lib/use-audio-reactive-drive";
import { useScrollDrivenShiftX } from "@/lib/use-scroll-driven-shift-x";
import { cn } from "@/lib/utils";

/** Total horizontal pan in vw (top −half → bottom +half). */
const SCROLL_SHIFT_RANGE_VW = 8;

type AudioReactiveBackgroundProps = {
  /** Empty: violet/indigo gradient pulse (add `/backgrounds/your.png` when ready). */
  imageSrc: string;
  audioSrc: string;
  showControls?: boolean;
  imageAlt?: string;
};

/** Full-bleed background (z below content) + separate overlay controls (z above content). */
export function AudioReactiveBackground({
  imageSrc,
  audioSrc,
  showControls = true,
  imageAlt = "",
}: AudioReactiveBackgroundProps) {
  const hasImage = Boolean(imageSrc?.trim());
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dockOpen, setDockOpen] = useState(true);

  /** Only dampen when OS explicitly requests reduced motion — never block analyser on `null`. */
  const pulseDampen = reduceMotion === true ? 0.32 : 1;
  const analyse = hydrated && playing;

  const { ensureGraph, resumeContext } = useAudioReactiveDrive({
    audioRef,
    containerRef,
    analyse,
    pulseDampen,
  });

  const scrollParallaxEnabled = hydrated && reduceMotion !== true;
  useScrollDrivenShiftX(containerRef, {
    enabled: scrollParallaxEnabled,
    rangeVw: SCROLL_SHIFT_RANGE_VW,
  });

  useEffect(() => {
    if (!hydrated || !playing) {
      return;
    }
    ensureGraph();
    void resumeContext();
  }, [ensureGraph, hydrated, playing, resumeContext]);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (playing) {
      audio.pause();
      return;
    }
    try {
      setError(null);
      if (hydrated) {
        ensureGraph();
        await resumeContext();
      }
      await audio.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playback failed");
    }
  }, [ensureGraph, hydrated, playing, resumeContext]);

  const crossOrigin = audioSrc.startsWith("http") ? "anonymous" : undefined;

  /** Mobile-first safe insets (thumb + notches). */
  const insetLeft = "max(0.75rem,env(safe-area-inset-left,0px))";
  const insetBottom = "max(1rem,env(safe-area-inset-bottom,0px))";

  return (
    <>
      {/* Visual layers only: stacking context stays behind page content */}
      <div
        ref={containerRef}
        className="pointer-events-none fixed inset-x-0 top-0 bottom-0 -z-20 min-h-[100svh] min-h-[100dvh] overflow-hidden [--arp-visual-mul:0.96] md:[--arp-visual-mul:1]"
        style={
          {
            "--arp-pulse": 0,
            "--arp-pulse-spike": 0,
            "--arp-scroll-x": "0vw",
          } as CSSProperties
        }
      >
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="none"
          crossOrigin={crossOrigin}
          playsInline
          loop
          className="sr-only"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        <div className="pointer-events-none absolute inset-0 min-h-[100svh] min-h-[100dvh]">
          {hasImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative full-bleed background */}
              <img
                src={imageSrc.trim()}
                alt={imageAlt || ""}
                decoding="async"
                fetchPriority="low"
                sizes="100vw"
                className="absolute left-1/2 top-1/2 min-h-full min-w-full max-w-none object-cover will-change-transform"
                style={{
                  transform:
                    "translate3d(calc(-50% + var(--arp-scroll-x, 0vw)), -50%, 0) scale(calc(1 + var(--arp-pulse, 0) * 0.24 * var(--arp-visual-mul, 1)))",
                  filter:
                    "brightness(calc(0.88 + var(--arp-pulse, 0) * 0.52 * var(--arp-visual-mul, 1))) contrast(calc(1 + var(--arp-pulse, 0) * 0.2 * var(--arp-visual-mul, 1))) saturate(calc(1 + var(--arp-pulse, 0) * 0.55 * var(--arp-visual-mul, 1))) hue-rotate(calc(var(--arp-pulse-spike, 0) * 18deg)) drop-shadow(0 0 calc(12px + var(--arp-pulse-spike, 0) * 42px) rgba(250, 100, 220, 0.85))",
                }}
              />
            </>
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-violet-950 via-indigo-950 to-[#050810] will-change-transform"
              style={{
                transform:
                  "translate3d(var(--arp-scroll-x, 0vw), 0, 0) scale(calc(1 + var(--arp-pulse, 0) * 0.2 * var(--arp-visual-mul, 1))) translateZ(0)",
                filter:
                  "brightness(calc(0.9 + var(--arp-pulse, 0) * 0.48 * var(--arp-visual-mul, 1))) saturate(calc(1 + var(--arp-pulse, 0) * 0.5 * var(--arp-visual-mul, 1))) hue-rotate(calc(var(--arp-pulse-spike, 0) * 14deg))",
              }}
            />
          )}
          {/* Soft bloom — lighter blur on mobile (GPU) */}
          <div
            aria-hidden
            className="absolute inset-0 scale-105 mix-blend-screen blur-[10px] sm:blur-[16px] md:blur-[22px]"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 42% 36% at 50% 42%, rgba(255, 120, 255, 0.55) 0%, rgba(236, 72, 153, 0.22) 45%, transparent 62%),
                radial-gradient(ellipse 55% 48% at 48% 38%, rgba(192, 132, 252, 0.4) 0%, transparent 55%)
              `,
              opacity:
                "calc(0.55 + var(--arp-pulse, 0) * 0.42 + var(--arp-pulse-spike, 0) * 0.35)",
            }}
          />
          {/* Dress + legs / fog band — matches downward glow in the plate */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 48% 55% at 50% 58%, rgba(167, 139, 250, 0.42) 0%, rgba(88, 28, 135, 0.12) 50%, transparent 68%),
                radial-gradient(ellipse 85% 35% at 52% 78%, rgba(251, 207, 232, 0.38) 0%, rgba(244, 114, 182, 0.18) 40%, transparent 62%)
              `,
              opacity:
                "calc(0.32 + var(--arp-pulse, 0) * 0.5 + var(--arp-pulse-spike, 0) * 0.45)",
            }}
          />
          {/* Base neon wash — wide read */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-screen"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 95% 75% at 50% 36%, rgba(255, 60, 240, 0.55) 0%, rgba(168, 85, 247, 0.42) 32%, transparent 58%),
                radial-gradient(ellipse 60% 50% at 50% 40%, rgba(34, 211, 238, 0.5) 0%, transparent 52%)
              `,
              opacity:
                "calc(0.45 + var(--arp-pulse, 0) * 0.52 + var(--arp-pulse-spike, 0) * 0.28)",
            }}
          />
          {/* Beat flash — kicks (spike-forward) */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-screen"
            style={{
              background:
                "radial-gradient(circle 72vmin at 50% 32%, rgba(255, 220, 255, 1) 0%, rgba(244, 114, 182, 0.72) 26%, transparent 52%)",
              opacity:
                "calc(var(--arp-pulse, 0) * 0.55 + var(--arp-pulse-spike, 0) * 0.95)",
            }}
          />
          {/* Readability scrim — ~60% so art stays visible */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17]/60 via-[#0a0e17]/55 to-[#000]/62" />
        </div>
      </div>

      {/* Controls sit above main content (not inside -z-20, so clicks work) */}
      {showControls ? (
        <div
          className="pointer-events-none fixed inset-0 z-[200]"
          aria-live="polite"
        >
          {!dockOpen ? (
            <button
              type="button"
              onClick={() => setDockOpen(true)}
              className={cn(
                "pointer-events-auto absolute flex touch-manipulation items-center justify-center border border-white/25 bg-[#0a0e17]/95 text-white/90 shadow-lg",
                "backdrop-blur-sm md:backdrop-blur-md",
                "[-webkit-tap-highlight-color:transparent]",
                /* Mobile-first: thumb reach, bottom edge */
                "bottom-[var(--arp-inset-b)] left-[var(--arp-inset-l)] top-auto h-12 w-12 translate-y-0 rounded-full border-white/30 md:bottom-auto md:left-0 md:top-1/2 md:h-14 md:w-10 md:-translate-y-1/2 md:rounded-l-none md:rounded-r-xl md:border-l-0 md:px-0 md:pl-[max(0.5rem,env(safe-area-inset-left,0px))]",
                "hover:bg-[#121a28]/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 active:scale-[0.97]",
              )}
              style={
                {
                  "--arp-inset-l": insetLeft,
                  "--arp-inset-b": insetBottom,
                } as CSSProperties
              }
              aria-expanded={false}
              aria-label="Show music controls"
            >
              <Music2 className="h-5 w-5 shrink-0 md:hidden" aria-hidden />
              <ChevronRight className="hidden h-5 w-5 shrink-0 md:inline" aria-hidden />
            </button>
          ) : (
            <div
              className={cn(
                "pointer-events-auto absolute flex flex-col items-center gap-3 rounded-2xl border border-white/20 bg-[#0a0e17]/95 p-3 shadow-2xl",
                "backdrop-blur-sm md:backdrop-blur-md",
                /* Mobile-first: dock above home indicator, left-aligned for one-hand */
                "bottom-[var(--arp-inset-b)] left-[var(--arp-inset-l)] right-auto top-auto max-w-[min(19rem,calc(100vw-1.5rem))] translate-y-0",
                "md:bottom-auto md:left-[max(0.5rem,env(safe-area-inset-left,0px))] md:right-auto md:top-1/2 md:max-h-[min(90dvh,28rem)] md:max-w-none md:-translate-y-1/2",
              )}
              style={
                {
                  "--arp-inset-l": insetLeft,
                  "--arp-inset-b": insetBottom,
                } as CSSProperties
              }
            >
              <div className="flex w-full items-center justify-between gap-2 pl-1">
                <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/70">
                  <Music2 className="h-3.5 w-3.5" aria-hidden />
                  Atmosphere
                </span>
                <button
                  type="button"
                  onClick={() => setDockOpen(false)}
                  className={cn(
                    "flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full text-white/80 [-webkit-tap-highlight-color:transparent] hover:bg-white/10 md:h-9 md:w-9",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 active:bg-white/15",
                  )}
                  aria-label="Hide music controls"
                >
                  <ChevronDown className="h-5 w-5 md:hidden" aria-hidden />
                  <ChevronLeft className="hidden h-5 w-5 md:inline" aria-hidden />
                </button>
              </div>

              <button
                type="button"
                onClick={togglePlayback}
                aria-pressed={playing}
                aria-label={playing ? "Pause background music" : "Play background music"}
                className={cn(
                  "relative flex h-[4.25rem] w-[4.25rem] shrink-0 touch-manipulation items-center justify-center rounded-full border-2 border-white/45 bg-black/45 text-white shadow-inner [-webkit-tap-highlight-color:transparent] sm:h-[4.5rem] sm:w-[4.5rem]",
                  "transition-transform active:scale-[0.96] md:hover:scale-[1.03] md:active:scale-[0.97]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400",
                )}
              >
                <span className="absolute inset-0 rounded-full border border-white/10" aria-hidden />
                {playing ? (
                  <Pause className="h-9 w-9" strokeWidth={2} />
                ) : (
                  <Play className="ml-1 h-9 w-9" strokeWidth={2} />
                )}
              </button>

              <p className="max-w-[11rem] text-center text-[11px] leading-snug text-white/50 sm:text-[10px] sm:leading-tight sm:text-white/45">
                Tap play — unmute phone if needed
              </p>

              {error ? (
                <p className="max-w-[11rem] text-center text-xs text-red-300" role="status">
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
