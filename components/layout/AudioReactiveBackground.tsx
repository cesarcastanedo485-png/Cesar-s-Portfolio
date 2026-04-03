"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
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
const ARP_TUNE_STORAGE_KEY = "arp-mobile-tune-v1";

type MobileArpTune = {
  widthVw: number;
  startVw: number;
  endVw: number;
  objectPosX: number;
  objectPosY: number;
  snapToEndWithinPx: number;
  pulseScale: number;
};

type DragMode = "off" | "start" | "end" | "frameY";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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
  const baseImageRef = useRef<HTMLImageElement>(null);
  const [baseImageFailed, setBaseImageFailed] = useState(false);
  const [beatFlashImageFailed, setBeatFlashImageFailed] = useState(false);
  const [mushroomImageFailed, setMushroomImageFailed] = useState(false);
  const [rainVideoFailed, setRainVideoFailed] = useState(false);
  const [tuneMode, setTuneMode] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>("off");
  const [mobileTune, setMobileTune] = useState<MobileArpTune>({
    widthVw: BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
    startVw: MOBILE_ARP_SHIFT_START_VW,
    endVw: MOBILE_ARP_SHIFT_END_VW,
    objectPosX: 2,
    objectPosY: 0,
    snapToEndWithinPx: 220,
    pulseScale: 0,
  });
  const { playing } = useGlobalAtmosphereAudio();
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startVw: number;
    endVw: number;
    objectPosY: number;
    mode: DragMode;
  } | null>(null);
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

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const enabled = params.get("arpTune") === "1";
    setTuneMode(enabled);
    if (!enabled) {
      return;
    }
    try {
      const raw = window.localStorage.getItem(ARP_TUNE_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<MobileArpTune>;
      setMobileTune((prev) => ({
        widthVw: typeof parsed.widthVw === "number" ? parsed.widthVw : prev.widthVw,
        startVw:
          typeof parsed.startVw === "number" ? parsed.startVw : prev.startVw,
        endVw: typeof parsed.endVw === "number" ? parsed.endVw : prev.endVw,
        objectPosX:
          typeof parsed.objectPosX === "number"
            ? parsed.objectPosX
            : prev.objectPosX,
        objectPosY:
          typeof parsed.objectPosY === "number"
            ? parsed.objectPosY
            : prev.objectPosY,
        snapToEndWithinPx:
          typeof parsed.snapToEndWithinPx === "number"
            ? parsed.snapToEndWithinPx
            : prev.snapToEndWithinPx,
        pulseScale:
          typeof parsed.pulseScale === "number"
            ? parsed.pulseScale
            : prev.pulseScale,
      }));
    } catch {
      /* ignore malformed local tune payload */
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !tuneMode || typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(ARP_TUNE_STORAGE_KEY, JSON.stringify(mobileTune));
  }, [hydrated, mobileTune, tuneMode]);

  const mobileWidthVw = tuneMode
    ? mobileTune.widthVw
    : BG_PANORAMA_MIN_WIDTH_VW_MOBILE;
  const mobileStartVw = tuneMode
    ? mobileTune.startVw
    : MOBILE_ARP_SHIFT_START_VW;
  const mobileEndVw = tuneMode ? mobileTune.endVw : MOBILE_ARP_SHIFT_END_VW;
  const mobileSnapPx = tuneMode ? mobileTune.snapToEndWithinPx : 220;
  const mobileObjectPosX = tuneMode ? mobileTune.objectPosX : 2;
  const mobileObjectPosY = tuneMode ? mobileTune.objectPosY : 0;
  const mobileTunePulseScale = tuneMode ? mobileTune.pulseScale : 0;

  const onDragPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!tuneMode || dragMode === "off") {
      return;
    }
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startVw: mobileTune.startVw,
      endVw: mobileTune.endVw,
      objectPosY: mobileTune.objectPosY,
      mode: dragMode,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onDragPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== e.pointerId) {
      return;
    }
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const deltaVw = (dx / Math.max(1, window.innerWidth)) * 100;
    const deltaYPercent = (dy / Math.max(1, window.innerHeight)) * 100;
    if (dragState.mode === "start") {
      setMobileTune((s) => ({
        ...s,
        startVw: clamp(dragState.startVw + deltaVw, -80, 80),
      }));
    } else if (dragState.mode === "end") {
      setMobileTune((s) => ({
        ...s,
        endVw: clamp(dragState.endVw + deltaVw, -220, 40),
      }));
    } else if (dragState.mode === "frameY") {
      setMobileTune((s) => ({
        ...s,
        objectPosY: clamp(dragState.objectPosY + deltaYPercent, -30, 40),
      }));
    }
    e.preventDefault();
  };

  const onDragPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId === e.pointerId) {
      dragStateRef.current = null;
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const scrollParallaxEnabled = hydrated;
  const panoramaMinWidthVw = narrowViewport
    ? mobileWidthVw
    : BG_PANORAMA_MIN_WIDTH_VW;
  const scrollRangeVw = panoramaScrollRangeVw(panoramaMinWidthVw);
  const scrollRangeVh = panoramaScrollRangeVh(BG_SCROLL_SHIFT_RANGE_VH);
  const panoramaWidth = `${panoramaMinWidthVw}vw`;
  useScrollDrivenShiftX(containerRef, {
    enabled: scrollParallaxEnabled,
    mirrorVarToDocumentElement: hasRainVideo,
    ...(narrowViewport
      ? {
          shiftStartVw: mobileStartVw,
          shiftEndVw: mobileEndVw,
          shiftStartVh: MOBILE_ARP_SHIFT_START_VH,
          shiftEndVh: MOBILE_ARP_SHIFT_END_VH,
          snapToEndWithinPx: mobileSnapPx,
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
  const mobileObjectPosition = narrowViewport
    ? `${mobileObjectPosX}% ${mobileObjectPosY}%`
    : "left top";
  const mobileObjectFit = "cover";
  const mobilePulseScale = narrowViewport ? mobileTunePulseScale : 0.1;
  const flashGain =
    typeof beatFlashOpacityGain === "number" && Number.isFinite(beatFlashOpacityGain)
      ? Math.min(2, Math.max(0, beatFlashOpacityGain))
      : 1;

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7531/ingest/a2f6d748-df85-4288-afaf-dcecbfdaa24b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "2431dd",
      },
      body: JSON.stringify({
        sessionId: "2431dd",
        runId: "pre-fix",
        hypothesisId: "H2_H3_H4",
        location: "AudioReactiveBackground.tsx:layer-snapshot",
        message: "audio reactive layer config snapshot",
        data: {
          hydrated,
          narrowViewport,
          playing,
          hasBaseImage,
          hasBeatFlashImage,
          hasMushroomImage,
          hasRainVideo,
          baseImageFailed,
          beatFlashImageFailed,
          mushroomImageFailed,
          rainVideoFailed,
          panoramaMinWidthVw,
          panoramaWidth,
          mobileShiftStartVw: MOBILE_ARP_SHIFT_START_VW,
          mobileShiftEndVw: MOBILE_ARP_SHIFT_END_VW,
          flashGain,
          smokeOverlayWidth,
          mobileObjectPosition,
          mobileObjectFit,
          mobilePulseScale,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [
    baseImageFailed,
    beatFlashImageFailed,
    flashGain,
    hasBaseImage,
    hasBeatFlashImage,
    hasMushroomImage,
    hasRainVideo,
    hydrated,
    mushroomImageFailed,
    narrowViewport,
    panoramaMinWidthVw,
    panoramaWidth,
    playing,
    rainVideoFailed,
    smokeOverlayWidth,
    mobileObjectPosition,
    mobileObjectFit,
    mobilePulseScale,
  ]);

  useEffect(() => {
    if (!hydrated || !narrowViewport || !hasBaseImage) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;
      const baseImage = baseImageRef.current;
      if (!container || !baseImage) {
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const imageRect = baseImage.getBoundingClientRect();
      const computedImage = window.getComputedStyle(baseImage);
      const computedContainer = window.getComputedStyle(container);
      // #region agent log
      fetch("http://127.0.0.1:7531/ingest/a2f6d748-df85-4288-afaf-dcecbfdaa24b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "2431dd",
        },
        body: JSON.stringify({
          sessionId: "2431dd",
          runId: "pre-fix",
          hypothesisId: "H6_H7_H8",
          location: "AudioReactiveBackground.tsx:mobile-frame-metrics",
          message: "mobile frame and crop metrics",
          data: {
            playing,
            panoramaWidth,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            visualViewportHeight: window.visualViewport?.height ?? null,
            containerHeight: containerRect.height,
            containerWidth: containerRect.width,
            imageWidth: imageRect.width,
            imageHeight: imageRect.height,
            imageTop: imageRect.top,
            imageBottom: imageRect.bottom,
            objectPosition: computedImage.objectPosition,
            objectFit: computedImage.objectFit,
            transform: computedImage.transform,
            arpScrollX: computedContainer.getPropertyValue("--arp-scroll-x").trim(),
            arpPulse: computedContainer.getPropertyValue("--arp-pulse").trim(),
            naturalWidth: baseImage.naturalWidth,
            naturalHeight: baseImage.naturalHeight,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    });
    return () => cancelAnimationFrame(frame);
  }, [hasBaseImage, hydrated, narrowViewport, panoramaWidth, playing]);

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
                ref={baseImageRef}
                decoding="async"
                fetchPriority="low"
                sizes="100vw"
                className="absolute left-0 top-0 h-full min-h-full max-w-none object-cover will-change-transform md:object-top-left"
                style={{
                  width: panoramaWidth,
                  minWidth: panoramaWidth,
                  objectPosition: mobileObjectPosition,
                  objectFit: mobileObjectFit,
                  transform:
                    `translate3d(var(--arp-scroll-x, 0vw), 0, 0) scale(calc(1 + var(--arp-pulse, 0) * ${mobilePulseScale} * var(--arp-visual-mul, 1)))`,
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
                  className="pointer-events-none absolute left-0 top-0 h-full min-h-full max-w-none object-cover mix-blend-screen will-change-transform md:object-top-left"
                  style={{
                    width: panoramaWidth,
                    minWidth: panoramaWidth,
                    objectPosition: mobileObjectPosition,
                    objectFit: mobileObjectFit,
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
                        ? "calc(0.32 + var(--arp-pulse, 0) * 0.2 + var(--arp-pulse-spike, 0) * 0.18)"
                        : "calc(0.41 + var(--arp-pulse, 0) * 0.25 + var(--arp-pulse-spike, 0) * 0.22)"
                      : reduceMotion
                        ? "calc(0.165 + var(--arp-pulse, 0) * 0.14 + var(--arp-pulse-spike, 0) * 0.12)"
                        : "calc(0.22 + var(--arp-pulse, 0) * 0.185 + var(--arp-pulse-spike, 0) * 0.165)"
                    : "0",
                  background:
                    "linear-gradient(180deg, rgba(8,11,16,0.56) 0%, rgba(10,14,19,0.63) 52%, rgba(8,11,16,0.56) 100%)",
                }}
              />
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
                  `scale(calc(1 + var(--arp-pulse, 0) * ${mobilePulseScale} * var(--arp-visual-mul, 1))) translateZ(0)`,
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

      {tuneMode && dragMode !== "off" ? (
        <div
          className="fixed inset-0 z-[998] cursor-grab active:cursor-grabbing"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
          aria-hidden
        />
      ) : null}

      {tuneMode ? (
        <div className="fixed bottom-3 right-3 z-[999] w-[min(22rem,92vw)] rounded-xl border border-white/20 bg-black/80 p-3 text-xs text-white shadow-2xl backdrop-blur">
          <p className="mb-2 font-semibold">Mobile Parallax Tuner</p>
          <p className="mb-2 text-[11px] text-white/70">
            Active only with <code>?arpTune=1</code>. Values persist locally.
          </p>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded px-2 py-1 ${dragMode === "start" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => setDragMode("start")}
            >
              Drag Top Anchor
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${dragMode === "end" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => setDragMode("end")}
            >
              Drag Bottom Anchor
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${dragMode === "frameY" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => setDragMode("frameY")}
            >
              Drag Vertical Frame
            </button>
            <button
              type="button"
              className="rounded bg-white/20 px-2 py-1"
              onClick={() => setDragMode("off")}
            >
              Stop Drag
            </button>
          </div>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              className="rounded bg-white/20 px-2 py-1"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Go Top
            </button>
            <button
              type="button"
              className="rounded bg-white/20 px-2 py-1"
              onClick={() =>
                window.scrollTo({
                  top: document.documentElement.scrollHeight,
                  behavior: "smooth",
                })
              }
            >
              Go Bottom
            </button>
          </div>
          <p className="mb-2 text-[11px] text-white/70">
            1) Tap drag mode 2) go top/bottom 3) drag background until framing looks right.
          </p>
          <label className="mb-1 block">
            widthVw: {mobileTune.widthVw}
            <input
              type="range"
              min={120}
              max={220}
              step={1}
              value={mobileTune.widthVw}
              onChange={(e) =>
                setMobileTune((s) => ({ ...s, widthVw: Number(e.target.value) }))
              }
              className="w-full"
            />
          </label>
          <label className="mb-1 block">
            startVw: {mobileTune.startVw}
            <input
              type="range"
              min={-40}
              max={40}
              step={1}
              value={mobileTune.startVw}
              onChange={(e) =>
                setMobileTune((s) => ({ ...s, startVw: Number(e.target.value) }))
              }
              className="w-full"
            />
          </label>
          <label className="mb-1 block">
            endVw: {mobileTune.endVw}
            <input
              type="range"
              min={-220}
              max={40}
              step={1}
              value={mobileTune.endVw}
              onChange={(e) =>
                setMobileTune((s) => ({ ...s, endVw: Number(e.target.value) }))
              }
              className="w-full"
            />
          </label>
          <label className="mb-1 block">
            objectPosX: {mobileTune.objectPosX}%
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={mobileTune.objectPosX}
              onChange={(e) =>
                setMobileTune((s) => ({
                  ...s,
                  objectPosX: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </label>
          <label className="mb-1 block">
            objectPosY: {mobileTune.objectPosY}%
            <input
              type="range"
              min={-20}
              max={30}
              step={1}
              value={mobileTune.objectPosY}
              onChange={(e) =>
                setMobileTune((s) => ({
                  ...s,
                  objectPosY: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </label>
          <label className="mb-1 block">
            snapToEndWithinPx: {mobileTune.snapToEndWithinPx}
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={mobileTune.snapToEndWithinPx}
              onChange={(e) =>
                setMobileTune((s) => ({
                  ...s,
                  snapToEndWithinPx: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </label>
          <label className="mb-2 block">
            pulseScale: {mobileTune.pulseScale.toFixed(3)}
            <input
              type="range"
              min={0}
              max={0.12}
              step={0.005}
              value={mobileTune.pulseScale}
              onChange={(e) =>
                setMobileTune((s) => ({
                  ...s,
                  pulseScale: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-white/20 px-2 py-1"
              onClick={() =>
                setMobileTune({
                  widthVw: BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
                  startVw: MOBILE_ARP_SHIFT_START_VW,
                  endVw: MOBILE_ARP_SHIFT_END_VW,
                  objectPosX: 2,
                  objectPosY: 0,
                  snapToEndWithinPx: 220,
                  pulseScale: 0,
                })
              }
            >
              Reset
            </button>
            <button
              type="button"
              className="rounded bg-white/20 px-2 py-1"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  void navigator.clipboard.writeText(
                    JSON.stringify(mobileTune, null, 2),
                  );
                }
              }}
            >
              Copy JSON
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
