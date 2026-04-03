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
type PreviewMode = "scroll" | "start" | "end";
type TuneProfileName = "mobile" | "desktop";

type TuneProfiles = {
  mobile: MobileArpTune;
  desktop: MobileArpTune;
};

const DEFAULT_MOBILE_TUNE: MobileArpTune = {
  widthVw: BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
  startVw: MOBILE_ARP_SHIFT_START_VW,
  endVw: MOBILE_ARP_SHIFT_END_VW,
  objectPosX: 2,
  objectPosY: 0,
  snapToEndWithinPx: 220,
  pulseScale: 0,
};

const DEFAULT_DESKTOP_TUNE: MobileArpTune = {
  widthVw: BG_PANORAMA_MIN_WIDTH_VW,
  startVw: 0,
  endVw: -panoramaScrollRangeVw(BG_PANORAMA_MIN_WIDTH_VW),
  objectPosX: 0,
  objectPosY: 0,
  snapToEndWithinPx: 0,
  pulseScale: 0.1,
};
const START_VW_MIN = -140;
const START_VW_MAX = 140;
const END_VW_MIN = -220;
const END_VW_MAX = 80;
const WIDTH_VW_MIN = 120;
const WIDTH_VW_MAX = 260;

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
  const [previewMode, setPreviewMode] = useState<PreviewMode>("scroll");
  const [selectedProfile, setSelectedProfile] = useState<TuneProfileName>("mobile");
  const [tuneProfiles, setTuneProfiles] = useState<TuneProfiles>({
    mobile: DEFAULT_MOBILE_TUNE,
    desktop: DEFAULT_DESKTOP_TUNE,
  });
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedMode, setGuidedMode] = useState(false);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const { playing } = useGlobalAtmosphereAudio();
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    mode: DragMode;
  } | null>(null);
  const pointerCacheRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<{
    startDistance: number;
    baseWidthVw: number;
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
      const parsed = JSON.parse(raw) as Partial<TuneProfiles & MobileArpTune>;
      // Backward compatibility: old single-profile payload maps to mobile.
      const parseTune = (
        input: Partial<MobileArpTune> | undefined,
        defaults: MobileArpTune,
      ): MobileArpTune => ({
        widthVw:
          typeof input?.widthVw === "number" ? input.widthVw : defaults.widthVw,
        startVw:
          typeof input?.startVw === "number" ? input.startVw : defaults.startVw,
        endVw: typeof input?.endVw === "number" ? input.endVw : defaults.endVw,
        objectPosX:
          typeof input?.objectPosX === "number"
            ? input.objectPosX
            : defaults.objectPosX,
        objectPosY:
          typeof input?.objectPosY === "number"
            ? input.objectPosY
            : defaults.objectPosY,
        snapToEndWithinPx:
          typeof input?.snapToEndWithinPx === "number"
            ? input.snapToEndWithinPx
            : defaults.snapToEndWithinPx,
        pulseScale:
          typeof input?.pulseScale === "number"
            ? input.pulseScale
            : defaults.pulseScale,
      });
      const mobileSource =
        parsed.mobile && typeof parsed.mobile === "object"
          ? parsed.mobile
          : parsed;
      const desktopSource =
        parsed.desktop && typeof parsed.desktop === "object"
          ? parsed.desktop
          : undefined;
      setTuneProfiles({
        mobile: parseTune(mobileSource, DEFAULT_MOBILE_TUNE),
        desktop: parseTune(desktopSource, DEFAULT_DESKTOP_TUNE),
      });
    } catch {
      /* ignore malformed local tune payload */
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !tuneMode || typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(ARP_TUNE_STORAGE_KEY, JSON.stringify(tuneProfiles));
  }, [hydrated, tuneMode, tuneProfiles]);

  useEffect(() => {
    setSelectedProfile(narrowViewport ? "mobile" : "desktop");
  }, [narrowViewport]);

  const activeTune =
    selectedProfile === "mobile" ? tuneProfiles.mobile : tuneProfiles.desktop;
  const mobileWidthVw =
    tuneMode && selectedProfile === "mobile"
      ? activeTune.widthVw
      : BG_PANORAMA_MIN_WIDTH_VW_MOBILE;
  const desktopWidthVw =
    tuneMode && selectedProfile === "desktop"
      ? activeTune.widthVw
      : BG_PANORAMA_MIN_WIDTH_VW;
  const mobileStartVw =
    tuneMode && selectedProfile === "mobile"
      ? activeTune.startVw
      : MOBILE_ARP_SHIFT_START_VW;
  const mobileEndVw =
    tuneMode && selectedProfile === "mobile"
      ? activeTune.endVw
      : MOBILE_ARP_SHIFT_END_VW;
  const mobileSnapPx =
    tuneMode && selectedProfile === "mobile" ? activeTune.snapToEndWithinPx : 220;
  const desktopStartVw =
    tuneMode && selectedProfile === "desktop" ? activeTune.startVw : 0;
  const desktopEndVw =
    tuneMode && selectedProfile === "desktop"
      ? activeTune.endVw
      : -panoramaScrollRangeVw(BG_PANORAMA_MIN_WIDTH_VW);
  const desktopSnapPx =
    tuneMode && selectedProfile === "desktop" ? activeTune.snapToEndWithinPx : 0;
  const mobileObjectPosX =
    tuneMode && selectedProfile === "mobile" ? activeTune.objectPosX : 2;
  const mobileObjectPosY =
    tuneMode && selectedProfile === "mobile" ? activeTune.objectPosY : 0;
  const desktopObjectPosX =
    tuneMode && selectedProfile === "desktop" ? activeTune.objectPosX : 0;
  const desktopObjectPosY =
    tuneMode && selectedProfile === "desktop" ? activeTune.objectPosY : 0;
  const mobileTunePulseScale =
    tuneMode && selectedProfile === "mobile" ? activeTune.pulseScale : 0;
  const desktopTunePulseScale =
    tuneMode && selectedProfile === "desktop" ? activeTune.pulseScale : 0.1;
  const forcedScrollX =
    tuneMode && previewMode !== "scroll"
      ? previewMode === "start"
        ? `${activeTune.startVw}vw`
        : `${activeTune.endVw}vw`
      : undefined;

  const onDragPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!tuneMode || dragMode === "off") {
      return;
    }
    pointerCacheRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointerCacheRef.current.size === 2) {
      const [a, b] = Array.from(pointerCacheRef.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      pinchStateRef.current = {
        startDistance: dist,
        baseWidthVw: activeTune.widthVw,
      };
    }
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      mode: dragMode,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onDragPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointerCacheRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchStateRef.current && pointerCacheRef.current.size >= 2) {
      const [a, b] = Array.from(pointerCacheRef.current.values());
      const currentDistance = Math.hypot(a.x - b.x, a.y - b.y);
      const deltaDistance = currentDistance - pinchStateRef.current.startDistance;
      const widthDeltaVw = (deltaDistance / Math.max(1, window.innerWidth)) * 120;
      setTuneField(
        "widthVw",
        clamp(
          pinchStateRef.current.baseWidthVw - widthDeltaVw,
          WIDTH_VW_MIN,
          WIDTH_VW_MAX,
        ),
      );
      e.preventDefault();
      return;
    }
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== e.pointerId) {
      return;
    }
    const xRatio = clamp(e.clientX / Math.max(1, window.innerWidth), 0, 1);
    const yRatio = clamp(e.clientY / Math.max(1, window.innerHeight), 0, 1);
    if (dragState.mode === "start") {
      const mappedStart = START_VW_MIN + xRatio * (START_VW_MAX - START_VW_MIN);
      setTuneField("startVw", mappedStart);
    } else if (dragState.mode === "end") {
      const mappedEnd = END_VW_MIN + xRatio * (END_VW_MAX - END_VW_MIN);
      setTuneField("endVw", mappedEnd);
    } else if (dragState.mode === "frameY") {
      const mappedY = -30 + yRatio * 70;
      setTuneField("objectPosY", mappedY);
    }
    setMarker({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const onDragPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointerCacheRef.current.delete(e.pointerId);
    if (pointerCacheRef.current.size < 2) {
      pinchStateRef.current = null;
    }
    if (dragStateRef.current?.pointerId === e.pointerId) {
      dragStateRef.current = null;
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setMarker(null);
  };

  const scrollParallaxEnabled =
    hydrated && (!tuneMode || previewMode === "scroll");
  const panoramaMinWidthVw = narrowViewport
    ? mobileWidthVw
    : desktopWidthVw;
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
          shiftStartVw: desktopStartVw,
          shiftEndVw: desktopEndVw,
          shiftStartVh: 0,
          shiftEndVh: -scrollRangeVh,
          snapToEndWithinPx: desktopSnapPx,
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
  const objectPosition = narrowViewport
    ? `${mobileObjectPosX}% ${mobileObjectPosY}%`
    : `${desktopObjectPosX}% ${desktopObjectPosY}%`;
  const mobileObjectFit = "cover";
  const mobilePulseScale = narrowViewport
    ? mobileTunePulseScale
    : desktopTunePulseScale;
  const flashGain =
    typeof beatFlashOpacityGain === "number" && Number.isFinite(beatFlashOpacityGain)
      ? Math.min(2, Math.max(0, beatFlashOpacityGain))
      : 1;
  const setTuneField = <K extends keyof MobileArpTune>(
    key: K,
    value: MobileArpTune[K],
  ) => {
    setTuneProfiles((s) => ({
      ...s,
      [selectedProfile]: {
        ...s[selectedProfile],
        [key]: value,
      },
    }));
  };

  const guidedSteps: Array<{
    label: string;
    drag: DragMode;
    preview: PreviewMode;
  }> = [
    { label: "Place TOP anchor (Mad Hatter)", drag: "start", preview: "start" },
    { label: "Place BOTTOM anchor (White Rabbit)", drag: "end", preview: "end" },
    { label: "Adjust vertical framing (head/tail)", drag: "frameY", preview: "start" },
  ];

  const beginGuided = () => {
    setGuidedMode(true);
    setGuidedStep(0);
    setPreviewMode(guidedSteps[0].preview);
    setDragMode(guidedSteps[0].drag);
  };

  const advanceGuided = () => {
    const next = guidedStep + 1;
    if (next >= guidedSteps.length) {
      setGuidedMode(false);
      setDragMode("off");
      setPreviewMode("scroll");
      setMarker(null);
      return;
    }
    setGuidedStep(next);
    setPreviewMode(guidedSteps[next].preview);
    setDragMode(guidedSteps[next].drag);
  };

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
          objectPosition,
          mobileObjectFit,
          mobilePulseScale,
          selectedProfile,
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
    objectPosition,
    mobileObjectFit,
    mobilePulseScale,
    selectedProfile,
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
        style={
          forcedScrollX
            ? ({
                "--arp-scroll-x": forcedScrollX,
              } as CSSProperties)
            : undefined
        }
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
                  objectPosition,
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
                    objectPosition,
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
          className="fixed inset-0 z-[998] cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
          aria-hidden
        />
      ) : null}

      {tuneMode && marker ? (
        <div
          className="fixed z-[999] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300 bg-cyan-400/30"
          style={{ left: marker.x, top: marker.y }}
          aria-hidden
        />
      ) : null}

      {tuneMode && guidedMode ? (
        <div className="fixed left-2 right-2 top-2 z-[1000] rounded-lg border border-white/20 bg-black/75 p-3 text-xs text-white shadow-2xl backdrop-blur">
          <p className="font-semibold">
            Step {guidedStep + 1}/{guidedSteps.length}: {guidedSteps[guidedStep]?.label}
          </p>
          <p className="mt-1 text-[11px] text-white/70">
            Drag on the image to place this target, then confirm.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded bg-cyan-500/60 px-2 py-1"
              onClick={advanceGuided}
            >
              Confirm & Next
            </button>
            <button
              type="button"
              className="rounded bg-white/20 px-2 py-1"
              onClick={() => {
                setGuidedMode(false);
                setDragMode("off");
                setPreviewMode("scroll");
                setMarker(null);
              }}
            >
              Cancel Guided
            </button>
          </div>
        </div>
      ) : null}

      {tuneMode && !guidedMode ? (
        <div className="fixed bottom-3 right-3 z-[999] w-[min(22rem,92vw)] rounded-xl border border-white/20 bg-black/80 p-3 text-xs text-white shadow-2xl backdrop-blur">
          <p className="mb-2 font-semibold">Mobile Parallax Tuner</p>
          <p className="mb-2 text-[11px] text-white/70">
            Active only with <code>?arpTune=1</code>. Values persist locally.
          </p>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded px-2 py-1 ${selectedProfile === "mobile" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => setSelectedProfile("mobile")}
            >
              Editing: Mobile
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${selectedProfile === "desktop" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => setSelectedProfile("desktop")}
            >
              Editing: Desktop
            </button>
          </div>
          <div className="mb-2">
            <button
              type="button"
              className="w-full rounded bg-cyan-500/60 px-2 py-1 font-semibold"
              onClick={beginGuided}
            >
              Start Guided Setup
            </button>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded px-2 py-1 ${dragMode === "start" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => {
                setPreviewMode("start");
                setDragMode("start");
              }}
            >
              Drag Top Anchor
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${dragMode === "end" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => {
                setPreviewMode("end");
                setDragMode("end");
              }}
            >
              Drag Bottom Anchor
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${dragMode === "frameY" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => {
                setPreviewMode("start");
                setDragMode("frameY");
              }}
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
              className={`rounded px-2 py-1 ${previewMode === "scroll" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => setPreviewMode("scroll")}
            >
              Use Scroll
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${previewMode === "start" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => setPreviewMode("start")}
            >
              Preview Start
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${previewMode === "end" ? "bg-cyan-500/60" : "bg-white/20"}`}
              onClick={() => setPreviewMode("end")}
            >
              Preview End
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
            widthVw: {activeTune.widthVw}
            <input
              type="range"
              min={WIDTH_VW_MIN}
              max={WIDTH_VW_MAX}
              step={1}
              value={activeTune.widthVw}
              onChange={(e) => setTuneField("widthVw", Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="mb-1 block">
            startVw: {activeTune.startVw}
            <input
              type="range"
              min={START_VW_MIN}
              max={START_VW_MAX}
              step={1}
              value={activeTune.startVw}
              onChange={(e) => setTuneField("startVw", Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="mb-1 block">
            endVw: {activeTune.endVw}
            <input
              type="range"
              min={END_VW_MIN}
              max={END_VW_MAX}
              step={1}
              value={activeTune.endVw}
              onChange={(e) => setTuneField("endVw", Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="mb-1 block">
            objectPosX: {activeTune.objectPosX}%
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={activeTune.objectPosX}
              onChange={(e) => setTuneField("objectPosX", Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="mb-1 block">
            objectPosY: {activeTune.objectPosY}%
            <input
              type="range"
              min={-30}
              max={40}
              step={1}
              value={activeTune.objectPosY}
              onChange={(e) => setTuneField("objectPosY", Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="mb-1 block">
            snapToEndWithinPx: {activeTune.snapToEndWithinPx}
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={activeTune.snapToEndWithinPx}
              onChange={(e) =>
                setTuneField("snapToEndWithinPx", Number(e.target.value))
              }
              className="w-full"
            />
          </label>
          <label className="mb-2 block">
            pulseScale: {activeTune.pulseScale.toFixed(3)}
            <input
              type="range"
              min={0}
              max={0.12}
              step={0.005}
              value={activeTune.pulseScale}
              onChange={(e) => setTuneField("pulseScale", Number(e.target.value))}
              className="w-full"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-white/20 px-2 py-1"
              onClick={() =>
                setTuneProfiles((s) => ({
                  ...s,
                  [selectedProfile]:
                    selectedProfile === "mobile"
                      ? DEFAULT_MOBILE_TUNE
                      : DEFAULT_DESKTOP_TUNE,
                }))
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
                    JSON.stringify(
                      {
                        profile: selectedProfile,
                        values: tuneProfiles[selectedProfile],
                      },
                      null,
                      2,
                    ),
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
