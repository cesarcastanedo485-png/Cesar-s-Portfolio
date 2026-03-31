import portfolio from "@/content/portfolio.json";

export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
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
  demoTitle?: string;
  /** Optional controls/help text shown near the demo */
  demoNotes?: string;
  /** Optional fallback for opening demo outside the card */
  demoFallbackHref?: string;
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
  demoTitle?: string;
  /** Optional controls/help text shown near the demo */
  demoNotes?: string;
  /** Optional fallback for opening demo outside the card */
  demoFallbackHref?: string;
};

export type AudioReactiveBackgroundConfig = {
  enabled?: boolean;
  /** Path under `public/`, e.g. `/backgrounds/art.png` */
  imageSrc?: string;
  /** Path under `public/` or absolute URL */
  audioSrc?: string;
  showControls?: boolean;
  /** Empty string uses decorative `alt=""` */
  imageAlt?: string;
};

export const site = portfolio.site as typeof portfolio.site & {
  /** Optional looping MP4 under the page (path under `public/`, e.g. `/video/loop.mp4`). */
  backgroundVideo?: { src?: string; poster?: string };
  /** Full-bleed image + Web Audio analyser pulse (fixed assets). */
  audioReactiveBackground?: AudioReactiveBackgroundConfig;
};
export const nav = portfolio.nav as {
  brandLabel: string;
  links: NavLink[];
};
export const heroContent = portfolio.hero as {
  screenReaderTitle: string;
  titlePart1: string;
  titlePart2: string;
  tagline: string;
};

export type HeroContentProps = typeof heroContent;
export const websitesSection = portfolio.websites as {
  sectionEyebrow: string;
  /** Optional line under the section heading */
  sectionIntro?: string;
  /** Shown on cards with `featured: true` */
  featuredBadge?: string;
  items: WorkItem[];
};
export const quoteContent = portfolio.quote as { text: string };
export const gamesSection = portfolio.games as {
  sectionTitle: string;
  sectionEyebrow: string;
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
};
export const footerContent = portfolio.footer as {
  copyright: string;
  note: string;
};
