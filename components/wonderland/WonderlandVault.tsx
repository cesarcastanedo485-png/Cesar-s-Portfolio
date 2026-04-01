"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookMarked,
  ChevronDown,
  Clock,
  Key,
  Lock,
  Rabbit,
} from "lucide-react";
import { BrandWatermark } from "@/components/brand/BrandWatermark";
import { site, type WonderlandVaultCopy } from "@/lib/content";
import { cn } from "@/lib/utils";
import {
  GamesVaultPortalRings,
  WorkVaultKeyholePlate,
  WorkVaultMechanismFrame,
} from "@/components/wonderland/vault-mechanisms";

type WonderlandVaultProps = {
  variant: "work" | "games";
  panelId: string;
  copy: WonderlandVaultCopy;
  children: React.ReactNode;
};

/**
 * Always starts sealed: open only after explicit interaction (every page load).
 * Work = brass folio + keyhole; Games = portal rings + pocket-watch cue.
 */
export function WonderlandVault({
  variant,
  panelId,
  copy,
  children,
}: WonderlandVaultProps) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const hintId = useId();

  const isWork = variant === "work";
  const wm = site.watermark;
  const hint =
    copy.accessHint?.trim() ||
    (isWork
      ? "Work samples are hidden until you open this control."
      : "Games are hidden until you open this control.");

  return (
    <div className="space-y-5">
      <span id={hintId} className="sr-only">
        {hint}
      </span>
      {!open ? (
        <motion.button
          type="button"
          layout
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-controls={panelId}
          aria-describedby={hintId}
          aria-label={`${copy.ctaClosed}: ${copy.teaserTitle}`}
          whileHover={reduceMotion ? undefined : { scale: 1.006 }}
          whileTap={reduceMotion ? undefined : { scale: 0.995 }}
          transition={{ type: "spring", stiffness: 520, damping: 28 }}
          className={cn(
            "group relative w-full overflow-hidden rounded-2xl border text-left transition-colors",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            isWork
              ? "border-cyan-500/35 bg-gradient-to-br from-[#0c1224]/95 via-[#080d18]/98 to-[#050810] focus-visible:outline-cyan-400/70"
              : "border-amber-400/35 bg-gradient-to-br from-[#1a1208]/95 via-[#100a06]/98 to-[#050810] focus-visible:outline-amber-400/70"
          )}
        >
          <WorkVaultMechanismFrame />
          {isWork ? <WorkVaultKeyholePlate /> : <GamesVaultPortalRings />}

          <span
            className="pointer-events-none absolute right-3 top-2.5 font-serif text-lg leading-none text-white/[0.11] sm:right-4 sm:top-3 sm:text-xl"
            aria-hidden
          >
            ♠
          </span>
          {isWork ? (
            <div
              className="pointer-events-none absolute right-[5.25rem] top-1/2 hidden -translate-y-1/2 md:flex md:items-center md:justify-center lg:right-[6.25rem]"
              aria-hidden
            >
              <div className="relative flex size-11 items-center justify-center rounded-full border-2 border-rose-900/75 bg-gradient-to-br from-rose-950 via-red-950 to-rose-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_16px_rgba(0,0,0,0.55)] ring-1 ring-rose-600/35">
                <div className="absolute inset-[5px] rounded-full border border-rose-950/60 bg-black/25" />
                <span className="relative text-[11px] text-rose-100/75">✦</span>
              </div>
            </div>
          ) : null}
          <div
            className={cn(
              "pointer-events-none absolute -right-16 -top-20 z-[1] size-[min(55vw,280px)] rounded-full opacity-40 blur-3xl",
              isWork ? "bg-cyan-500/25" : "bg-amber-500/20"
            )}
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none absolute -bottom-24 -left-12 z-[1] size-[min(48vw,220px)] rounded-full opacity-35 blur-3xl",
              isWork ? "bg-fuchsia-600/20" : "bg-emerald-600/18"
            )}
            aria-hidden
          />

          <div className="relative z-[2] flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
            <div className="relative shrink-0">
              {!isWork ? (
                <div
                  className="pointer-events-none absolute -top-8 left-1/2 flex -translate-x-1/2 gap-1.5"
                  aria-hidden
                >
                  <div className="vault-tea-steam-wisp h-7 w-px rounded-full bg-gradient-to-t from-amber-200/55 via-amber-100/25 to-transparent" />
                  <div className="vault-tea-steam-wisp h-9 w-px rounded-full bg-gradient-to-t from-amber-200/50 via-amber-100/20 to-transparent" />
                  <div className="vault-tea-steam-wisp h-6 w-px rounded-full bg-gradient-to-t from-amber-200/45 via-amber-50/15 to-transparent" />
                </div>
              ) : null}
              <div
                className={cn(
                  "relative flex size-16 items-center justify-center rounded-2xl border shadow-inner sm:size-[4.5rem]",
                  isWork
                    ? "border-cyan-400/30 bg-black/50 text-cyan-200/90"
                    : "border-amber-400/30 bg-black/50 text-amber-200/90"
                )}
                aria-hidden
              >
                {!isWork ? (
                  <Clock
                    className="absolute -right-1 -top-1 size-5 text-amber-200/55 sm:size-5"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                ) : null}
                {isWork ? (
                  <BookMarked className="size-8 sm:size-9" strokeWidth={1.25} />
                ) : (
                  <Rabbit className="size-8 sm:size-9" strokeWidth={1.25} />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <p
                className={cn(
                  "font-serif text-xl font-medium tracking-tight sm:text-2xl",
                  isWork ? "text-cyan-100/95" : "text-amber-50/95"
                )}
              >
                {copy.teaserTitle}
              </p>
              <p className="neon-sign-body text-sm leading-relaxed text-white/65 sm:text-base">
                {copy.teaserBody}
              </p>
              {copy.footnote ? (
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
                  {copy.footnote}
                </p>
              ) : null}
            </div>

            <div
              className={cn(
                "relative flex shrink-0 items-center gap-2 self-start rounded-full border px-4 py-2.5 text-sm font-medium sm:self-center",
                "before:absolute before:inset-y-1 before:-left-px before:w-px before:bg-gradient-to-b before:from-transparent before:via-white/25 before:to-transparent sm:before:block",
                isWork
                  ? "border-cyan-400/40 bg-cyan-950/40 text-cyan-100/90 group-hover:border-cyan-300/55 group-hover:bg-cyan-900/35"
                  : "border-amber-400/40 bg-amber-950/35 text-amber-100/90 group-hover:border-amber-300/55 group-hover:bg-amber-900/30"
              )}
            >
              {isWork ? (
                <Key className="size-4 opacity-90" aria-hidden />
              ) : (
                <Clock className="size-4 opacity-90" aria-hidden />
              )}
              {copy.ctaClosed}
            </div>
          </div>
        </motion.button>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className={cn(
                "text-xs font-medium uppercase tracking-[0.18em]",
                isWork ? "text-cyan-200/55" : "text-amber-200/55"
              )}
            >
              {isWork ? "Latch released" : "Passage open"}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-controls={panelId}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                isWork
                  ? "border-white/15 bg-white/5 text-cyan-100/85 hover:border-cyan-500/35 hover:bg-cyan-950/25 focus-visible:outline-cyan-400/60"
                  : "border-white/15 bg-white/5 text-amber-100/85 hover:border-amber-500/35 hover:bg-amber-950/25 focus-visible:outline-amber-400/60"
              )}
            >
              <Lock className="size-3.5" aria-hidden />
              {copy.ctaOpen}
            </button>
          </div>

          <motion.div
            id={panelId}
            role="region"
            aria-label={copy.teaserTitle}
            className="relative isolate"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {wm?.imageSrc?.trim() ? (
              <div
                className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
                aria-hidden
              >
                <BrandWatermark
                  src={wm.imageSrc}
                  alt={wm.alt}
                  decorative={wm.decorative !== false}
                  className="absolute bottom-1 right-1 w-[min(46vw,260px)] max-w-[88%]"
                  opacityClassName={isWork ? "opacity-[0.09]" : "opacity-[0.1]"}
                />
              </div>
            ) : null}
            <div className="relative z-[1]">{children}</div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
