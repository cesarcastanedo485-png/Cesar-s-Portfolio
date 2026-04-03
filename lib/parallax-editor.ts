export const PARALLAX_EDITOR_DRAFT_KEY = "parallax-editor-draft-v1";

export type EditorProfile = "mobile" | "desktop";

export type EditorArpTune = {
  widthVw: number;
  startVw: number;
  endVw: number;
  objectPosX: number;
  objectPosY: number;
  snapToEndWithinPx: number;
  pulseScale: number;
};

export type EditorDraft = {
  profile: EditorProfile;
  arp: {
    mobile: EditorArpTune;
    desktop: EditorArpTune;
  };
  layers: {
    baseImageSrc?: string;
    beatFlashImageSrc?: string;
    beatFlashOpacityGain?: number;
    smokeImageSrc?: string;
    rainVideoSrc?: string;
    rainVideoBlend?: "normal" | "screen" | "plus-lighter";
    rainVideoKey?: "none" | "luma";
    rainVideoLumaThreshold?: number;
    rainVideoLumaSoften?: number;
    rainVideoLumaCeiling?: number;
    rainVideoLumaCeilingSoften?: number;
    atmosphereMistLayers?: boolean;
    foregroundSmokeEnabled?: boolean;
    foregroundSmokeIntensity?: "low" | "default" | "high";
  };
};

export function isEditorPreviewEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("arpPreview") === "1";
}

