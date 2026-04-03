import {
  BG_PANORAMA_MIN_WIDTH_VW,
  BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
  MOBILE_ARP_SHIFT_END_VW,
  MOBILE_ARP_SHIFT_START_VW,
  panoramaScrollRangeVw,
} from "@/lib/background-parallax";
import type { EditorArpTune, EditorDraft } from "@/lib/parallax-editor";

export type EditorSeed = {
  imageSrc: string;
  beatFlashImageSrc: string;
  beatFlashOpacityGain: number;
  mushroomImageSrc: string;
  rainVideoSrc: string;
  rainVideoBlend: "normal" | "screen" | "plus-lighter";
  rainVideoKey: "none" | "luma";
  rainVideoLumaThreshold: number;
  rainVideoLumaSoften: number;
  rainVideoLumaCeiling: number;
  rainVideoLumaCeilingSoften: number;
  foregroundSmokeEnabled: boolean;
  foregroundSmokeIntensity: "low" | "default" | "high";
};

export const DEFAULT_MOBILE_EDITOR_TUNE: EditorArpTune = {
  widthVw: BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
  startVw: MOBILE_ARP_SHIFT_START_VW,
  endVw: MOBILE_ARP_SHIFT_END_VW,
  objectPosX: 2,
  objectPosY: 0,
  snapToEndWithinPx: 220,
  pulseScale: 0,
};

export const DEFAULT_DESKTOP_EDITOR_TUNE: EditorArpTune = {
  widthVw: BG_PANORAMA_MIN_WIDTH_VW,
  startVw: 0,
  endVw: -panoramaScrollRangeVw(BG_PANORAMA_MIN_WIDTH_VW),
  objectPosX: 0,
  objectPosY: 0,
  snapToEndWithinPx: 0,
  pulseScale: 0.1,
};

export function createEditorDraft(seed: EditorSeed): EditorDraft {
  return {
    profile: "mobile",
    arp: {
      mobile: DEFAULT_MOBILE_EDITOR_TUNE,
      desktop: DEFAULT_DESKTOP_EDITOR_TUNE,
    },
    layers: {
      baseImageSrc: seed.imageSrc,
      beatFlashImageSrc: seed.beatFlashImageSrc,
      beatFlashOpacityGain: seed.beatFlashOpacityGain,
      smokeImageSrc: seed.mushroomImageSrc,
      rainVideoSrc: seed.rainVideoSrc,
      rainVideoBlend: seed.rainVideoBlend,
      rainVideoKey: seed.rainVideoKey,
      rainVideoLumaThreshold: seed.rainVideoLumaThreshold,
      rainVideoLumaSoften: seed.rainVideoLumaSoften,
      rainVideoLumaCeiling: seed.rainVideoLumaCeiling,
      rainVideoLumaCeilingSoften: seed.rainVideoLumaCeilingSoften,
      atmosphereMistLayers: true,
      foregroundSmokeEnabled: seed.foregroundSmokeEnabled,
      foregroundSmokeIntensity: seed.foregroundSmokeIntensity,
    },
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function sanitizeEditorTune(input: EditorDraft["arp"]["mobile"]): EditorArpTune {
  return {
    widthVw: clamp(input.widthVw, 120, 360),
    startVw: clamp(input.startVw, -220, 160),
    endVw: clamp(input.endVw, -220, 160),
    objectPosX: clamp(input.objectPosX, 0, 100),
    objectPosY: clamp(input.objectPosY, -40, 45),
    snapToEndWithinPx: clamp(input.snapToEndWithinPx, 0, 600),
    pulseScale: clamp(input.pulseScale, 0, 0.2),
  };
}

export function getEditorWarnings(draft: EditorDraft): string[] {
  const list: string[] = [];
  const mobile = draft.arp.mobile;
  const desktop = draft.arp.desktop;

  if (!draft.layers.baseImageSrc?.trim()) {
    list.push("Base image path is empty.");
  }
  if (
    draft.layers.baseImageSrc &&
    !draft.layers.baseImageSrc.startsWith("/") &&
    !draft.layers.baseImageSrc.startsWith("http")
  ) {
    list.push("Base image should start with '/' or 'http'.");
  }
  if (
    draft.layers.rainVideoSrc &&
    !draft.layers.rainVideoSrc.startsWith("/") &&
    !draft.layers.rainVideoSrc.startsWith("http")
  ) {
    list.push("Rain video should start with '/' or 'http'.");
  }
  if (Math.abs(mobile.startVw - mobile.endVw) < 2) {
    list.push("Mobile start/end anchors are almost identical.");
  }
  if (Math.abs(desktop.startVw - desktop.endVw) < 2) {
    list.push("Desktop start/end anchors are almost identical.");
  }
  if (mobile.widthVw < 125) {
    list.push("Mobile widthVw is very zoomed in and may crop head/tail.");
  }
  if (mobile.objectPosY < -20 || mobile.objectPosY > 30) {
    list.push("Mobile objectPosY is extreme and may create black bands.");
  }

  return list;
}

