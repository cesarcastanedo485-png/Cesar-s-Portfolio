"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { useHydrated } from "@/lib/use-hydrated";
import {
  BG_PANORAMA_MIN_WIDTH_VW,
  BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
  MOBILE_ARP_SHIFT_END_VW,
  MOBILE_ARP_SHIFT_START_VW,
  panoramaScrollRangeVw,
} from "@/lib/background-parallax";
import { useIsNarrowViewport } from "@/lib/use-max-width-media";
import { useScrollDrivenShiftX } from "@/lib/use-scroll-driven-shift-x";
import { RainLumaKeyCanvas } from "@/components/effects/RainLumaKeyCanvas";
import { useGlobalAtmosphereAudio } from "@/components/audio/GlobalAtmosphereAudio";

type AudioReactiveBackgroundProps = {
  imageSrc: string;
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

const SMOKE_OVERLAY_WIDTH_DESKTOP = "max(140vw, 96rem)";
const SMOKE_OVERLAY_WIDTH_MOBILE = "max(185vw, 72rem)";

export function AudioReactiveBackground({
  imageSrc,
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
  const [mushroomImageFailed, setMushroomImageFailed] = useState(false);
  const [rainVideoFailed, setRainVideoFailed] = useState(false);
  const { playing } = useGlobalAtmosphereAudio();
  const hasBaseImage = Boolean(imageSrc?.trim()) && !baseImageFailed;
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
  useScrollDrivenShiftX(containerRef, {
    enabled: scrollParallaxEnabled,
    mirrorVarToDocumentElement: hasRainVideo,
    ...(narrowViewport
      ? {
          shiftStartVw: MOBILE_ARP_SHIFT_START_VW,
          shiftEndVw: MOBILE_ARP_SHIFT_END_VW,
        }
      : { rangeVw: scrollRangeVw }),
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

  const panoramaCenterY = narrowViewport ? "-40%" : "-42%";
  const smokeOverlayWidth = narrowViewport
    ? SMOKE_OVERLAY_WIDTH_MOBILE
    : SMOKE_OVERLAY_WIDTH_DESKTOP;

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
                className="absolute left-1/2 top-1/2 h-full min-h-full max-w-none object-cover will-change-transform"
                style={{
                  minWidth: `${panoramaMinWidthVw}vw`,
                  transform: `translate3d(calc(-50% + var(--arp-scroll-x, 0vw)), ${panoramaCenterY}, 0) scale(calc(1 + var(--arp-pulse, 0) * 0.1 * var(--arp-visual-mul, 1)))`,
                  filter:
                    "brightness(calc(0.9 + var(--arp-pulse, 0) * 0.22 * var(--arp-visual-mul, 1))) contrast(calc(1 + var(--arp-pulse, 0) * 0.09 * var(--arp-visual-mul, 1))) saturate(calc(1 + var(--arp-pulse, 0) * 0.26 * var(--arp-visual-mul, 1))) hue-rotate(calc(var(--arp-pulse-spike, 0) * 9deg))",
                }}
                onError={() => setBaseImageFailed(true)}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(8,11,16,0.08) 0%, rgba(10,14,19,0.1) 52%, rgba(8,11,16,0.09) 100%)",
                }}
              />
              {hasMushroomImage ? (
                /* eslint-disable-next-line @next/next/no-img-element -- centered reactive smoke, hidden until music plays */
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
                      "translate3d(calc(-50% - var(--arp-scroll-x, 0vw) * 0.16), 22%, 0) scale(calc(0.95 + var(--arp-pulse, 0) * 0.1 + var(--arp-pulse-spike, 0) * 0.07))",
                    opacity: playing
                      ? reduceMotion
                        ? "calc(var(--arp-pulse, 0) * 0.2 + var(--arp-pulse-spike, 0) * 0.28)"
                        : "calc(var(--arp-pulse, 0) * 0.34 + var(--arp-pulse-spike, 0) * 0.58)"
                      : "0",
                    filter:
                      "brightness(calc(0.84 + var(--arp-pulse, 0) * 0.36 + var(--arp-pulse-spike, 0) * 0.24)) contrast(1.34) saturate(calc(1.06 + var(--arp-pulse, 0) * 0.44))",
                  }}
                  onError={() => setMushroomImageFailed(true)}
                />
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
