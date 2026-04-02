"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { useHydrated } from "@/lib/use-hydrated";
import {
  BG_SCROLL_SHIFT_RANGE_VH,
  BG_PANORAMA_MIN_WIDTH_VW,
  BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
  MOBILE_ARP_SHIFT_END_VH,
  MOBILE_ARP_SHIFT_END_VW,
  MOBILE_ARP_SHIFT_START_VH,
  MOBILE_ARP_SHIFT_START_VW,
  panoramaScrollRangeVh,
  panoramaScrollRangeVw,
} from "@/lib/background-parallax";
import { useIsNarrowViewport } from "@/lib/use-max-width-media";
import { useScrollDrivenShiftX } from "@/lib/use-scroll-driven-shift-x";
import { RainLumaKeyCanvas } from "@/components/effects/RainLumaKeyCanvas";
import { useGlobalAtmosphereAudio } from "@/components/audio/GlobalAtmosphereAudio";

type AudioReactiveBackgroundProps = {
  imageSrc: string;
  beatFlashImageSrc?: string;
  beatFlashOpacityGain?: number;
  mushroomImageSrc?: string;
  rainVideoSrc?: string;
  rainVideoBlend?: "normal" | "screen" | "plus-lighter";
  rainVideoKey?: "none" | "luma";
  rainVideoLumaThreshold?: number;
  rainVideoLumaSoften?: number;
  rainVideoLumaCeiling?: number;
  rainVideoLumaCeilingSoften?: number;
  imageAlt?: string;
  mushroomImageAlt?: string;
};

const SMOKE_OVERLAY_WIDTH_DESKTOP = "max(150vw, 98rem)";
const SMOKE_OVERLAY_WIDTH_MOBILE = "max(255vw, 92rem)";

