"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import {
  BG_PANORAMA_MIN_WIDTH_VW,
  BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
  MOBILE_ARP_SHIFT_END_VW,
  MOBILE_ARP_SHIFT_START_VW,
  panoramaScrollRangeVw,
} from "@/lib/background-parallax";
import { useDocumentScrollProgress } from "@/lib/use-document-scroll-progress";
import { useIsNarrowViewport } from "@/lib/use-max-width-media";
import { useProgression } from "@/lib/progression";
import { useScrollDrivenShiftX } from "@/lib/use-scroll-driven-shift-x";
import { cn } from "@/lib/utils";

type AudioReactiveBackgroundProps = {
  /** Base panorama image (Alice scene). */
  imageSrc: string;
  /** Optional second overlay layer (foreground mushrooms). */
  mushroomImageSrc?: string;
  audioSrc: string;
  showControls?: boolean;
  imageAlt?: string;
  mushroomImageAlt?: string;
};

const MUSHROOM_WIDTH = "min(148vw, 92rem)";
const MUSHROOM_HIDE_FRAC = 0.38;
const MUSHROOM_BOTTOM_SINK_PERCENT = 22;

/** Full-bleed background (z below content) + separate overlay controls (z above content). */
export function AudioReactiveBackground({
  imageSrc,
  mushroomImageSrc = "",
  audioSrc,
  showControls = true,
  imageAlt = "",
  mushroomImageAlt = "",
}: AudioReactiveBackgroundProps) {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const narrowViewport = useIsNarrowViewport();
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [dockOpen, setDockOpen] = useState(true);
  const [baseImageFailed, setBaseImageFailed] = useState(false);
  const [mushroomImageFailed, setMushroomImageFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { awardLevelEvent } = useProgression();
  const hasBaseImage = Boolean(imageSrc?.trim()) && !baseImageFailed;
  const hasMushroomImage = Boolean(mushroomImageSrc?.trim()) && !mushroomImageFailed;

  useEffect(() => {
    setBaseImageFailed(false);
  }, [imageSrc]);
  useEffect(() => {
    setMushroomImageFailed(false);
  }, [mushroomImageSrc]);

  /** Only dampen when OS explicitly requests reduced motion — never block analyser on `null`. */
  const pulseDampen = reduceMotion === true ? 0.32 : 1;
  const analyse = hydrated && playing;

  const { ensureGraph, resumeContext } = useAudioReactiveDrive({
    audioRef,
    containerRef,
    analyse,
    pulseDampen,
  });

  const scrollParallaxEnabled = hydrated;
  const panoramaMinWidthVw = narrowViewport
    ? BG_PANORAMA_MIN_WIDTH_VW_MOBILE
    : BG_PANORAMA_MIN_WIDTH_VW;
  const scrollRangeVw = panoramaScrollRangeVw(panoramaMinWidthVw);
  useScrollDrivenShiftX(containerRef, {
    enabled: scrollParallaxEnabled,
    ...(narrowViewport
      ? {
          shiftStartVw: MOBILE_ARP_SHIFT_START_VW,
          shiftEndVw: MOBILE_ARP_SHIFT_END_VW,
        }
      : { rangeVw: scrollRangeVw }),
  });
  useDocumentScrollProgress(containerRef, {
    enabled: hydrated,
    cssVarName: "--arp-scroll-t",
  });

  /** React `style` would reset imperative --arp-* vars every render; init once on the DOM node. */
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    el.style.setProperty("--arp-pulse", "0");
    el.style.setProperty("--arp-pulse-spike", "0");
  }, []);

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
      awardLevelEvent({
        type: "atmosphere-play",
        key: "atmosphere-play",
        source: "audio-dock",
      });
      if (hydrated) {
        ensureGraph();
        await resumeContext();
      }
      await audio.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playback failed");
    }
  }, [awardLevelEvent, ensureGraph, hydrated, playing, resumeContext]);

  const crossOrigin = audioSrc.startsWith("http") ? "anonymous" : undefined;
  const panoramaCenterY = narrowViewport ? "-40%" : "-50%";
  const mushroomHidePercent = reduceMotion === true ? 0 : MUSHROOM_HIDE_FRAC * 100;
  const mushroomBaseOpacity = reduceMotion === true ? 0.34 : 0.24;

  /** Mobile-first safe insets (thumb + notches). */
  const insetLeft = "max(0.75rem,env(safe-area-inset-left,0px))";
  const insetBottom = "max(1rem,env(safe-area-inset-bottom,0px))";

  return (
    <>
      {/* Visual layers only: stacking context stays behind page content */}
      <div
        ref={containerRef}
        className="audio-reactive-bg-root pointer-events-none fixed inset-x-0 top-0 bottom-0 z-0 min-h-[100svh] min-h-[100dvh] overflow-hidden [--arp-scroll-t:0] [--arp-visual-mul:0.96] md:[--arp-visual-mul:1]"
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
          {hasBaseImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative full-bleed background */}
              <img
                src={imageSrc.trim()}
                alt={imageAlt || ""}
                decoding="async"
                fetchPriority="low"
                sizes="100vw"
                className="absolute left-1/2 top-1/2 h-full min-h-full max-w-none object-cover will-change-transform"
                style={{
                  minWidth: `${panoramaMinWidthVw}vw`,
                  transform: `translate3d(calc(-50% + var(--arp-scroll-x, 0vw)), ${panoramaCenterY}, 0) scale(calc(1 + var(--arp-pulse, 0) * 0.1 * var(--arp-visual-mul, 1)))`,
                  filter:
                    "brightness(calc(0.9 + var(--arp-pulse, 0) * 0.22 * var(--arp-visual-mul, 1))) contrast(calc(1 + var(--arp-pulse, 0) * 0.09 * var(--arp-visual-mul, 1))) saturate(calc(1 + var(--arp-pulse, 0) * 0.26 * var(--arp-visual-mul, 1))) hue-rotate(calc(var(--arp-pulse-spike, 0) * 9deg))",
                }}
                onError={() => setBaseImageFailed(true)}
              />
              {hasMushroomImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- decorative bottom-anchored layer */}
                  <img
                    src={mushroomImageSrc.trim()}
                    alt={mushroomImageAlt || ""}
                    decoding="async"
                    fetchPriority="low"
                    sizes="100vw"
                    className="absolute bottom-0 left-1/2 max-w-none object-contain object-bottom mix-blend-screen will-change-transform"
                    style={{
                      width: MUSHROOM_WIDTH,
                      transform: `translate3d(-50%, calc(${MUSHROOM_BOTTOM_SINK_PERCENT}% + (1 - var(--arp-scroll-t, 0)) * ${mushroomHidePercent}%), 0) scaleX(1.08)`,
                      opacity: `calc(${mushroomBaseOpacity} + var(--arp-pulse, 0) * 0.2 + var(--arp-pulse-spike, 0) * 0.16)`,
                      filter:
                        "brightness(calc(0.9 + var(--arp-pulse, 0) * 0.2)) contrast(1.28) saturate(calc(1.04 + var(--arp-pulse, 0) * 0.3))",
                    }}
                    onError={() => setMushroomImageFailed(true)}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                    style={{
                      WebkitMaskImage: `url(${mushroomImageSrc.trim()})`,
                      maskImage: `url(${mushroomImageSrc.trim()})`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center bottom",
                      maskPosition: "center bottom",
                      WebkitMaskSize: `${MUSHROOM_WIDTH} auto`,
                      maskSize: `${MUSHROOM_WIDTH} auto`,
                      opacity: "calc(var(--arp-pulse-spike, 0) * 0.34)",
                      transform:
                        "translate3d(0, calc(120% - var(--arp-pulse-spike, 0) * 220%), 0)",
                      filter: "blur(1.6px)",
                      backgroundImage:
                        "linear-gradient(180deg, transparent 0%, transparent 44%, rgba(255,255,255,0.7) 49%, rgba(255,255,255,0.24) 52%, transparent 58%, transparent 100%)",
                    }}
                  />
                </>
              ) : null}
            </>
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-black will-change-transform"
              style={{
                transform:
                  "scale(calc(1 + var(--arp-pulse, 0) * 0.1 * var(--arp-visual-mul, 1))) translateZ(0)",
                filter:
                  "brightness(calc(0.92 + var(--arp-pulse, 0) * 0.22 * var(--arp-visual-mul, 1))) saturate(calc(1 + var(--arp-pulse, 0) * 0.28 * var(--arp-visual-mul, 1))) hue-rotate(calc(var(--arp-pulse-spike, 0) * 8deg))",
              }}
            />
          )}
        </div>
      </div>

      {/* Controls sit above main content (not inside z-0 bg layer, so clicks work) */}
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
                  onClick={() => {
                    awardLevelEvent({
                      type: "atmosphere-minimize",
                      key: "atmosphere-minimize",
                      source: "audio-dock",
                    });
                    setDockOpen(false);
                  }}
                  className={cn(
                    "flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full text-white/80 [-webkit-tap-highlight-color:transparent] hover:bg-white/10 md:h-9 md:w-9",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 active:bg-white/15",
                  )}
                  aria-label="Hide music controls"
                >
                  <ChevronDown className="h-5 w-5 md:hidden" aria-hidden />
                  <ChevronLeft className="hidden h-5 w-5 shrink-0 md:inline" aria-hidden />
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
