"use client";

import { useCallback, useRef, useState } from "react";
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

  const allowMotion = hydrated && reduceMotion === false;
  const analyse = allowMotion && playing;

  const { ensureGraph, resumeContext } = useAudioReactiveDrive({
    audioRef,
    containerRef,
    analyse,
  });

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
      if (allowMotion) {
        ensureGraph();
        await resumeContext();
      }
      await audio.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playback failed");
    }
  }, [allowMotion, ensureGraph, playing, resumeContext]);

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
                    "scale(calc(1 + var(--arp-pulse, 0) * 0.065))",
                  filter:
                    "brightness(calc(0.84 + var(--arp-pulse, 0) * 0.24))",
                }}
              />
            </>
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-violet-950 via-indigo-950 to-[#050810] will-change-transform"
              style={{
                transform:
                  "scale(calc(1 + var(--arp-pulse, 0) * 0.055))",
                filter:
                  "brightness(calc(0.88 + var(--arp-pulse, 0) * 0.2))",
              }}
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-screen bg-[radial-gradient(ellipse_at_50%_42%,rgba(168,85,247,0.45)_0%,transparent_55%)]"
            style={{
              opacity: "calc(0.08 + var(--arp-pulse, 0) * 0.38)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17]/82 via-[#0a0e17]/76 to-[#000]/88" />
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
