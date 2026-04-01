"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronUp, HelpCircle, Sparkles } from "lucide-react";
import { useProgression, ORACLE_UNLOCK_LEVEL } from "@/lib/progression";
import { cn } from "@/lib/utils";

export function DreamNowSection() {
  const { currentLevel, canAccessOracle, openOverlay, isMatrixMode } = useProgression();
  const [open, setOpen] = useState(false);

  return (
    <section
      id="dream-now"
      className="scroll-mt-24 py-16"
      aria-labelledby="dream-now-heading"
    >
      <div className="container mx-auto max-w-6xl px-6">
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-fuchsia-400/25 transition-[background,box-shadow,backdrop-filter] duration-300",
            open
              ? "border-fuchsia-500/35 bg-gradient-to-br from-[#140f28]/90 to-[#090d18]/95 p-6 shadow-[0_0_40px_rgba(168,85,247,0.12)] backdrop-blur-md md:p-8"
              : "border-fuchsia-400/20 bg-transparent shadow-none backdrop-blur-none",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 text-left">
              <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/80">
                Dream Now
              </p>
              <h2
                id="dream-now-heading"
                className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl"
              >
                Mad Hatter Oracle
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-full border text-lg font-semibold transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400/70",
                open
                  ? "border-fuchsia-400/50 bg-fuchsia-950/50 text-fuchsia-100 hover:bg-fuchsia-900/45"
                  : "border-fuchsia-300/40 bg-fuchsia-950/25 text-fuchsia-100 hover:bg-fuchsia-900/35",
              )}
              aria-expanded={open}
              aria-controls="dream-now-panel"
              title={open ? "Collapse" : "Expand details"}
            >
              <span className="sr-only">{open ? "Collapse" : "Show details"}</span>
              {open ? (
                <ChevronUp className="size-5" aria-hidden />
              ) : (
                <HelpCircle className="size-5" aria-hidden />
              )}
            </button>
          </div>

          <div id="dream-now-panel" hidden={!open}>
            <p className="vault-neon-instruction mx-auto mt-4 max-w-xl text-sm sm:text-base">
              Open the 3D chamber on its own page — built for orbit, zoom, and the
              experiments ahead.
            </p>
            {canAccessOracle ? (
              <Link
                href="/oracle-3d"
                className={cn(
                  "mt-6 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/50 bg-fuchsia-950/40 px-6 py-3 text-sm font-medium text-fuchsia-50 shadow-[0_0_24px_rgba(168,85,247,0.35)] transition hover:bg-fuchsia-900/45 hover:shadow-[0_0_32px_rgba(192,132,252,0.45)]",
                )}
              >
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                Enter the Oracle chamber
              </Link>
            ) : (
              <div className="mt-6 space-y-3 text-left">
                <p className="vault-neon-instruction text-sm">
                  Reach Level {ORACLE_UNLOCK_LEVEL} to unlock the Oracle chamber.
                </p>
                <p className="text-xs text-white/65">
                  Current progress: Level {currentLevel} / {ORACLE_UNLOCK_LEVEL}
                </p>
                {isMatrixMode ? (
                  <p className="text-xs leading-relaxed text-white/65">
                    You&apos;re in calm browse mode — open the work and games vaults and expand
                    project details to reach Level {ORACLE_UNLOCK_LEVEL}. Progress pop-ups are
                    hidden here.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => openOverlay({ openForm: true })}
                    className="inline-flex rounded-full border border-cyan-400/40 bg-cyan-950/35 px-5 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-900/40"
                  >
                    View level requirements
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
