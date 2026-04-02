import portfolio from "@/content/portfolio.json";

export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
  /** In-page sections (#work) vs full routes (/build) — controls header styling. */
  navGroup?: "anchor" | "page";
};

export type WorkLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type WorkItem = {
  id: number;
  title: string;
  /** Short line, e.g. “Product design · frontend” */
  role: string;
  summary: string;
  tags?: string[];
  featured?: boolean;
  imageSrc?: string;
  imageAlt?: string;
  /** Optional Godot Web mini-demo config */
  demoEnabled?: boolean;
  /** Slug that maps to `/demos/<slug>/index.html` */
  demoSlug?: string;
  /** Absolute URL for externally hosted demos (used instead of demoSlug when set). */
  demoUrl?: string;
  demoTitle?: string;
  /** Optional controls/help text shown near the demo */
  demoNotes?: string;
  /** Optional fallback for opening demo outside the card */
  demoFallbackHref?: string;
  demoRequiresProgression?: boolean;
  demoDefaultOpen?: boolean;
  /** When set, the work card media area shows this URL in an iframe (live site preview). */
  embedUrl?: string;
  /** Used when `imageSrc` is omitted — Tailwind utilities after `bg-gradient-to-br`, e.g. `from-cyan-600/90 to-slate-950` */
  gradient?: string;
  links: WorkLink[];
};

export type GameItem = {
  id: number;
  title: string;
  price: string;
  /** Short blurb under the status line */
  summary?: string;
  /** Full-width spotlight card: long intro copy */
  detail?: string;
  /** Optional bullet list (featured games) */
  highlights?: string[];
  tags?: string[];
  /** Renders as a full-width row above the standard games grid */
  featured?: boolean;
  sourceAvailable: boolean;
  /** When set with sourceAvailable, "Source Available" is a real link */
  sourceHref?: string;
  gradient: string;
  iconSrc?: string;
  iconAlt?: string;
  /** Optional Godot Web mini-demo config */
  demoEnabled?: boolean;
  /** Slug that maps to `/demos/<slug>/index.html` */
  demoSlug?: string;
  /** Absolute URL for externally hosted demos (used instead of demoSlug when set). */
  demoUrl?: string;
  demoTitle?: string;
  /** Optional controls/help text shown near the demo */
  demoNotes?: string;
  /** Optional fallback for opening demo outside the card */
  demoFallbackHref?: string;
  /**
   * When false, Godot demo is visible without reaching progression Level 1.
   * Omit or true: show “Demo locked” until the visitor levels up (default).
   */
  demoRequiresProgression?: boolean;
  /** When true, the iframe loads expanded (“Launch demo” state) on first paint. */
  demoDefaultOpen?: boolean;
};

export type AudioReactiveBackgroundConfig = {
  enabled?: boolean;
  /** Path under `public/`, e.g. `/backgrounds/art.png` */
  imageSrc?: string;
  /** Optional second overlay image under `public/` (e.g. glowing foreground mushrooms). */
  mushroomImageSrc?: string;
  /** Path under `public/` or absolute URL */
  audioSrc?: string;
  showControls?: boolean;
  /** Empty string uses decorative `alt=""` */
  imageAlt?: string;
  /** Optional alt for mushroom overlay; empty string keeps it decorative. */
  mushroomImageAlt?: string;
  /** Rain clip under `public/`; opacity follows music. */
  rainVideoSrc?: string;
  /** `screen` / `plus-lighter` for dark backplates; with `luma` key, applies to canvas output. */
  rainVideoBlend?: "normal" | "screen" | "plus-lighter";
  /** `luma`: canvas key from hidden video. Tune in portfolio.json. */
  rainVideoKey?: "none" | "luma";
  /** Luma key floor (0–1). */
  rainVideoLumaThreshold?: number;
  /** Soft band above floor (0–1). */
  rainVideoLumaSoften?: number;
  /** High-luma fade (0–1); use 1 to disable. */
  rainVideoLumaCeiling?: number;
  /** Band below ceiling (0–1). */
  rainVideoLumaCeilingSoften?: number;
};

