"use client";

import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent, WheelEvent } from "react";
import { cn } from "@/lib/utils";
import type {
  ChoiceImageLayer,
  ChoiceImageSlot,
  ExperienceChoiceConfig,
} from "@/lib/experience-choice-config";
import {
  APPS_UNLOCK_LEVEL,
  ORACLE_UNLOCK_LEVEL,
  SOCIAL_UNLOCK_LEVEL,
  useProgression,
} from "@/lib/progression";

const fontTokenToFamily = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  neon: "var(--font-hero-neon)",
} as const;

type ExperienceChoicePreviewProps = {
  config: ExperienceChoiceConfig;
  onChoose: (mode: "wonderland" | "matrix") => void;
  onChooseAndGo: (path: string) => void;
  editorMode?: boolean;
  selectedLayer?: ChoiceImageSlot | null;
  onLayerPointerDown?: (slot: ChoiceImageSlot, event: PointerEvent<HTMLElement>) => void;
};

function clamp(input: number, min: number, max: number) {
  return Math.min(max, Math.max(min, input));
}

function getLayerStyle(layer: ChoiceImageLayer, extraY = 0): CSSProperties {
  return {
    transform: `translate(${layer.x}px, ${layer.y + extraY}px) rotate(${layer.rotateDeg}deg) scale(${layer.scale})${layer.flipX ? " scaleX(-1)" : ""}`,
    opacity: layer.opacity,
  };
}

function LayerImage({
  slot,
  layer,
  selected,
  editorMode,
  className,
  extraY = 0,
  onPointerDown,
}: {
  slot: ChoiceImageSlot;
  layer: ChoiceImageLayer;
  selected: boolean;
  editorMode: boolean;
  className?: string;
  extraY?: number;
  onPointerDown?: (slot: ChoiceImageSlot, event: PointerEvent<HTMLElement>) => void;
}) {
  if (!layer.src) return null;
  return (
    <img
      src={layer.src}
      alt={layer.alt}
      className={cn(
        "select-none",
        className,
        editorMode && "cursor-grab active:cursor-grabbing",
        selected && "ring-2 ring-fuchsia-300 ring-offset-2 ring-offset-black/60",
      )}
      style={getLayerStyle(layer, extraY)}
      draggable={false}
      onPointerDown={(event) => onPointerDown?.(slot, event)}
    />
  );
}

