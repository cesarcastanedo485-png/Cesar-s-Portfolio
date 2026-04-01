export type ForegroundSmokeIntensity = "low" | "default" | "high";

export type ForegroundSmokeProfile = {
  opacityPrimary: number;
  opacitySecondary: number;
  mobileOpacityPrimary: number;
  mobileOpacitySecondary: number;
  motionPrimary: number;
  motionSecondary: number;
};

/**
 * Atmosphere guardrail:
 * Keep all smoke tuning in this file so visual updates stay consistent across
 * AudioReactiveBackground, BackgroundAtmosphere, and ForegroundSmokeParallax.
 */
export const SMOKE_MASKS = {
  audioPrimary:
    "radial-gradient(ellipse 74% 70% at 50% 44%, transparent 0%, transparent 10%, rgba(0,0,0,0.42) 36%, black 82%)",
  /** Looser center cut on phones so mist stays visible on small screens. */
  audioPrimaryMobile:
    "radial-gradient(ellipse 84% 78% at 50% 46%, transparent 0%, transparent 6%, rgba(0,0,0,0.36) 40%, black 86%)",
  audioSecondary:
    "radial-gradient(ellipse 78% 72% at 48% 50%, transparent 0%, transparent 8%, rgba(0,0,0,0.38) 34%, black 80%)",
  audioSecondaryMobile:
    "radial-gradient(ellipse 86% 80% at 48% 50%, transparent 0%, transparent 5%, rgba(0,0,0,0.34) 38%, black 84%)",
  foreground:
    "radial-gradient(ellipse 72% 68% at 50% 48%, transparent 0%, transparent 18%, rgba(0,0,0,0.48) 44%, black 86%)",
  /** Wider mist on mobile; keeps edges without a bright hero spotlight. */
  foregroundMobile:
    "radial-gradient(ellipse 88% 82% at 50% 50%, transparent 0%, transparent 12%, rgba(0,0,0,0.42) 46%, black 88%)",
} as const;

export const AUDIO_SMOKE = {
  primary: {
    xMotionA: 0.48,
    xMotionB: 0.34,
    opacity: "calc(0.5 + var(--arp-pulse, 0) * 0.26 + var(--arp-pulse-spike, 0) * 0.18)",
    desktopOpacityClass: "opacity-[0.98]",
    mobileOpacityClass: "max-md:opacity-[0.94]",
  },
  secondary: {
    xMotionA: 0.44,
    xMotionB: 0.36,
    opacity: "calc(0.55 + var(--arp-pulse, 0) * 0.22)",
    desktopOpacityClass: "opacity-[0.96]",
    mobileOpacityClass: "max-md:opacity-[0.94]",
  },
} as const;

export const ATMOSPHERE_SMOKE = {
  primary: {
    xMotion: 18,
    yMotion: 6,
    xMotionB: 14,
    opacity: 0.95,
    mobileOpacity: 0.9,
  },
  secondary: {
    xMotion: 20,
    xMotionB: 14,
    opacity: 0.9,
    mobileOpacity: 0.86,
  },
} as const;

export const FOREGROUND_SMOKE_PROFILES: Record<ForegroundSmokeIntensity, ForegroundSmokeProfile> = {
  low: {
    opacityPrimary: 1,
    opacitySecondary: 1,
    mobileOpacityPrimary: 1,
    mobileOpacitySecondary: 1,
    motionPrimary: 0.2,
    motionSecondary: 0.18,
  },
  default: {
    opacityPrimary: 1,
    opacitySecondary: 1,
    mobileOpacityPrimary: 1,
    mobileOpacitySecondary: 1,
    motionPrimary: 0.26,
    motionSecondary: 0.22,
  },
  high: {
    opacityPrimary: 1,
    opacitySecondary: 1,
    mobileOpacityPrimary: 1,
    mobileOpacitySecondary: 1,
    motionPrimary: 0.32,
    motionSecondary: 0.28,
  },
};
