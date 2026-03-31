"use client";

import { useCallback, useRef, useState } from "react";
import type { CSSProperties } from "react";
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

/** Full-viewport image + Web Audio bass-driven pulse. Requires user gesture to play. */
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

  return (
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

      {showControls ? (
        <div className="pointer-events-auto fixed bottom-6 left-6 z-[60] flex flex-col gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            aria-pressed={playing}
            className={cn(
              "rounded-full border border-white/20 bg-[#0a0e17]/85 px-4 py-2 text-sm font-medium text-white/95 shadow-lg backdrop-blur-md",
              "transition-colors hover:border-white/35 hover:bg-[#0a0e17]/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400",
            )}
          >
            <span className="sr-only">Background music. </span>
            {playing ? "Pause atmosphere" : "Play atmosphere"}
          </button>
          {error ? (
            <p className="max-w-xs text-xs text-red-300/95" role="status">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
