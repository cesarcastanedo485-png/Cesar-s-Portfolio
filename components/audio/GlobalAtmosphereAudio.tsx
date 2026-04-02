"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { Music2, Pause, Play } from "lucide-react";
import { useHydrated } from "@/lib/use-hydrated";
import { useAudioReactiveDrive } from "@/lib/use-audio-reactive-drive";
import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";

type GlobalAtmosphereAudioContextValue = {
  playing: boolean;
  error: string | null;
  audioSrc: string;
  togglePlayback: () => Promise<void>;
};

const GlobalAtmosphereAudioContext =
  createContext<GlobalAtmosphereAudioContextValue | null>(null);

export function GlobalAtmosphereAudioProvider({
  audioSrc,
  children,
}: {
  audioSrc: string;
  children: ReactNode;
}) {
  const hydrated = useHydrated();
  const audioRef = useRef<HTMLAudioElement>(null);
  const pulseDriverRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ensureGraph, resumeContext } = useAudioReactiveDrive({
    audioRef,
    containerRef: pulseDriverRef,
    analyse: hydrated && playing,
    pulseDampen: 1,
    mirrorPulseToDocumentElement: true,
  });

  useLayoutEffect(() => {
    const target = document.documentElement;
    target.style.setProperty("--arp-pulse", "0");
    target.style.setProperty("--arp-pulse-spike", "0");
    return () => {
      target.style.removeProperty("--arp-pulse");
      target.style.removeProperty("--arp-pulse-spike");
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.8;
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
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

  const value = useMemo<GlobalAtmosphereAudioContextValue>(
    () => ({
      playing,
      error,
      audioSrc,
      togglePlayback,
    }),
    [audioSrc, error, playing, togglePlayback],
  );

  return (
    <GlobalAtmosphereAudioContext.Provider value={value}>
      <div ref={pulseDriverRef} className="sr-only" aria-hidden />
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="none"
        loop
        playsInline
        className="sr-only"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {children}
    </GlobalAtmosphereAudioContext.Provider>
  );
}

export function useGlobalAtmosphereAudio() {
  const ctx = useContext(GlobalAtmosphereAudioContext);
  if (!ctx) {
    throw new Error("useGlobalAtmosphereAudio must be used within GlobalAtmosphereAudioProvider");
  }
  return ctx;
}

export function GlobalAtmosphereAudioDock() {
  const hydrated = useHydrated();
  const { experienceMode, isMatrixMode, awardLevelEvent } = useProgression();
  const { playing, error, togglePlayback, audioSrc } = useGlobalAtmosphereAudio();
  const available = Boolean(audioSrc?.trim());
  const shouldShow = hydrated && available && (experienceMode === "wonderland" || !isMatrixMode);
  const insetLeft = "max(0.75rem,env(safe-area-inset-left,0px))";
  const insetBottom = "max(1rem,env(safe-area-inset-bottom,0px))";

  if (!shouldShow) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[210]" aria-live="polite">
      <div
        className={cn(
          "pointer-events-auto absolute bottom-[var(--g-audio-b)] left-[var(--g-audio-l)] flex items-center gap-2 rounded-full border border-white/20 bg-[#0a0e17]/90 px-3 py-2 shadow-2xl backdrop-blur-md",
        )}
        style={
          {
            "--g-audio-l": insetLeft,
            "--g-audio-b": insetBottom,
          } as CSSProperties
        }
      >
        <button
          type="button"
          onClick={async () => {
            if (!playing) {
              awardLevelEvent({
                type: "atmosphere-play",
                key: "atmosphere-play",
                source: "global-audio-dock",
              });
            }
            await togglePlayback();
          }}
          aria-pressed={playing}
          aria-label={playing ? "Pause background music" : "Play background music"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-black/40 text-white transition active:scale-[0.96]"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/75">
            <Music2 className="h-3.5 w-3.5" />
            Atmosphere
          </p>
          <p className="text-[11px] text-white/55">
            {playing ? "Playing across the site" : "Tap play to start"}
          </p>
          {error ? <p className="text-[11px] text-red-300">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
