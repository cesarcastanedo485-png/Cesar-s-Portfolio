"use client";

export const EXPERIENCE_CHOICE_CONFIG_KEY = "cesar:experience-choice-config:v3";

type FontToken = "sans" | "serif" | "neon";

export type ChoiceImageSlot = "panelA" | "panelB" | "redCard" | "blueCard";

export type ChoiceImageLayer = {
  src: string;
  alt: string;
  x: number;
  y: number;
  scale: number;
  rotateDeg: number;
  opacity: number;
  flipX: boolean;
};

export type ExperienceChoiceConfig = {
  version: 1;
  copy: {
    eyebrow: string;
    title: string;
    description: string;
    redLabel: string;
    redTitle: string;
    redBody: string;
    blueLabel: string;
    blueTitle: string;
    blueBody: string;
    quickStartLabel: string;
    quickStartBody: string;
  };
  typography: {
    titleFont: FontToken;
    bodyFont: FontToken;
    titleSizePx: number;
    bodySizePx: number;
  };
  colors: {
    title: string;
    body: string;
    modalBgFrom: string;
    modalBgTo: string;
  };
  images: Record<ChoiceImageSlot, ChoiceImageLayer>;
};

function clamp(input: number, min: number, max: number) {
  return Math.min(max, Math.max(min, input));
}

function asText(input: unknown, fallback: string) {
  if (typeof input !== "string") return fallback;
  const trimmed = input.trim();
  return trimmed.length === 0 ? fallback : trimmed;
}

function asColor(input: unknown, fallback: string) {
  if (typeof input !== "string") return fallback;
  const trimmed = input.trim();
  if (trimmed.length === 0) return fallback;
  return trimmed;
}

function asNumber(input: unknown, fallback: number, min: number, max: number) {
  if (typeof input !== "number" || Number.isNaN(input)) return fallback;
  return clamp(input, min, max);
}

function asFont(input: unknown, fallback: FontToken): FontToken {
  if (input === "sans" || input === "serif" || input === "neon") return input;
  return fallback;
}

function sanitizeLayer(input: unknown, fallback: ChoiceImageLayer): ChoiceImageLayer {
  const raw = (input ?? {}) as Partial<ChoiceImageLayer>;
  return {
    src: typeof raw.src === "string" ? raw.src.trim() : fallback.src,
    alt: asText(raw.alt, fallback.alt),
    x: asNumber(raw.x, fallback.x, -240, 240),
    y: asNumber(raw.y, fallback.y, -240, 240),
    scale: asNumber(raw.scale, fallback.scale, 0.3, 2.8),
    rotateDeg: asNumber(raw.rotateDeg, fallback.rotateDeg, -45, 45),
    opacity: asNumber(raw.opacity, fallback.opacity, 0, 1),
    flipX: typeof raw.flipX === "boolean" ? raw.flipX : fallback.flipX,
  };
}

const defaultLayer = (alt: string): ChoiceImageLayer => ({
  src: "",
  alt,
  x: 0,
  y: 0,
  scale: 1,
  rotateDeg: 0,
  opacity: 1,
  flipX: false,
});

export const defaultExperienceChoiceConfig: ExperienceChoiceConfig = {
  version: 1,
  copy: {
    eyebrow: "Choose",
    title: "Red pill or blue pill?",
    description:
      "This whole page is a deliberate demo of digital craft. The red pill wakes you up: turn your volume up, scroll slowly, and follow the atmosphere, motion, and hidden layers. The blue pill keeps things calm - you can read everything and use the whole site, safely in the Matrix, without the heavy spectacle. You'll miss out on 25% off your first project.",
    redLabel: "Red pill",
    redTitle: "Full Wonderland",
    redBody:
      "Sound on, slow scroll, full effects - see how deep the rabbit hole goes. Includes the interactive discount tier when you progress.",
    blueLabel: "Blue pill",
    blueTitle: "Stay in the Matrix",
    blueBody:
      "Calm browsing: simpler motion, lighter background, easier reading - especially on phones. No discount perks.",
    quickStartLabel: "Quick start",
    quickStartBody:
      "Skip the portfolio tour for now. Opens in calm (blue pill) mode so the price menus are easier to read - you can switch to red pill anytime from the site.",
  },
  typography: {
    titleFont: "sans",
    bodyFont: "sans",
    titleSizePx: 36,
    bodySizePx: 16,
  },
  colors: {
    title: "#ffffff",
    body: "rgba(255,255,255,0.72)",
    modalBgFrom: "rgba(10,15,26,0.98)",
    modalBgTo: "rgba(5,8,16,0.98)",
  },
  images: {
    panelA: {
      src: "/experience-choice/red-pill-hand.png",
      alt: "Open hand offering a red pill",
      x: -110,
      y: 72,
      scale: 1.14,
      rotateDeg: -2,
      opacity: 0.34,
      flipX: false,
    },
    panelB: {
      src: "/experience-choice/blue-pill-hand.png",
      alt: "Open hand offering a blue pill",
      x: 112,
      y: 74,
      scale: 1.12,
      rotateDeg: 2,
      opacity: 0.33,
      flipX: true,
    },
    redCard: defaultLayer("Red pill card art"),
    blueCard: defaultLayer("Blue pill card art"),
  },
};