export type ForegroundSmokeConfig = {
  enabled?: boolean;
  intensity?: "low" | "default" | "high";
  /** Defaults false; opt in only if you want smoke in Matrix mode too. */
  inMatrixMode?: boolean;
  /**
   * TEMP: unmistakable full-opacity centered CSS overlay to prove the foreground layer
   * exists (not smoke baked into the background art). Set false after you verify.
   */
  debugBlatantCenter?: boolean;
};

/** Same mark everywhere: vault panels, footer, other surfaces — reuse this file on every site. */
export type SiteWatermarkConfig = {
  imageSrc: string;
  /** Meaningful alt if the mark is not purely decorative */
  alt?: string;
  decorative?: boolean;
};

export const site = portfolio.site as typeof portfolio.site & {
  /** Optional looping MP4 under the page (path under `public/`, e.g. `/video/loop.mp4`). */
  backgroundVideo?: { src?: string; poster?: string };
  /** Full-bleed image + Web Audio analyser pulse (fixed assets). */
  audioReactiveBackground?: AudioReactiveBackgroundConfig;
  /** True foreground smoke overlay (can sit above cards/text when enabled). */
  foregroundSmoke?: ForegroundSmokeConfig;
  /** Universal brand watermark (see `public/brand/site-watermark.svg`). */
  watermark?: SiteWatermarkConfig;
};
export const nav = portfolio.nav as {
  brandLabel: string;
  /** Optional shorter brand for very small screens */
  brandLabelShort?: string;
  links: NavLink[];
};
export type BuilderLink = {
  label: string;
  href: string;
};

export const heroContent = portfolio.hero as {
  screenReaderTitle: string;
  titlePart1: string;
  titlePart2: string;
  tagline: string;
  /** Secondary CTA to website à la carte (optional). */
  builderLink?: BuilderLink;
  /** CTA to social à la carte (optional). */
  socialPackagesLink?: BuilderLink;
  /** CTA to app / mobile à la carte (optional). */
  appPackagesLink?: BuilderLink;
};

export type HeroContentProps = typeof heroContent;
export type WonderlandVaultCopy = {
  teaserTitle: string;
  teaserBody: string;
  ctaClosed: string;
  ctaOpen: string;
  footnote?: string;
  /** Explains sealed content for screen readers */
  accessHint?: string;
};

export const websitesSection = portfolio.websites as {
  sectionEyebrow: string;
  /** Optional line under the section heading */
  sectionIntro?: string;
  /** Shown on cards with `featured: true` */
  featuredBadge?: string;
  /** Short line + link toward the à la carte builder */
  builderTeaser?: BuilderLink & { text: string };
  /** Optional second line + link to app à la carte */
  appPackagesTeaser?: BuilderLink & { text: string };
  /** Alice-style “hidden folio” teaser; cards stay inside the vault until opened */
  vault?: WonderlandVaultCopy;
  items: WorkItem[];
};
export const quoteContent = portfolio.quote as { text: string };
export const gamesSection = portfolio.games as {
  sectionTitle: string;
  sectionEyebrow: string;
  /** Optional teaser link to à la carte (e.g. prototype line item). */
  builderTeaser?: BuilderLink & { text: string };
  appPackagesTeaser?: BuilderLink & { text: string };
  vault?: WonderlandVaultCopy;
  items: GameItem[];
};
export const contactContent = portfolio.contact as {
  sectionEyebrow: string;
  headline: string;
  body: string;
  /** Primary CTA; include @ for a mailto link */
  email?: string;
  emailButtonLabel?: string;
  /** Optional default subject line for the mailto link */
  emailSubject?: string;
  secondaryLinks?: WorkLink[];
  /** Line + link to scope deliverables before contact */
  builderTeaser?: BuilderLink & { text: string };
};
export const footerContent = portfolio.footer as {
  copyright: string;
  note: string;
  builderLink?: BuilderLink & { line: string };
  socialPackagesLink?: BuilderLink & { line: string };
  appPackagesLink?: BuilderLink & { line: string };
};
