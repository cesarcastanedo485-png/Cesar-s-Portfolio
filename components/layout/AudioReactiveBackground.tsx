"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Music2, Pause, Play } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useHydrated } from "@/lib/use-hydrated";
import { useAudioReactiveDrive } from "@/lib/use-audio-reactive-drive";
import { cn } from "@/lib/utils";

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

  const leftSafe = "max(0.5rem,env(safe-area-inset-left,0px))";

  return (
    <>
      {/* Visual layers only: stacking context stays behind page content */}
      <div
        ref={containerRef}
        className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
        style={{ "--arp-pulse": 0 } as CSSProperties}
      >
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
          crossOrigin={crossOrigin}
          playsInline
          loop
          className="sr-only"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        <div className="pointer-events-none absolute inset-0">
          {hasImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative full-bleed background */}
              <img
                src={imageSrc.trim()}
                alt={imageAlt || ""}
                decoding="async"
                fetchPriority="low"
                className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover will-change-transform"
                style={{
                  transform:
                    "scale(calc(1 + var(--arp-pulse, 0) * 0.12)) translateZ(0)",
                  filter:
                    "brightness(calc(0.92 + var(--arp-pulse, 0) * 0.38)) contrast(calc(1 + var(--arp-pulse, 0) * 0.12)) saturate(calc(1 + var(--arp-pulse, 0) * 0.35))",
                }}
              />
            </>
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-violet-950 via-indigo-950 to-[#050810] will-change-transform"
              style={{
                transform:
                  "scale(calc(1 + var(--arp-pulse, 0) * 0.1)) translateZ(0)",
                filter:
                  "brightness(calc(0.94 + var(--arp-pulse, 0) * 0.32)) saturate(calc(1 + var(--arp-pulse, 0) * 0.4))",
              }}
            />
          )}
          {/* Soft bloom (follows scene light): tail / upper figure */}
          <div
            aria-hidden
            className="absolute inset-0 scale-105 mix-blend-screen blur-[18px] sm:blur-[22px]"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 42% 36% at 50% 42%, rgba(255, 120, 255, 0.55) 0%, rgba(236, 72, 153, 0.22) 45%, transparent 62%),
                radial-gradient(ellipse 55% 48% at 48% 38%, rgba(192, 132, 252, 0.4) 0%, transparent 55%)
              `,
              opacity: "calc(0.52 + var(--arp-pulse, 0) * 0.48)",
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
              opacity: "calc(0.28 + var(--arp-pulse, 0) * 0.55)",
            }}
          />
          {/* Base neon wash — wide read */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-screen"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 95% 75% at 50% 36%, rgba(255, 60, 240, 0.5) 0%, rgba(168, 85, 247, 0.38) 32%, transparent 58%),
                radial-gradient(ellipse 60% 50% at 50% 40%, rgba(34, 211, 238, 0.45) 0%, transparent 52%)
              `,
              opacity: "calc(0.4 + var(--arp-pulse, 0) * 0.58)",
            }}
          />
          {/* Beat flash — kicks */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-screen"
            style={{
              background:
                "radial-gradient(circle 65vmin at 50% 34%, rgba(255, 180, 255, 1) 0%, rgba(244, 114, 182, 0.65) 28%, transparent 55%)",
              opacity: "calc(var(--arp-pulse, 0) * 0.98)",
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
                "pointer-events-auto absolute top-1/2 flex h-14 w-10 -translate-y-1/2 touch-manipulation items-center justify-center rounded-r-xl border border-l-0 border-white/25 bg-[#0a0e17]/92 text-white/90 shadow-lg backdrop-blur-md",
                "hover:bg-[#121a28]/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 active:scale-[0.98]",
              )}
              style={{ left: 0, paddingLeft: leftSafe }}
              aria-expanded={false}
              aria-label="Show music controls"
            >
              <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
            </button>
          ) : (
            <div
              className="pointer-events-auto absolute top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 rounded-2xl border border-white/20 bg-[#0a0e17]/90 p-3 shadow-2xl backdrop-blur-md"
              style={{
                left: leftSafe,
                maxHeight: "min(90dvh, 28rem)",
              }}
            >
              <div className="flex w-full items-center justify-between gap-2 pl-1">
                <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/70">
                  <Music2 className="h-3.5 w-3.5" aria-hidden />
                  Atmosphere
                </span>
                <button
                  type="button"
                  onClick={() => setDockOpen(false)}
                  className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full text-white/80 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  aria-label="Hide music controls"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <button
                type="button"
                onClick={togglePlayback}
                aria-pressed={playing}
                aria-label={playing ? "Pause background music" : "Play background music"}
                className={cn(
                  "relative flex h-[4.5rem] w-[4.5rem] shrink-0 touch-manipulation items-center justify-center rounded-full border-2 border-white/45 bg-black/40 text-white shadow-inner",
                  "transition-transform hover:scale-[1.03] active:scale-[0.97]",
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

              <p className="max-w-[10rem] text-center text-[10px] leading-tight text-white/45">
                Tap to play (sound on)
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
