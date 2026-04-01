"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, Sparkles } from "lucide-react";
import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";

/**
 * When Wonderland is on but `audioSrc` is empty, the real atmosphere dock never mounts.
 * This minimal control still awards the first level so vaults / overlays can progress.
 */
export function WonderlandAtmosphereStub() {
  const { awardLevelEvent } = useProgression();
  const [nudged, setNudged] = useState(false);
  const [fallbackPlaying, setFallbackPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscARef = useRef<OscillatorNode | null>(null);
  const oscBRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const stopFallbackTone = useCallback(() => {
    oscARef.current?.stop();
    oscBRef.current?.stop();
    oscARef.current?.disconnect();
    oscBRef.current?.disconnect();
    gainRef.current?.disconnect();
    oscARef.current = null;
    oscBRef.current = null;
    gainRef.current = null;
    setFallbackPlaying(false);
  }, []);

  const startFallbackTone = useCallback(async () => {
    if (typeof window === "undefined") return;
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = audioCtxRef.current ?? new Ctx();
    audioCtxRef.current = ctx;
    await ctx.resume();

    if (oscARef.current || oscBRef.current) {
      return;
    }

    const gain = ctx.createGain();
    gain.gain.value = 0.022;
    gain.connect(ctx.destination);

    const oscA = ctx.createOscillator();
    oscA.type = "triangle";
    oscA.frequency.value = 146.83;
    oscA.connect(gain);

    const oscB = ctx.createOscillator();
    oscB.type = "sine";
    oscB.frequency.value = 220.0;
    oscB.connect(gain);

    oscA.start();
    oscB.start();

    gainRef.current = gain;
    oscARef.current = oscA;
    oscBRef.current = oscB;
    setFallbackPlaying(true);
  }, []);

  useEffect(() => {
    return () => {
      stopFallbackTone();
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, [stopFallbackTone]);

  const onWake = useCallback(() => {
    awardLevelEvent({
      type: "atmosphere-play",
      key: "atmosphere-play:wonderland-stub",
      source: "atmosphere-stub",
    });
    if (fallbackPlaying) {
      stopFallbackTone();
    } else {
      void startFallbackTone();
    }
    setNudged(true);
  }, [awardLevelEvent, fallbackPlaying, startFallbackTone, stopFallbackTone]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200]"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onWake}
        className={cn(
          "pointer-events-auto absolute flex touch-manipulation items-center gap-2 rounded-2xl border border-fuchsia-400/40 bg-[#0a0e17]/95 px-4 py-3 shadow-2xl backdrop-blur-md",
          "bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-[max(0.75rem,env(safe-area-inset-right,0px))] max-w-[min(18rem,calc(100vw-1.5rem))]",
          "text-left text-sm font-medium text-fuchsia-100 transition hover:bg-[#12182a]/95",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400/70",
        )}
      >
        <Music2 className="h-5 w-5 shrink-0" aria-hidden />
        <span className="min-w-0">
          {nudged ? (
            <>
              <span className="block text-fuchsia-200/90">Wonderland active</span>
              <span className="mt-0.5 block text-[11px] font-normal text-white/55">
                Add <code className="rounded bg-black/40 px-1">audioSrc</code> in{" "}
                <code className="rounded bg-black/40 px-1">portfolio.json</code> for full music +
                reactive backdrop.
              </span>
              <span className="mt-0.5 block text-[11px] font-normal text-white/65">
                {fallbackPlaying
                  ? "Fallback tone is ON (tap to stop)."
                  : "Fallback tone is OFF (tap to start)."}
              </span>
            </>
          ) : (
            <>
              <span className="block">Start atmosphere (tap once)</span>
              <span className="mt-0.5 block text-[11px] font-normal text-white/55">
                One-time Level 1 trigger from this button; use vault/details after that.
              </span>
            </>
          )}
        </span>
        <Sparkles className="h-4 w-4 shrink-0 text-fuchsia-300/80" aria-hidden />
      </button>
    </div>
  );
}