export function sanitizeExperienceChoiceConfig(input: unknown): ExperienceChoiceConfig {
  const raw = (input ?? {}) as Partial<ExperienceChoiceConfig>;
  const base = defaultExperienceChoiceConfig;
  const copy = (raw.copy ?? {}) as Partial<ExperienceChoiceConfig["copy"]>;
  const typography = (raw.typography ?? {}) as Partial<ExperienceChoiceConfig["typography"]>;
  const colors = (raw.colors ?? {}) as Partial<ExperienceChoiceConfig["colors"]>;
  const images = (raw.images ?? {}) as Partial<Record<ChoiceImageSlot, ChoiceImageLayer>>;

  return {
    version: 1,
    copy: {
      eyebrow: asText(copy.eyebrow, base.copy.eyebrow),
      title: asText(copy.title, base.copy.title),
      description: asText(copy.description, base.copy.description),
      redLabel: asText(copy.redLabel, base.copy.redLabel),
      redTitle: asText(copy.redTitle, base.copy.redTitle),
      redBody: asText(copy.redBody, base.copy.redBody),
      blueLabel: asText(copy.blueLabel, base.copy.blueLabel),
      blueTitle: asText(copy.blueTitle, base.copy.blueTitle),
      blueBody: asText(copy.blueBody, base.copy.blueBody),
      quickStartLabel: asText(copy.quickStartLabel, base.copy.quickStartLabel),
      quickStartBody: asText(copy.quickStartBody, base.copy.quickStartBody),
    },
    typography: {
      titleFont: asFont(typography.titleFont, base.typography.titleFont),
      bodyFont: asFont(typography.bodyFont, base.typography.bodyFont),
      titleSizePx: asNumber(typography.titleSizePx, base.typography.titleSizePx, 22, 72),
      bodySizePx: asNumber(typography.bodySizePx, base.typography.bodySizePx, 12, 24),
    },
    colors: {
      title: asColor(colors.title, base.colors.title),
      body: asColor(colors.body, base.colors.body),
      modalBgFrom: asColor(colors.modalBgFrom, base.colors.modalBgFrom),
      modalBgTo: asColor(colors.modalBgTo, base.colors.modalBgTo),
    },
    images: {
      panelA: sanitizeLayer(images.panelA, base.images.panelA),
      panelB: sanitizeLayer(images.panelB, base.images.panelB),
      redCard: sanitizeLayer(images.redCard, base.images.redCard),
      blueCard: sanitizeLayer(images.blueCard, base.images.blueCard),
    },
  };
}

export function readExperienceChoiceConfigFromStorage(): ExperienceChoiceConfig {
  if (typeof window === "undefined") return defaultExperienceChoiceConfig;
  try {
    const raw = window.localStorage.getItem(EXPERIENCE_CHOICE_CONFIG_KEY);
    if (!raw) return defaultExperienceChoiceConfig;
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeExperienceChoiceConfig(parsed);
    const oldLine = "and without the exclusive first-project discount";
    const newLine = "You'll miss out on 25% off your first project.";
    if (sanitized.copy.description.includes(oldLine)) {
      return {
        ...sanitized,
        copy: {
          ...sanitized.copy,
          description: sanitized.copy.description.replace(oldLine, newLine),
        },
      };
    }
    return sanitized;
  } catch {
    return defaultExperienceChoiceConfig;
  }
}

export function writeExperienceChoiceConfigToStorage(config: ExperienceChoiceConfig) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXPERIENCE_CHOICE_CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* no-op when storage unavailable */
  }
}

export function clearExperienceChoiceConfigStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(EXPERIENCE_CHOICE_CONFIG_KEY);
  } catch {
    /* no-op */
  }
}