export function AudioReactiveBackground({
  imageSrc,
  beatFlashImageSrc = "",
  beatFlashOpacityGain = 1,
  mushroomImageSrc = "",
  rainVideoSrc = "",
  rainVideoBlend = "normal",
  rainVideoKey = "none",
  rainVideoLumaThreshold = 0.12,
  rainVideoLumaSoften = 0.06,
  rainVideoLumaCeiling = 1,
  rainVideoLumaCeilingSoften = 0.05,
  imageAlt = "",
  mushroomImageAlt = "",
}: AudioReactiveBackgroundProps) {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const narrowViewport = useIsNarrowViewport();
  const rainVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseImageFailed, setBaseImageFailed] = useState(false);
  const [beatFlashImageFailed, setBeatFlashImageFailed] = useState(false);
  const [mushroomImageFailed, setMushroomImageFailed] = useState(false);
  const [rainVideoFailed, setRainVideoFailed] = useState(false);
  const { playing } = useGlobalAtmosphereAudio();
  const hasBaseImage = Boolean(imageSrc?.trim()) && !baseImageFailed;
  const hasBeatFlashImage =
    Boolean((beatFlashImageSrc || imageSrc)?.trim()) && !beatFlashImageFailed;
  const hasMushroomImage = Boolean(mushroomImageSrc?.trim()) && !mushroomImageFailed;
  const hasRainVideo = Boolean(rainVideoSrc?.trim()) && !rainVideoFailed;

  const rainBlendRaw = (rainVideoBlend ?? "normal").toString().trim().toLowerCase();
  const rainBlendMode: "normal" | "screen" | "plus-lighter" =
    rainBlendRaw === "screen" || rainBlendRaw === "plus-lighter"
      ? rainBlendRaw
      : "normal";
  const useLumaKey =
    (rainVideoKey ?? "none").toString().trim().toLowerCase() === "luma";
  const lumaThr =
    typeof rainVideoLumaThreshold === "number" &&
    Number.isFinite(rainVideoLumaThreshold)
      ? Math.min(1, Math.max(0, rainVideoLumaThreshold))
      : 0.12;
  const lumaSoft =
    typeof rainVideoLumaSoften === "number" &&
    Number.isFinite(rainVideoLumaSoften)
      ? Math.min(1, Math.max(0, rainVideoLumaSoften))
      : 0.06;
  const lumaCeil =
    typeof rainVideoLumaCeiling === "number" &&
    Number.isFinite(rainVideoLumaCeiling)
      ? Math.min(1, Math.max(0, rainVideoLumaCeiling))
      : 1;
  const lumaCeilSoft =
    typeof rainVideoLumaCeilingSoften === "number" &&
    Number.isFinite(rainVideoLumaCeilingSoften)
      ? Math.min(1, Math.max(0, rainVideoLumaCeilingSoften))
      : 0.05;

  useEffect(() => {
    setBaseImageFailed(false);
  }, [imageSrc]);
  useEffect(() => {
    setBeatFlashImageFailed(false);
  }, [beatFlashImageSrc, imageSrc]);
  useEffect(() => {
    setMushroomImageFailed(false);
  }, [mushroomImageSrc]);
  useEffect(() => {
    setRainVideoFailed(false);
  }, [rainVideoSrc]);

  const scrollParallaxEnabled = hydrated;
  const panoramaMinWidthVw = narrowViewport
    ? BG_PANORAMA_MIN_WIDTH_VW_MOBILE
    : BG_PANORAMA_MIN_WIDTH_VW;
  const scrollRangeVw = panoramaScrollRangeVw(panoramaMinWidthVw);
  const scrollRangeVh = panoramaScrollRangeVh(BG_SCROLL_SHIFT_RANGE_VH);
  const panoramaWidth = `${panoramaMinWidthVw}vw`;
  useScrollDrivenShiftX(containerRef, {
    enabled: scrollParallaxEnabled,
    mirrorVarToDocumentElement: hasRainVideo,
    ...(narrowViewport
      ? {
          shiftStartVw: MOBILE_ARP_SHIFT_START_VW,
          shiftEndVw: MOBILE_ARP_SHIFT_END_VW,
          shiftStartVh: MOBILE_ARP_SHIFT_START_VH,
          shiftEndVh: MOBILE_ARP_SHIFT_END_VH,
        }
      : {
          shiftStartVw: 0,
          shiftEndVw: -scrollRangeVw,
          shiftStartVh: 0,
          shiftEndVh: -scrollRangeVh,
        }),
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
    const v = rainVideoRef.current;
    if (!v || !rainVideoSrc?.trim() || rainVideoFailed) {
      return;
    }
    if (playing) {
      void v.play().catch(() => {});
    } else {
      v.pause();
      try {
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }, [playing, rainVideoSrc, rainVideoFailed]);

  const smokeOverlayWidth = narrowViewport
    ? SMOKE_OVERLAY_WIDTH_MOBILE
    : SMOKE_OVERLAY_WIDTH_DESKTOP;
  const flashGain =
    typeof beatFlashOpacityGain === "number" && Number.isFinite(beatFlashOpacityGain)
      ? Math.min(2, Math.max(0, beatFlashOpacityGain))
      : 1;

  const rainOpacityStyle: CSSProperties = {
    opacity: playing
      ? reduceMotion
        ? "calc(0.07 + var(--arp-pulse, 0) * 0.22 + var(--arp-pulse-spike, 0) * 0.16)"
        : "calc(0.14 + var(--arp-pulse, 0) * 0.42 + var(--arp-pulse-spike, 0) * 0.36)"
      : 0,
  };

  const rainVideoStyle: CSSProperties = useLumaKey
    ? { opacity: 0 }
    : {
        ...rainOpacityStyle,
        ...(rainBlendMode !== "normal"
          ? { mixBlendMode: rainBlendMode }
          : {}),
      };

  const rainCanvasStyle: CSSProperties = {
    ...rainOpacityStyle,
    ...(useLumaKey && rainBlendMode !== "normal"
      ? { mixBlendMode: rainBlendMode }
      : {}),
  };

  const rainPortalLayer = hasRainVideo ? (
      <div
        className="portfolio-rain-overlay pointer-events-none fixed inset-0 z-[520] min-h-[100svh] min-h-[100dvh] overflow-hidden"
        aria-hidden
      >
        <div className="portfolio-rain-video-wrap pointer-events-none absolute inset-0 overflow-hidden">
          <video
            ref={rainVideoRef}
            className="portfolio-rain-video"
            src={rainVideoSrc.trim()}
            muted
            loop
            playsInline
            preload="metadata"
            style={rainVideoStyle}
            onError={() => setRainVideoFailed(true)}
          />
          <RainLumaKeyCanvas
            videoRef={rainVideoRef}
            enabled={useLumaKey && playing}
            lumaThreshold={lumaThr}
            soften={lumaSoft}
            lumaCeiling={lumaCeil}
            lumaCeilingSoften={lumaCeilSoft}
            style={rainCanvasStyle}
          />
        </div>
      </div>
  ) : null;

  return (
    <>
      {/* Visual layers only: stacking context stays behind page content */}
      <div
        ref={containerRef}
        className="audio-reactive-bg-root pointer-events-none fixed inset-x-0 top-0 bottom-0 z-0 min-h-[100svh] min-h-[100dvh] overflow-hidden [--arp-visual-mul:0.96] md:[--arp-visual-mul:1]"
      >
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
                className="absolute left-0 top-0 h-full min-h-full max-w-none object-cover will-change-transform max-md:object-[50%_16%] md:object-top-left"
                style={{
                  width: panoramaWidth,
                  minWidth: panoramaWidth,
                  transform:
                    "translate3d(var(--arp-scroll-x, 0vw), 0, 0) scale(calc(1 + var(--arp-pulse, 0) * 0.1 * var(--arp-visual-mul, 1)))",
                  filter:
                    "brightness(calc(0.9 + var(--arp-pulse, 0) * 0.22 * var(--arp-visual-mul, 1))) contrast(calc(1 + var(--arp-pulse, 0) * 0.09 * var(--arp-visual-mul, 1))) saturate(calc(1 + var(--arp-pulse, 0) * 0.26 * var(--arp-visual-mul, 1))) hue-rotate(calc(var(--arp-pulse-spike, 0) * 9deg))",
                }}
                onError={() => setBaseImageFailed(true)}
              />
              {hasBeatFlashImage ? (
                <img
                  src={(beatFlashImageSrc || imageSrc).trim()}
                  alt=""
                  decoding="async"
                  fetchPriority="low"
                  sizes="100vw"
                  className="pointer-events-none absolute left-0 top-0 h-full min-h-full max-w-none object-cover mix-blend-screen will-change-transform max-md:object-[50%_16%] md:object-top-left"
                  style={{
                    width: panoramaWidth,
                    minWidth: panoramaWidth,
                    transform:
                      "translate3d(var(--arp-scroll-x, 0vw), 0, 0)",
                    opacity: playing
                      ? `calc((0.03 + var(--arp-pulse, 0) * 0.08 + var(--arp-pulse-spike, 0) * 0.22) * ${flashGain})`
                      : "0",
                    filter:
                      "hue-rotate(86deg) saturate(1.5) contrast(1.14) brightness(1.1)",
                  }}
                  onError={() => setBeatFlashImageFailed(true)}
                />
              ) : null}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 mix-blend-screen"
                style={{
                  opacity: playing
                    ? narrowViewport
                      ? reduceMotion
                        ? "calc(0.24 + var(--arp-pulse, 0) * 0.34 + var(--arp-pulse-spike, 0) * 0.44)"
                        : "calc(0.34 + var(--arp-pulse, 0) * 0.46 + var(--arp-pulse-spike, 0) * 0.58)"
                      : reduceMotion
                        ? "calc(0.04 + var(--arp-pulse, 0) * 0.14 + var(--arp-pulse-spike, 0) * 0.22)"
                        : "calc(0.06 + var(--arp-pulse, 0) * 0.2 + var(--arp-pulse-spike, 0) * 0.3)"
                    : "0",
                  backgroundImage:
                    "radial-gradient(ellipse 76% 54% at 52% 50%, rgba(255, 84, 192, 0.72) 0%, rgba(232, 121, 249, 0.48) 32%, rgba(168, 85, 247, 0.3) 56%, rgba(125, 64, 196, 0.12) 72%, transparent 82%), radial-gradient(ellipse 44% 34% at 58% 54%, rgba(255, 194, 232, 0.42) 0%, transparent 68%)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(8,11,16,0.2) 0%, rgba(10,14,19,0.26) 52%, rgba(8,11,16,0.22) 100%)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  opacity: playing
                    ? narrowViewport
                      ? reduceMotion
                        ? "calc(0.36 + var(--arp-pulse, 0) * 0.22 + var(--arp-pulse-spike, 0) * 0.2)"
                        : "calc(0.46 + var(--arp-pulse, 0) * 0.28 + var(--arp-pulse-spike, 0) * 0.24)"
                      : reduceMotion
                        ? "calc(0.165 + var(--arp-pulse, 0) * 0.14 + var(--arp-pulse-spike, 0) * 0.12)"
                        : "calc(0.22 + var(--arp-pulse, 0) * 0.185 + var(--arp-pulse-spike, 0) * 0.165)"
                    : "0",
                  background:
                    "linear-gradient(180deg, rgba(8,11,16,0.56) 0%, rgba(10,14,19,0.63) 52%, rgba(8,11,16,0.56) 100%)",
                }}
              />
              {hasMushroomImage ? (
                <div className="portfolio-smoke-parallax pointer-events-none absolute inset-0">
                  {/* eslint-disable-next-line @next/next/no-img-element -- bottom smoke parallax sits above dark plate, below rain/text chrome */}
                  <img
                    src={mushroomImageSrc.trim()}
                    alt={mushroomImageAlt || ""}
                    decoding="async"
                    fetchPriority="low"
                    sizes="100vw"
                    className="pointer-events-none absolute bottom-0 left-1/2 max-w-none object-contain object-bottom mix-blend-screen will-change-transform"
                    style={{
                      width: smokeOverlayWidth,
                      transform:
                        `translate3d(calc(-50% - var(--arp-scroll-x, 0vw) * 0.26), 20%, 0) scale(${narrowViewport ? "calc(1.3 + var(--arp-pulse, 0) * 0.12 + var(--arp-pulse-spike, 0) * 0.1)" : "calc(1.04 + var(--arp-pulse, 0) * 0.08 + var(--arp-pulse-spike, 0) * 0.05)"})`,
                      opacity: playing
                        ? narrowViewport
                          ? reduceMotion
                            ? "calc(0.54 + var(--arp-pulse, 0) * 0.24 + var(--arp-pulse-spike, 0) * 0.3)"
                            : "calc(0.68 + var(--arp-pulse, 0) * 0.32 + var(--arp-pulse-spike, 0) * 0.4)"
                          : reduceMotion
                            ? "calc(0.24 + var(--arp-pulse, 0) * 0.16 + var(--arp-pulse-spike, 0) * 0.2)"
                            : "calc(0.3 + var(--arp-pulse, 0) * 0.24 + var(--arp-pulse-spike, 0) * 0.32)"
                        : "0",
                      filter:
                        "brightness(calc(0.96 + var(--arp-pulse, 0) * 0.24 + var(--arp-pulse-spike, 0) * 0.16)) contrast(1.28) saturate(calc(1.1 + var(--arp-pulse, 0) * 0.24))",
                    }}
                    onError={() => setMushroomImageFailed(true)}
                  />
                </div>
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

      {hydrated && rainPortalLayer
        ? createPortal(rainPortalLayer, document.body)
        : null}
    </>
  );
}