export function ExperienceChoicePreview({
  config,
  onChoose,
  onChooseAndGo,
  editorMode = false,
  selectedLayer = null,
  onLayerPointerDown,
}: ExperienceChoicePreviewProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [scrollLinkedOffset, setScrollLinkedOffset] = useState(0);
  const [wheelNudge, setWheelNudge] = useState(0);
  const { experienceMode, redPillUnlocks } = useProgression();
  const enforceRedPillLocks = experienceMode === "wonderland";
  const websiteLocked = enforceRedPillLocks && !redPillUnlocks.oracle;
  const socialLocked = enforceRedPillLocks && !redPillUnlocks.social;
  const appsLocked = enforceRedPillLocks && !redPillUnlocks.apps;
  const titleStyle: CSSProperties = {
    color: config.colors.title,
    fontFamily: fontTokenToFamily[config.typography.titleFont],
    fontSize: `${config.typography.titleSizePx}px`,
  };
  const bodyStyle: CSSProperties = {
    color: config.colors.body,
    fontFamily: fontTokenToFamily[config.typography.bodyFont],
    fontSize: `${config.typography.bodySizePx}px`,
  };
  const panelScrollOffset = clamp(scrollLinkedOffset * 0.22 + wheelNudge, -110, 110);

  return (
    <div
      ref={shellRef}
      className="relative max-h-[min(92dvh,880px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-8"
      style={{
        backgroundImage: `linear-gradient(to bottom, ${config.colors.modalBgFrom}, ${config.colors.modalBgTo})`,
      }}
      onScroll={(event) => {
        setScrollLinkedOffset(event.currentTarget.scrollTop);
      }}
      onWheel={(event: WheelEvent<HTMLDivElement>) => {
        const shell = shellRef.current;
        if (!shell) return;
        const hasScrollableContent = shell.scrollHeight > shell.clientHeight + 1;
        if (hasScrollableContent) {
          setWheelNudge(0);
          return;
        }
        setWheelNudge((prev) => clamp(prev + event.deltaY * 0.14, -90, 90));
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <LayerImage
          slot="panelA"
          layer={config.images.panelA}
          selected={selectedLayer === "panelA"}
          editorMode={editorMode}
          className="pointer-events-auto absolute -left-28 top-24 h-[320px] w-[460px] rounded-2xl object-cover [mask-image:linear-gradient(to_right,black_62%,transparent_100%)]"
          extraY={panelScrollOffset}
          onPointerDown={onLayerPointerDown}
        />
        <LayerImage
          slot="panelB"
          layer={config.images.panelB}
          selected={selectedLayer === "panelB"}
          editorMode={editorMode}
          className="pointer-events-auto absolute -right-28 top-24 h-[320px] w-[460px] rounded-2xl object-cover [mask-image:linear-gradient(to_left,black_62%,transparent_100%)]"
          extraY={panelScrollOffset}
          onPointerDown={onLayerPointerDown}
        />
      </div>

      <p className="text-center text-xs uppercase tracking-[0.28em] text-red-400/85">{config.copy.eyebrow}</p>
      <h1 id="experience-choice-title" className="mt-3 text-center font-semibold tracking-tight" style={titleStyle}>
        {config.copy.title}
      </h1>
      <p id="experience-choice-desc" className="vault-neon-instruction mt-4 text-center leading-relaxed" style={bodyStyle}>
        {config.copy.description}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChoose("wonderland")}
          className={cn(
            "relative group touch-manipulation rounded-xl border-2 border-red-500/55 bg-gradient-to-b from-red-950/50 to-black/80 px-4 py-5 text-left transition active:opacity-95",
            "shadow-[0_0_28px_rgba(239,68,68,0.22)] hover:border-red-400/80 hover:shadow-[0_0_36px_rgba(248,113,113,0.32)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400/80",
          )}
        >
          <LayerImage
            slot="redCard"
            layer={config.images.redCard}
            selected={selectedLayer === "redCard"}
            editorMode={editorMode}
            className="pointer-events-auto absolute right-3 top-2 h-12 w-12 rounded-md object-cover"
            onPointerDown={onLayerPointerDown}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-red-300/90">
            {config.copy.redLabel}
          </span>
          <span className="mt-2 block text-sm font-medium text-white/95">{config.copy.redTitle}</span>
          <span className="mt-1 block text-xs leading-snug text-white/60">{config.copy.redBody}</span>
        </button>

        <button
          type="button"
          onClick={() => onChoose("matrix")}
          className={cn(
            "relative group touch-manipulation rounded-xl border-2 border-sky-500/45 bg-gradient-to-b from-slate-900/80 to-black/80 px-4 py-5 text-left transition active:opacity-95",
            "shadow-[0_0_22px_rgba(56,189,248,0.18)] hover:border-sky-400/70 hover:shadow-[0_0_30px_rgba(125,211,252,0.25)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/70",
          )}
        >
          <LayerImage
            slot="blueCard"
            layer={config.images.blueCard}
            selected={selectedLayer === "blueCard"}
            editorMode={editorMode}
            className="pointer-events-auto absolute right-3 top-2 h-12 w-12 rounded-md object-cover"
            onPointerDown={onLayerPointerDown}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-300/90">
            {config.copy.blueLabel}
          </span>
          <span className="mt-2 block text-sm font-medium text-white/95">{config.copy.blueTitle}</span>
          <span className="mt-1 block text-xs leading-snug text-white/60">{config.copy.blueBody}</span>
        </button>
      </div>

      <div
        className="mt-8 rounded-xl border border-fuchsia-500/25 bg-[#12081a]/90 p-4"
        role="region"
        aria-label="Quick start to packages"
      >
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200/85">
          {config.copy.quickStartLabel}
        </p>
        <p className="vault-neon-instruction mt-2 text-center text-xs leading-relaxed text-white/65">
          {config.copy.quickStartBody}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onChooseAndGo("/oracle-3d")}
            disabled={websiteLocked}
            className={cn(
              "rounded-lg border border-cyan-500/40 bg-cyan-950/35 px-3 py-3 text-left text-sm font-medium text-cyan-50 transition",
              "hover:border-cyan-300/55 hover:bg-cyan-900/40",
              "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-cyan-500/40 disabled:hover:bg-cyan-950/35",
              "focus-visible:outline focus-visible:ring-2 focus-visible:ring-cyan-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1a]",
            )}
          >
            Website a la carte
            <span className="mt-1 block text-[11px] font-normal text-cyan-200/70">
              A la carte (website) - Fortune Teller / Oracle chamber
            </span>
            {websiteLocked ? (
              <span className="mt-1 block text-[11px] text-cyan-100/85">
                Unlocks at Level {ORACLE_UNLOCK_LEVEL}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onChooseAndGo("/social")}
            disabled={socialLocked}
            className={cn(
              "rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/30 px-3 py-3 text-left text-sm font-medium text-fuchsia-50 transition",
              "hover:border-fuchsia-300/55 hover:bg-fuchsia-900/35",
              "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-fuchsia-500/40 disabled:hover:bg-fuchsia-950/30",
              "focus-visible:outline focus-visible:ring-2 focus-visible:ring-fuchsia-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1a]",
            )}
          >
            Social media packages
            <span className="mt-1 block text-[11px] font-normal text-fuchsia-200/70">
              A la carte (social media) - posts and platforms
            </span>
            {socialLocked ? (
              <span className="mt-1 block text-[11px] text-fuchsia-100/85">
                Unlocks at Level {SOCIAL_UNLOCK_LEVEL}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onChooseAndGo("/apps")}
            disabled={appsLocked}
            className={cn(
              "rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-3 text-left text-sm font-medium text-emerald-50 transition",
              "hover:border-emerald-300/55 hover:bg-emerald-900/35 sm:col-span-1",
              "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-emerald-500/40 disabled:hover:bg-emerald-950/30",
              "focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1a]",
            )}
          >
            Android app packages
            <span className="mt-1 block text-[11px] font-normal text-emerald-200/70">
              A la carte (Android app) - stacks, APK/Play and ASO
            </span>
            {appsLocked ? (
              <span className="mt-1 block text-[11px] text-emerald-100/85">
                Unlocks at Level {APPS_UNLOCK_LEVEL}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-white/45">
        You can clear site data in your browser anytime to see this choice again - or use
        "Choose again" on the package pages.
      </p>
    </div>
  );
}
