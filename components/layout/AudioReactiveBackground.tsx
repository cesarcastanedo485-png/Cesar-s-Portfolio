"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { isEditorPreviewEnabled } from "@/lib/parallax-editor";

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
  mobileTune?: Partial<MobileArpTune>;
  desktopTune?: Partial<MobileArpTune>;
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

type DragMode =
  | "off"
  | "start"
  | "end"
  | "frameY"
  | "freeFrame"
  | "horizontalFrame"
  | "verticalFrame";
type PreviewMode = "scroll" | "start" | "end";
type TuneProfileName = "mobile" | "desktop";
type ParallaxLayerName = "all" | "base" | "beatFlash" | "smoke" | "rain";

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
const START_VW_MAX = 220;
const END_VW_MIN = -220;
const END_VW_MAX = 220;
const WIDTH_VW_MIN = 120;
const WIDTH_VW_MAX = 360;
const GUIDED_MOBILE_MIN_WIDTH_VW = WIDTH_VW_MAX;

function getSafeTuneValues(
  tune: MobileArpTune,
  profile: TuneProfileName = "mobile",
): MobileArpTune {
  const safeWidthVw = clamp(tune.widthVw, 132, WIDTH_VW_MAX);
  const maxTravel = Math.max(0, safeWidthVw - 100);
  const startMin = -maxTravel;
  const startMax = maxTravel;
  const endMin = -maxTravel;
  const endMax = maxTravel;
  return {
    ...tune,
    widthVw: safeWidthVw,
    startVw: clamp(tune.startVw, startMin, startMax),
    endVw: clamp(tune.endVw, endMin, endMax),
    objectPosY: clamp(tune.objectPosY, -12, 24),
  };
}

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
  mobileTune,
  desktopTune,
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
  const seededMobileTune = useMemo<MobileArpTune>(
    () => ({
      ...DEFAULT_MOBILE_TUNE,
      ...mobileTune,
    }),
    [mobileTune],
  );
  const seededDesktopTune = useMemo<MobileArpTune>(
    () => ({
      ...DEFAULT_DESKTOP_TUNE,
      ...desktopTune,
    }),
    [desktopTune],
  );
  const [tuneMode, setTuneMode] = useState(false);
  const [previewTuneMode, setPreviewTuneMode] = useState(false);
  const [tunerMinimized, setTunerMinimized] = useState(false);
  const [autoPreviewRunning, setAutoPreviewRunning] = useState(false);
  const [tunerNotice, setTunerNotice] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [mobileDebugTrace, setMobileDebugTrace] = useState<string[]>([]);
  const [sendingTrace, setSendingTrace] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>("off");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("scroll");
  const [selectedProfile, setSelectedProfile] = useState<TuneProfileName>("mobile");
  const [selectedParallaxLayer, setSelectedParallaxLayer] =
    useState<ParallaxLayerName>("base");
  const [guidedLayerPickerOpen, setGuidedLayerPickerOpen] = useState(false);
  const [pendingGuidedFinalize, setPendingGuidedFinalize] = useState(false);
  const [guidedReviewMode, setGuidedReviewMode] = useState(false);
  const [tuneProfiles, setTuneProfiles] = useState<TuneProfiles>({
    mobile: seededMobileTune,
    desktop: seededDesktopTune,
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
    baseStartVw: number;
    baseEndVw: number;
    baseObjectPosY: number;
  } | null>(null);
  const pointerCacheRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<{
    startDistance: number;
    baseWidthVw: number;
  } | null>(null);
  const dragDebugRef = useRef<{ hasLoggedMove: boolean }>({ hasLoggedMove: false });
  const guidedMoveDebugRef = useRef<{ moveCount: number }>({ moveCount: 0 });
  const dragSweepDebugRef = useRef<{
    pointerId: number | null;
    minX: number;
    maxX: number;
    startX: number;
    lastX: number;
  }>({
    pointerId: null,
    minX: 0,
    maxX: 0,
    startX: 0,
    lastX: 0,
  });
  const guidedRangeDebugRef = useRef<{
    pointerId: number | null;
    minStartVw: number;
    maxStartVw: number;
  }>({
    pointerId: null,
    minStartVw: 0,
    maxStartVw: 0,
  });
  const appendMobileTrace = (entry: string) => {
    setMobileDebugTrace((prev) => {
      const next = [...prev, `${new Date().toLocaleTimeString()} ${entry}`];
      return next.length > 120 ? next.slice(next.length - 120) : next;
    });
  };
  const sendTraceToServer = async () => {
    if (!mobileDebugTrace.length || sendingTrace) {
      return;
    }
    setSendingTrace(true);
    try {
      const res = await fetch("/api/mobile-trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trace: mobileDebugTrace,
          context: {
            route: typeof window !== "undefined" ? window.location.href : "",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
            timestamp: Date.now(),
          },
        }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: string };
      if (res.ok && data.ok) {
        setTunerNotice(`Trace sent. Share ID: ${data.id ?? "unknown"}`);
      } else {
        setTunerNotice("Trace send failed.");
      }
    } catch {
      setTunerNotice("Trace send failed.");
    } finally {
      setSendingTrace(false);
    }
  };
  const hasBaseImage = Boolean(imageSrc?.trim()) && !baseImageFailed;
  const hasBeatFlashImage =
    Boolean((beatFlashImageSrc || imageSrc)?.trim()) && !beatFlashImageFailed;
  const hasMushroomImage = Boolean(mushroomImageSrc?.trim()) && !mushroomImageFailed;
  const hasRainVideo = Boolean(rainVideoSrc?.trim()) && !rainVideoFailed;
  const isLayerSelected = (layer: Exclude<ParallaxLayerName, "all">) =>
    selectedParallaxLayer === "all" || selectedParallaxLayer === layer;

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
    const tuneEnabled = new URLSearchParams(window.location.search).get("arpTune") === "1";
    const previewEnabled = isEditorPreviewEnabled();
    setTuneMode(tuneEnabled);
    setPreviewTuneMode(previewEnabled);
    if (!tuneEnabled && !previewEnabled) {
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
        mobile: parseTune(mobileSource, seededMobileTune),
        desktop: parseTune(desktopSource, seededDesktopTune),
      });
    } catch {
      /* ignore malformed local tune payload */
    }
  }, [hydrated, seededDesktopTune, seededMobileTune]);

  useEffect(() => {
    if (!hydrated || !tuneMode || typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(ARP_TUNE_STORAGE_KEY, JSON.stringify(tuneProfiles));
    setLastSavedAt(Date.now());
    if (!tunerNotice || tunerNotice.startsWith("Saved locally")) {
      setTunerNotice("Saved locally.");
    }
  }, [hydrated, tuneMode, tuneProfiles, tunerNotice]);

  useEffect(() => {
    setSelectedProfile(narrowViewport ? "mobile" : "desktop");
  }, [narrowViewport]);

  useEffect(() => {
    if (!tuneMode) {
      return;
    }
    appendMobileTrace(`layer-select layer=${selectedParallaxLayer}`);
  }, [guidedMode, selectedParallaxLayer, selectedProfile, tuneMode]);

  const localTuneActive = tuneMode || previewTuneMode;
  const activeTune =
    selectedProfile === "mobile" ? tuneProfiles.mobile : tuneProfiles.desktop;
  const safeActiveTune = getSafeTuneValues(activeTune, selectedProfile);
  const mobileWidthVw =
    localTuneActive && selectedProfile === "mobile"
      ? activeTune.widthVw
      : seededMobileTune.widthVw;
  const desktopWidthVw =
    localTuneActive && selectedProfile === "desktop"
      ? activeTune.widthVw
      : seededDesktopTune.widthVw;
  const mobileStartVw =
    localTuneActive && selectedProfile === "mobile"
      ? safeActiveTune.startVw
      : seededMobileTune.startVw;
  const mobileEndVw =
    localTuneActive && selectedProfile === "mobile"
      ? safeActiveTune.endVw
      : seededMobileTune.endVw;
  const mobileSnapPx =
    localTuneActive && selectedProfile === "mobile"
      ? activeTune.snapToEndWithinPx
      : seededMobileTune.snapToEndWithinPx;
  const desktopStartVw =
    localTuneActive && selectedProfile === "desktop"
      ? safeActiveTune.startVw
      : seededDesktopTune.startVw;
  const desktopEndVw =
    localTuneActive && selectedProfile === "desktop"
      ? safeActiveTune.endVw
      : seededDesktopTune.endVw;
  const desktopSnapPx =
    localTuneActive && selectedProfile === "desktop"
      ? activeTune.snapToEndWithinPx
      : seededDesktopTune.snapToEndWithinPx;
  const mobileObjectPosX =
    localTuneActive && selectedProfile === "mobile"
      ? activeTune.objectPosX
      : seededMobileTune.objectPosX;
  const mobileObjectPosY =
    localTuneActive && selectedProfile === "mobile"
      ? activeTune.objectPosY
      : seededMobileTune.objectPosY;
  const desktopObjectPosX =
    localTuneActive && selectedProfile === "desktop"
      ? activeTune.objectPosX
      : seededDesktopTune.objectPosX;
  const desktopObjectPosY =
    localTuneActive && selectedProfile === "desktop"
      ? activeTune.objectPosY
      : seededDesktopTune.objectPosY;
  const mobileTunePulseScale =
    localTuneActive && selectedProfile === "mobile"
      ? activeTune.pulseScale
      : seededMobileTune.pulseScale;
  const desktopTunePulseScale =
    localTuneActive && selectedProfile === "desktop"
      ? activeTune.pulseScale
      : seededDesktopTune.pulseScale;
  const forcedScrollX =
    tuneMode && previewMode !== "scroll"
      ? previewMode === "start"
        ? `${safeActiveTune.startVw.toFixed(4)}vw`
        : `${safeActiveTune.endVw.toFixed(4)}vw`
      : undefined;


  const onDragPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!tuneMode || tunerMinimized || dragMode === "off") {
      return;
    }
    if (
      guidedMode &&
      (dragMode === "freeFrame" ||
        dragMode === "horizontalFrame" ||
        dragMode === "verticalFrame") &&
      !e.isPrimary
    ) {
      appendMobileTrace(
        `ignore-non-primary-down step=${guidedStep} mode=${dragMode} pid=${e.pointerId} type=${e.pointerType}`,
      );
      return;
    }
    pointerCacheRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!guidedMode && dragMode !== "frameY" && pointerCacheRef.current.size === 2) {
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
      baseStartVw: guidedMode ? safeActiveTune.startVw : activeTune.startVw,
      baseEndVw: guidedMode ? safeActiveTune.endVw : activeTune.endVw,
      baseObjectPosY: guidedMode ? safeActiveTune.objectPosY : activeTune.objectPosY,
    };
    dragDebugRef.current.hasLoggedMove = false;
    guidedMoveDebugRef.current.moveCount = 0;
    dragSweepDebugRef.current = {
      pointerId: e.pointerId,
      minX: e.clientX,
      maxX: e.clientX,
      startX: e.clientX,
      lastX: e.clientX,
    };
    guidedRangeDebugRef.current = {
      pointerId: e.pointerId,
      minStartVw: activeTune.startVw,
      maxStartVw: activeTune.startVw,
    };
    appendMobileTrace(
      `down step=${guidedStep} mode=${dragMode} pid=${e.pointerId} primary=${e.isPrimary} type=${e.pointerType} x=${Math.round(e.clientX)} y=${Math.round(e.clientY)}`,
    );
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onDragPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointerCacheRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    let dragState = dragStateRef.current;
    if (
      guidedMode &&
      (dragMode === "freeFrame" ||
        dragMode === "horizontalFrame" ||
        dragMode === "verticalFrame")
    ) {
      if (!e.isPrimary) {
        appendMobileTrace(
          `ignore-non-primary-move step=${guidedStep} mode=${dragMode} pid=${e.pointerId} type=${e.pointerType}`,
        );
        return;
      }
      if (!dragState) {
        dragState = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          mode: dragMode,
          baseStartVw: activeTune.startVw,
          baseEndVw: activeTune.endVw,
          baseObjectPosY: activeTune.objectPosY,
        };
        dragStateRef.current = dragState;
        appendMobileTrace(
          `init-guided-pointer step=${guidedStep} mode=${dragState.mode} pid=${e.pointerId} primary=${e.isPrimary} type=${e.pointerType}`,
        );
      } else if (dragState.pointerId !== e.pointerId) {
        appendMobileTrace(
          `ignore-secondary-pointer step=${guidedStep} mode=${dragState.mode} pid=${e.pointerId} active=${dragState.pointerId}`,
        );
        return;
      }
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      if (dragSweepDebugRef.current.pointerId === e.pointerId) {
        dragSweepDebugRef.current.minX = Math.min(dragSweepDebugRef.current.minX, e.clientX);
        dragSweepDebugRef.current.maxX = Math.max(dragSweepDebugRef.current.maxX, e.clientX);
        dragSweepDebugRef.current.lastX = e.clientX;
      }
      const safeWidthVw = clamp(activeTune.widthVw, 132, WIDTH_VW_MAX);
      const maxTravel = Math.max(0, safeWidthVw - 100);
      const xRatio = clamp(e.clientX / Math.max(1, window.innerWidth), 0, 1);
      const yRatio = clamp(e.clientY / Math.max(1, window.innerHeight), 0, 1);
      const absoluteVw = -maxTravel + xRatio * (maxTravel * 2);
      const deltaYPercent = (deltaY / Math.max(1, window.innerHeight)) * 70;
      guidedMoveDebugRef.current.moveCount += 1;
      if (dragState.mode === "freeFrame" || dragState.mode === "horizontalFrame") {
        if (dragState.mode === "freeFrame") {
          const baseSpan = dragState.baseEndVw - dragState.baseStartVw;
          const nextStartAbs = clamp(absoluteVw, -maxTravel, maxTravel);
          const nextEndAbs = clamp(nextStartAbs + baseSpan, -maxTravel, maxTravel);
          setTuneField(
            "startVw",
            nextStartAbs,
          );
          setTuneField(
            "endVw",
            nextEndAbs,
          );
        } else {
          // In rabbit-framing phase we drive only end anchor for visible horizontal pan.
          setTuneField(
            "endVw",
            clamp(absoluteVw, -maxTravel, maxTravel),
          );
        }
      }
      if (dragState.mode === "freeFrame") {
        setTuneField(
          "objectPosY",
          clamp(-30 + yRatio * 70, -30, 40),
        );
      } else if (dragState.mode === "verticalFrame") {
        setTuneField(
          "objectPosY",
          clamp(dragState.baseObjectPosY + deltaYPercent, -30, 40),
        );
      }
      const nextStart =
        dragState.mode === "freeFrame"
          ? clamp(absoluteVw, -maxTravel, maxTravel)
          : dragState.baseStartVw;
      const nextEnd =
        dragState.mode === "freeFrame" || dragState.mode === "horizontalFrame"
          ? clamp(
              dragState.mode === "freeFrame"
                ? clamp(
                    clamp(absoluteVw, -maxTravel, maxTravel) +
                        (dragState.baseEndVw - dragState.baseStartVw),
                    -maxTravel,
                    maxTravel,
                  )
                : absoluteVw,
              -maxTravel,
              maxTravel,
            )
          : dragState.baseEndVw;
      const nextY =
        dragState.mode === "freeFrame"
          ? clamp(-30 + yRatio * 70, -30, 40)
          : dragState.mode === "verticalFrame"
            ? clamp(dragState.baseObjectPosY + deltaYPercent, -30, 40)
            : dragState.baseObjectPosY;
      const maxTravelPreview = maxTravel;
      const safeStartPreview = clamp(nextStart, -maxTravelPreview, maxTravelPreview);
      const safeEndPreview = clamp(nextEnd, -maxTravelPreview, maxTravelPreview);
      if (guidedRangeDebugRef.current.pointerId === e.pointerId) {
        guidedRangeDebugRef.current.minStartVw = Math.min(
          guidedRangeDebugRef.current.minStartVw,
          nextStart,
        );
        guidedRangeDebugRef.current.maxStartVw = Math.max(
          guidedRangeDebugRef.current.maxStartVw,
          nextStart,
        );
      }
      if (!dragDebugRef.current.hasLoggedMove) {
        dragDebugRef.current.hasLoggedMove = true;
        appendMobileTrace(
          `guided-move step=${guidedStep} mode=${dragState.mode} pid=${e.pointerId} dX=${Math.round(deltaX)} dY=${Math.round(deltaY)}`,
        );
      }
      setMarker({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      return;
    }
    if (!guidedMode && dragState?.mode === "frameY" && pointerCacheRef.current.size >= 2) {
      const points = Array.from(pointerCacheRef.current.values());
      const centerY = points.reduce((acc, p) => acc + p.y, 0) / points.length;
      const centerX = points.reduce((acc, p) => acc + p.x, 0) / points.length;
      const yRatio = clamp(centerY / Math.max(1, window.innerHeight), 0, 1);
      const mappedY = -30 + yRatio * 70;
      setTuneField("objectPosY", mappedY);
      setMarker({ x: centerX, y: centerY });
      e.preventDefault();
      return;
    }
    if (!guidedMode && pinchStateRef.current && pointerCacheRef.current.size >= 2) {
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
    if (!dragState || dragState.pointerId !== e.pointerId) {
      appendMobileTrace(
        `guard-return step=${guidedStep} mode=${dragMode} eventPid=${e.pointerId} dragPid=${dragState?.pointerId ?? "none"}`,
      );
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
    if (dragSweepDebugRef.current.pointerId === e.pointerId) {
      const spanPx = dragSweepDebugRef.current.maxX - dragSweepDebugRef.current.minX;
      const netPx = dragSweepDebugRef.current.lastX - dragSweepDebugRef.current.startX;
      const approxSpanVw = (spanPx / Math.max(1, window.innerWidth)) * 220;
      const approxNetVw = (netPx / Math.max(1, window.innerWidth)) * 220;
      const rangeMin =
        guidedRangeDebugRef.current.pointerId === e.pointerId
          ? guidedRangeDebugRef.current.minStartVw
          : activeTune.startVw;
      const rangeMax =
        guidedRangeDebugRef.current.pointerId === e.pointerId
          ? guidedRangeDebugRef.current.maxStartVw
          : activeTune.startVw;
      appendMobileTrace(
        `sweep step=${guidedStep} mode=${dragMode} pid=${e.pointerId} spanPx=${spanPx.toFixed(1)} netPx=${netPx.toFixed(1)} approxSpanVw=${approxSpanVw.toFixed(2)} approxNetVw=${approxNetVw.toFixed(2)} startRange=[${rangeMin.toFixed(2)},${rangeMax.toFixed(2)}] width=${window.innerWidth}`,
      );
    }
    appendMobileTrace(
      `pointer-up step=${guidedStep} mode=${dragMode} pid=${e.pointerId} hasCapture=${e.currentTarget.hasPointerCapture(e.pointerId)}`,
    );
    pointerCacheRef.current.delete(e.pointerId);
    if (pointerCacheRef.current.size < 2) {
      pinchStateRef.current = null;
    }
    if (dragStateRef.current?.pointerId === e.pointerId) {
      dragStateRef.current = null;
    }
    if (dragSweepDebugRef.current.pointerId === e.pointerId) {
      dragSweepDebugRef.current.pointerId = null;
    }
    if (guidedRangeDebugRef.current.pointerId === e.pointerId) {
      guidedRangeDebugRef.current.pointerId = null;
    }
    if (guidedMode) {
      if (dragMode === "freeFrame") {
        setTunerNotice("Top anchor locked from current view. Drag again to update, then confirm.");
      } else if (dragMode === "horizontalFrame") {
        setTunerNotice("Bottom anchor locked from current view. Drag again to update, then confirm.");
      } else if (dragMode === "verticalFrame") {
        setTunerNotice("Vertical framing locked. Drag again to update, then confirm.");
      }
      void sendTraceToServer();
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
    resetOnDisable: !(tuneMode && previewMode !== "scroll"),
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
  const mobileObjectFit = tuneMode ? "contain" : "cover";
  const mobilePulseScale = narrowViewport
    ? mobileTunePulseScale
    : desktopTunePulseScale;
  const flashGain =
    typeof beatFlashOpacityGain === "number" && Number.isFinite(beatFlashOpacityGain)
      ? Math.min(2, Math.max(0, beatFlashOpacityGain))
      : 1;
  const hasUnsafeEdges =
    safeActiveTune.startVw !== activeTune.startVw ||
    safeActiveTune.endVw !== activeTune.endVw;
  const setTuneField = <K extends keyof MobileArpTune>(
    key: K,
    value: MobileArpTune[K],
  ) => {
    setTuneProfiles((s) => ({
      ...s,
      [selectedProfile]: (() => {
        const prev = s[selectedProfile];
        const next = {
          ...prev,
          [key]: value,
        } as MobileArpTune;
        const safeWidthVw = clamp(next.widthVw, 132, WIDTH_VW_MAX);
        const maxTravel = Math.max(0, safeWidthVw - 100);
        return {
          ...next,
          widthVw: safeWidthVw,
          startVw: clamp(next.startVw, -maxTravel, maxTravel),
          endVw: clamp(next.endVw, -maxTravel, maxTravel),
        };
      })(),
    }));
  };

  const guidedSteps: Array<{
    label: string;
    help: string;
    drag: DragMode;
    preview: PreviewMode;
    confirmLabel: string;
  }> = [
    {
      label: "Set TOP anchor view",
      help: "Drag to frame the top view. Release to lock this view as TOP anchor. Drag again to update, then confirm.",
      drag: "freeFrame",
      preview: "start",
      confirmLabel: "Confirm Top View",
    },
    {
      label: "Set BOTTOM anchor view",
      help: "Drag left/right to frame the bottom view. Release to lock this view as BOTTOM anchor. Drag again to update, then confirm.",
      drag: "horizontalFrame",
      preview: "end",
      confirmLabel: "Confirm Bottom View",
    },
    {
      label: "Adjust vertical framing",
      help: "Drag up/down. Release to lock vertical framing. Drag again to update, then confirm.",
      drag: "verticalFrame",
      preview: "start",
      confirmLabel: "Confirm Vertical Framing",
    },
  ];
  const currentGuidedStep = guidedSteps[guidedStep];

  const applyNormalizeSafe = () => {
    setTuneProfiles((s) => ({
      ...s,
      [selectedProfile]: getSafeTuneValues({
        ...(selectedProfile === "mobile" ? s.mobile : s.desktop),
        widthVw: Math.max(
          selectedProfile === "mobile" ? s.mobile.widthVw : s.desktop.widthVw,
          selectedProfile === "mobile" ? 132 : WIDTH_VW_MIN,
        ),
      }, selectedProfile),
    }));
  };

  const beginGuided = (layer: Exclude<ParallaxLayerName, "all">) => {
    setGuidedReviewMode(false);
    setSelectedParallaxLayer(layer);
    setGuidedLayerPickerOpen(false);
    appendMobileTrace(`guided-layer-picked layer=${layer}`);
    if (selectedProfile === "mobile") {
      setTuneProfiles((s) => ({
        ...s,
        mobile: getSafeTuneValues(
          {
            ...s.mobile,
            widthVw: Math.max(s.mobile.widthVw, GUIDED_MOBILE_MIN_WIDTH_VW),
            // Reset guided baseline so each run starts from a predictable center frame.
            startVw: 0,
            endVw: MOBILE_ARP_SHIFT_END_VW,
            objectPosY: 0,
          },
          "mobile",
        ),
      }));
    }
    setTunerMinimized(false);
    setGuidedMode(true);
    setGuidedStep(0);
    setPreviewMode(guidedSteps[0].preview);
    setDragMode(guidedSteps[0].drag);
    setTunerNotice("Guided setup started.");
  };

  const advanceGuided = () => {
    void sendTraceToServer();
    const next = guidedStep + 1;
    appendMobileTrace(
      `advance from=${guidedStep} to=${next >= guidedSteps.length ? "finalize" : next}`,
    );
    if (next >= guidedSteps.length) {
      applyNormalizeSafe();
      setPendingGuidedFinalize(true);
      setTunerNotice("Normalize Safe queued. Auto preview starts after safe values apply.");
      setGuidedMode(false);
      setDragMode("off");
      setPreviewMode("scroll");
      setTunerMinimized(false);
      setMarker(null);
      appendMobileTrace(
        "finalize normalize queued; waiting before autopreview (tuner kept open)",
      );
      return;
    }
    setGuidedStep(next);
    setPreviewMode(guidedSteps[next].preview);
    setDragMode(guidedSteps[next].drag);
  };

  const adjustWidthVw = (delta: number) => {
    setTuneField("widthVw", clamp(activeTune.widthVw + delta, WIDTH_VW_MIN, WIDTH_VW_MAX));
  };

  const baseScrollX = "calc(var(--arp-scroll-x, 0vw) * -1)";
  const runAutoPreview = (options?: { reopenGuidedOnFinish?: boolean }) => {
    if (typeof window === "undefined") {
      return;
    }
    const root = document.scrollingElement ?? document.documentElement;
    const maxTop = Math.max(0, root.scrollHeight - root.clientHeight);
    const container = containerRef.current;
    const cssXBefore = container
      ? getComputedStyle(container).getPropertyValue("--arp-scroll-x").trim()
      : "none";
    const cssYBefore = container
      ? getComputedStyle(container).getPropertyValue("--arp-scroll-y").trim()
      : "none";
    setTunerMinimized(true);
    appendMobileTrace(
      `auto-preview started; maxTop=${maxTop.toFixed(1)} rootH=${root.scrollHeight} clientH=${root.clientHeight} preview=${previewMode} min=1 cssX=${cssXBefore || "none"} cssY=${cssYBefore || "none"} reopenGuided=${options?.reopenGuidedOnFinish ? 1 : 0}`,
    );
    setAutoPreviewRunning(true);
    setPreviewMode("scroll");
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      window.scrollTo({ top: maxTop, behavior: "smooth" });
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.setTimeout(() => {
          setAutoPreviewRunning(false);
          if (options?.reopenGuidedOnFinish) {
            setGuidedReviewMode(true);
            setTunerMinimized(false);
            appendMobileTrace("auto-preview finished; guided review reopened");
            setTunerNotice("Preview finished. Guided setup panel reopened for trace review.");
          }
        }, 1200);
      }, 1400);
    }, 500);
  };

  useEffect(() => {
    if (!pendingGuidedFinalize) {
      return;
    }
    const profileTune =
      selectedProfile === "mobile" ? tuneProfiles.mobile : tuneProfiles.desktop;
    const safeTune = getSafeTuneValues(profileTune, selectedProfile);
    const isNormalized =
      profileTune.widthVw === safeTune.widthVw &&
      profileTune.startVw === safeTune.startVw &&
      profileTune.endVw === safeTune.endVw &&
      profileTune.objectPosY === safeTune.objectPosY;
    if (!isNormalized) {
      appendMobileTrace(
        `finalize-wait profile=${selectedProfile} start=${profileTune.startVw.toFixed(2)} safeStart=${safeTune.startVw.toFixed(2)} end=${profileTune.endVw.toFixed(2)} safeEnd=${safeTune.endVw.toFixed(2)}`,
      );
      return;
    }
    appendMobileTrace(
      `finalize-ready profile=${selectedProfile} start=${profileTune.startVw.toFixed(2)} end=${profileTune.endVw.toFixed(2)}; starting autopreview`,
    );
    setPendingGuidedFinalize(false);
    setTunerNotice("Normalize Safe applied. Auto preview started.");
    runAutoPreview({ reopenGuidedOnFinish: true });
  }, [
    pendingGuidedFinalize,
    previewMode,
    scrollParallaxEnabled,
    selectedProfile,
    tuneProfiles,
    tunerMinimized,
  ]);


  const rainOpacityStyle: CSSProperties = {
    opacity: tuneMode
      ? 1
      : playing
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

  const showCinematicFx = !tuneMode;
  const showBaseLayer = hasBaseImage && (!tuneMode || isLayerSelected("base"));
  const showBeatFlashLayer =
    hasBeatFlashImage &&
    (!tuneMode ? showCinematicFx : isLayerSelected("beatFlash"));
  const showSmokeLayer =
    hasMushroomImage && (!tuneMode ? showCinematicFx : isLayerSelected("smoke"));
  const showRainLayer =
    hasRainVideo && (!tuneMode ? showCinematicFx : isLayerSelected("rain"));
  const layerSelectLocked = guidedMode && guidedStep > 0;


  const rainPortalLayer = showRainLayer ? (
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

  const baseTransform = tuneMode
    ? `translate3d(${baseScrollX}, 0, 0)`
    : `translate3d(${baseScrollX}, 0, 0) scale(calc(1 + var(--arp-pulse, 0) * ${mobilePulseScale} * var(--arp-visual-mul, 1)))`;

  return (
    <>
      {/* Visual layers only: stacking context stays behind page content */}
      <div
        ref={containerRef}
        className={`audio-reactive-bg-root pointer-events-none fixed inset-x-0 top-0 bottom-0 ${tuneMode ? "z-[9000]" : "z-0"} min-h-[100svh] min-h-[100dvh] overflow-hidden [--arp-visual-mul:0.96] md:[--arp-visual-mul:1]`}
        style={
          forcedScrollX
            ? ({
                "--arp-scroll-x": forcedScrollX,
                background: tuneMode ? "#000" : undefined,
              } as CSSProperties)
            : tuneMode
              ? ({ background: "#000" } as CSSProperties)
              : undefined
        }
      >
        <div className="pointer-events-none absolute inset-0 min-h-[100svh] min-h-[100dvh]">
          {hasBaseImage ? (
            <>
              {showBaseLayer ? (
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
                      transform: baseTransform,
                      filter: showCinematicFx
                        ? "brightness(calc(0.9 + var(--arp-pulse, 0) * 0.22 * var(--arp-visual-mul, 1))) contrast(calc(1 + var(--arp-pulse, 0) * 0.09 * var(--arp-visual-mul, 1))) saturate(calc(1 + var(--arp-pulse, 0) * 0.26 * var(--arp-visual-mul, 1))) hue-rotate(calc(var(--arp-pulse-spike, 0) * 9deg))"
                        : "none",
                    }}
                    onError={() => setBaseImageFailed(true)}
                  />
                </>
              ) : null}
              {showBeatFlashLayer ? (
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
                    transform: `translate3d(${baseScrollX}, 0, 0)`,
                    opacity: tuneMode
                      ? "1"
                      : playing
                        ? `calc((0.03 + var(--arp-pulse, 0) * 0.08 + var(--arp-pulse-spike, 0) * 0.22) * ${flashGain})`
                        : "0",
                    filter:
                      "hue-rotate(86deg) saturate(1.5) contrast(1.14) brightness(1.1)",
                  }}
                  onError={() => setBeatFlashImageFailed(true)}
                />
              ) : null}
              {showCinematicFx ? (
                <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(8,11,16,0.2) 0%, rgba(10,14,19,0.26) 52%, rgba(8,11,16,0.22) 100%)",
                }}
                />
              ) : null}
              {showCinematicFx ? (
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
              ) : null}
              {showCinematicFx ? (
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
              ) : null}
              {showSmokeLayer ? (
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
                      opacity: tuneMode
                        ? "1"
                        : playing
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

      {tuneMode ? (
        <button
          type="button"
          className="fixed right-3 top-3 z-[9103] rounded-full border border-cyan-300/40 bg-cyan-600/90 px-4 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur transition hover:bg-cyan-500/90 md:right-[23.5rem]"
          onClick={() => {
            setTunerMinimized((prev) => {
              const next = !prev;
              if (next) {
                setGuidedMode(false);
                setDragMode("off");
                setPreviewMode("scroll");
                setMarker(null);
                setTunerNotice("Tuner minimized. Current values kept.");
              } else {
                setTunerNotice("Tuner reopened. Previous values restored.");
              }
              return next;
            });
          }}
          aria-expanded={!tunerMinimized}
        >
          {tunerMinimized ? "Open Tuner" : "Minimize Tuner"}
        </button>
      ) : null}

      {tuneMode && !tunerMinimized && dragMode !== "off" ? (
        <div
          className="fixed inset-0 z-[9100] cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
          aria-hidden
        />
      ) : null}

      {tuneMode && !tunerMinimized && marker ? (
        <div
          className="fixed z-[9101] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300 bg-cyan-400/30"
          style={{ left: marker.x, top: marker.y }}
          aria-hidden
        />
      ) : null}

      {tuneMode && !tunerMinimized && !guidedMode && guidedLayerPickerOpen ? (
        <div className="fixed inset-0 z-[9104] flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-sm rounded-xl border border-cyan-300/25 bg-black/95 p-4 text-white shadow-2xl">
            <p className="text-sm font-semibold text-cyan-100">Choose Guided Layer</p>
            <p className="mt-1 text-[11px] text-white/70">
              Pick one layer to edit. Other layers will be hidden during guided setup.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <button type="button" className="rounded-md bg-cyan-600 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-cyan-500" onClick={() => beginGuided("base")}>Background Layer</button>
              <button type="button" className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-left text-sm text-white/95 transition hover:bg-white/20" onClick={() => beginGuided("beatFlash")}>Beat Flash Layer</button>
              <button type="button" className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-left text-sm text-white/95 transition hover:bg-white/20" onClick={() => beginGuided("smoke")}>Smoke Layer</button>
              <button type="button" className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-left text-sm text-white/95 transition hover:bg-white/20" onClick={() => beginGuided("rain")}>Rain Layer</button>
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/90 transition hover:bg-white/20"
              onClick={() => {
                setGuidedLayerPickerOpen(false);
                setTunerNotice("Guided setup canceled.");
                appendMobileTrace("guided-layer-picker canceled");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {tuneMode && !tunerMinimized && (guidedMode || guidedReviewMode) ? (
        <div className="fixed left-2 right-2 top-2 z-[9102] rounded-xl border border-cyan-300/20 bg-black/85 p-3 text-xs text-white shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold text-cyan-100">
            {guidedMode
              ? `Step ${guidedStep + 1}/${guidedSteps.length}: ${currentGuidedStep?.label}`
              : "Guided Setup Complete"}
          </p>
          <p className="mt-2 text-[11px] text-cyan-100">
            {guidedMode
              ? "Guided layer is locked for this run."
              : "Preview finished. Review trace below or replay preview."}
          </p>
          <p className="mt-1 text-[10px] text-white/60">
            Editing layer:{" "}
            {selectedParallaxLayer === "base"
              ? "Background"
              : selectedParallaxLayer === "beatFlash"
                ? "Beat Flash"
                : selectedParallaxLayer === "smoke"
                  ? "Smoke"
                  : selectedParallaxLayer === "rain"
                    ? "Rain"
                    : "All Layers"}
          </p>
          {guidedMode ? (
            <p className="mt-1 text-[11px] text-white/70">
              {currentGuidedStep?.help}
            </p>
          ) : null}
          {tunerNotice ? (
            <p className="mt-2 rounded border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-100">
              {tunerNotice}
              {lastSavedAt ? ` Last save: ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            {guidedMode ? (
              <>
                <button
                  type="button"
                  className="rounded-md bg-cyan-600 px-3 py-1.5 font-semibold text-white transition hover:bg-cyan-500"
                  onClick={advanceGuided}
                >
                  {currentGuidedStep?.confirmLabel ?? "Confirm & Next"}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-white/90 transition hover:bg-white/20"
                  onClick={() => {
                    setGuidedMode(false);
                    setGuidedReviewMode(false);
                    setDragMode("off");
                    setPreviewMode("scroll");
                    setMarker(null);
                    setTunerNotice("Guided setup canceled.");
                  }}
                >
                  Cancel Guided
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-md bg-cyan-600 px-3 py-1.5 font-semibold text-white transition hover:bg-cyan-500"
                  onClick={() => runAutoPreview({ reopenGuidedOnFinish: true })}
                  disabled={autoPreviewRunning}
                >
                  {autoPreviewRunning ? "Previewing..." : "Replay Preview"}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-white/90 transition hover:bg-white/20"
                  onClick={() => {
                    setGuidedReviewMode(false);
                    setTunerNotice("Guided review closed.");
                  }}
                >
                  Close Guided Panel
                </button>
              </>
            )}
          </div>
          <div className="mt-3 rounded-lg border border-white/15 bg-black/50 p-2">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-cyan-100">Mobile Runtime Trace</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[10px] transition hover:bg-white/20"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      void navigator.clipboard.writeText(mobileDebugTrace.join("\n"));
                      setTunerNotice("Runtime trace copied.");
                    }
                  }}
                >
                  Copy Trace
                </button>
                <button
                  type="button"
                  className="rounded-md bg-cyan-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-60"
                  onClick={() => void sendTraceToServer()}
                  disabled={sendingTrace || mobileDebugTrace.length === 0}
                >
                  {sendingTrace ? "Sending..." : "Send Trace"}
                </button>
              </div>
            </div>
            <pre className="max-h-28 overflow-auto whitespace-pre-wrap text-[10px] text-cyan-50/90">
              {mobileDebugTrace.length ? mobileDebugTrace.join("\n") : "No runtime entries yet."}
            </pre>
          </div>
        </div>
      ) : null}

      {tuneMode && !tunerMinimized && !guidedMode && !guidedReviewMode ? (
        <div className="fixed bottom-3 right-3 z-[9102] w-[min(23.5rem,94vw)] rounded-xl border border-cyan-300/20 bg-black/85 p-3 text-xs text-white shadow-2xl backdrop-blur">
          <p className="mb-1 text-sm font-semibold text-cyan-100">Mobile Parallax Tuner</p>
          <p className="mb-2 text-[11px] text-white/70">
            Active only with <code>?arpTune=1</code>. Tuner values are local-only and
            do not affect normal live rendering.
          </p>
          {tunerNotice ? (
            <p className="mb-2 rounded border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-100">
              {tunerNotice}
              {lastSavedAt ? ` Last save: ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}
            </p>
          ) : null}
          <label className="mb-2 block text-[11px] font-semibold text-cyan-100">
            Parallax Select
            <select
              className="mt-1 w-full rounded-md border border-white/25 bg-black/60 px-2 py-1.5 text-xs text-white outline-none transition focus:border-cyan-300/60"
              value={selectedParallaxLayer}
              disabled={layerSelectLocked}
              onChange={(e) =>
                setSelectedParallaxLayer(e.target.value as ParallaxLayerName)
              }
            >
              <option value="base">Background Layer</option>
              <option value="beatFlash">Beat Flash Layer</option>
              <option value="smoke">Smoke Layer</option>
              <option value="rain">Rain Layer</option>
              <option value="all">All Layers</option>
            </select>
          </label>
          <p className="mb-2 text-[11px] text-white/65">
            Editing layer:{" "}
            {selectedParallaxLayer === "base"
              ? "Background"
              : selectedParallaxLayer === "beatFlash"
                ? "Beat Flash"
                : selectedParallaxLayer === "smoke"
                  ? "Smoke"
                  : selectedParallaxLayer === "rain"
                    ? "Rain"
                    : "All Layers"}{" "}
            (anchors/zoom are shared across layers).
          </p>
          {layerSelectLocked ? (
            <p className="mb-2 text-[10px] text-amber-200/90">
              Layer selection locked after Step 1.
            </p>
          ) : null}
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-white/95 transition hover:bg-white/20"
              onClick={() => adjustWidthVw(-2)}
            >
              Zoom Out
            </button>
            <button
              type="button"
              className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-white/95 transition hover:bg-white/20"
              onClick={() => adjustWidthVw(2)}
            >
              Zoom In
            </button>
          </div>
          {hasUnsafeEdges ? (
            <p className="mb-2 rounded border border-amber-300/40 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-100">
              Edge warning: current start/end can reveal black space. Use Normalize Safe
              before exporting.
            </p>
          ) : null}
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 transition ${selectedProfile === "mobile" ? "bg-cyan-600 font-semibold text-white" : "border border-white/20 bg-white/10 text-white/90 hover:bg-white/20"}`}
              onClick={() => setSelectedProfile("mobile")}
            >
              Editing: Mobile
            </button>
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 transition ${selectedProfile === "desktop" ? "bg-cyan-600 font-semibold text-white" : "border border-white/20 bg-white/10 text-white/90 hover:bg-white/20"}`}
              onClick={() => setSelectedProfile("desktop")}
            >
              Editing: Desktop
            </button>
          </div>
          <div className="mb-2">
            <button
              type="button"
              className="w-full rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
              onClick={() => {
                setGuidedLayerPickerOpen(true);
                setTunerNotice("Pick a layer to start guided setup.");
                appendMobileTrace("guided-layer-picker opened");
              }}
            >
              Start Guided Setup
            </button>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 transition ${dragMode === "start" ? "bg-cyan-600 font-semibold text-white" : "border border-white/20 bg-white/10 text-white/90 hover:bg-white/20"}`}
              onClick={() => {
                setPreviewMode("start");
                setDragMode("start");
              }}
            >
              Drag Top Anchor
            </button>
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 transition ${dragMode === "end" ? "bg-cyan-600 font-semibold text-white" : "border border-white/20 bg-white/10 text-white/90 hover:bg-white/20"}`}
              onClick={() => {
                setPreviewMode("end");
                setDragMode("end");
              }}
            >
              Drag Bottom Anchor
            </button>
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 transition ${dragMode === "frameY" ? "bg-cyan-600 font-semibold text-white" : "border border-white/20 bg-white/10 text-white/90 hover:bg-white/20"}`}
              onClick={() => {
                setPreviewMode("start");
                setDragMode("frameY");
              }}
            >
              Drag Vertical Frame
            </button>
            <button
              type="button"
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1.5 text-white/90 transition hover:bg-white/20"
              onClick={() => setDragMode("off")}
            >
              Stop Drag
            </button>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 transition ${previewMode === "scroll" ? "bg-cyan-600 font-semibold text-white" : "border border-white/20 bg-white/10 text-white/90 hover:bg-white/20"}`}
              onClick={() => setPreviewMode("scroll")}
            >
              Use Scroll
            </button>
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 transition ${previewMode === "start" ? "bg-cyan-600 font-semibold text-white" : "border border-white/20 bg-white/10 text-white/90 hover:bg-white/20"}`}
              onClick={() => setPreviewMode("start")}
            >
              Preview Start
            </button>
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 transition ${previewMode === "end" ? "bg-cyan-600 font-semibold text-white" : "border border-white/20 bg-white/10 text-white/90 hover:bg-white/20"}`}
              onClick={() => setPreviewMode("end")}
            >
              Preview End
            </button>
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 transition ${autoPreviewRunning ? "bg-cyan-600 font-semibold text-white" : "border border-white/20 bg-white/10 text-white/90 hover:bg-white/20"}`}
              onClick={() => runAutoPreview()}
              disabled={autoPreviewRunning}
            >
              {autoPreviewRunning ? "Previewing..." : "Auto Preview"}
            </button>
          </div>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1.5 text-white/90 transition hover:bg-white/20"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Go Top
            </button>
            <button
              type="button"
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1.5 text-white/90 transition hover:bg-white/20"
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
          <p className="mb-2 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/70">
            1) Tap drag mode 2) go top/bottom 3) drag background until framing looks right.
          </p>
          <label className="mb-1 block text-[11px] text-white/90">
            widthVw ({selectedProfile} zoom level): {activeTune.widthVw}
            <input
              type="range"
              min={WIDTH_VW_MIN}
              max={WIDTH_VW_MAX}
              step={1}
              value={activeTune.widthVw}
              onChange={(e) => setTuneField("widthVw", Number(e.target.value))}
              className="mt-1 w-full accent-cyan-400"
            />
          </label>
          <label className="mb-1 block text-[11px] text-white/90">
            startVw (top scroll anchor X): {activeTune.startVw}
            <input
              type="range"
              min={START_VW_MIN}
              max={START_VW_MAX}
              step={1}
              value={activeTune.startVw}
              onChange={(e) => setTuneField("startVw", Number(e.target.value))}
              className="mt-1 w-full accent-cyan-400"
            />
          </label>
          <label className="mb-1 block text-[11px] text-white/90">
            endVw (bottom scroll anchor X): {activeTune.endVw}
            <input
              type="range"
              min={END_VW_MIN}
              max={END_VW_MAX}
              step={1}
              value={activeTune.endVw}
              onChange={(e) => setTuneField("endVw", Number(e.target.value))}
              className="mt-1 w-full accent-cyan-400"
            />
          </label>
          <label className="mb-1 block text-[11px] text-white/90">
            objectPosX (left-right framing): {activeTune.objectPosX}%
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={activeTune.objectPosX}
              onChange={(e) => setTuneField("objectPosX", Number(e.target.value))}
              className="mt-1 w-full accent-cyan-400"
            />
          </label>
          <label className="mb-1 block text-[11px] text-white/90">
            objectPosY (up-down framing): {activeTune.objectPosY}%
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
            snapToEndWithinPx (force bottom anchor near page end): {activeTune.snapToEndWithinPx}
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={activeTune.snapToEndWithinPx}
              onChange={(e) =>
                setTuneField("snapToEndWithinPx", Number(e.target.value))
              }
              className="mt-1 w-full accent-cyan-400"
            />
          </label>
          <label className="mb-2 block text-[11px] text-white/90">
            pulseScale (music beat zoom intensity): {activeTune.pulseScale.toFixed(3)}
            <input
              type="range"
              min={0}
              max={0.12}
              step={0.005}
              value={activeTune.pulseScale}
              onChange={(e) => setTuneField("pulseScale", Number(e.target.value))}
              className="mt-1 w-full accent-cyan-400"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1.5 text-white/90 transition hover:bg-white/20"
              onClick={() => {
                setTuneProfiles((s) => ({
                  ...s,
                  [selectedProfile]:
                    selectedProfile === "mobile"
                      ? seededMobileTune
                      : seededDesktopTune,
                }));
                setTunerNotice(
                  `Reset ${selectedProfile} profile to defaults.`,
                );
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="rounded-md bg-cyan-600 px-2 py-1.5 font-semibold text-white transition hover:bg-cyan-500"
              onClick={() => {
                setTuneProfiles((s) => ({
                  ...s,
                  [selectedProfile]: getSafeTuneValues({
                    ...safeActiveTune,
                    widthVw: Math.max(
                      safeActiveTune.widthVw,
                      selectedProfile === "mobile" ? 132 : WIDTH_VW_MIN,
                    ),
                  }, selectedProfile),
                }));
                setTunerNotice(
                  `Normalize Safe applied on ${selectedProfile}.`,
                );
              }}
            >
              Normalize Safe
            </button>
            <button
              type="button"
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1.5 text-white/90 transition hover:bg-white/20"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  void navigator.clipboard.writeText(
                    JSON.stringify(
                      {
                        profile: selectedProfile,
                        values: safeActiveTune,
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
