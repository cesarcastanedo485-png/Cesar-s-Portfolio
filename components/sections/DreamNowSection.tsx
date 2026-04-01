"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";

export function DreamNowSection() {
  const { currentLevel, maxLevel, canAccessOracle, openOverlay } = useProgression();

  return (
    <section
      id="dream-now"
      className="scroll-mt-24 py-16"
      aria-labelledby="dream-now-heading"
    >
      <div className="container mx-auto max-w-6xl px-6">
        <div className="section-glass-panel overflow-hidden border-fuchsia-500/30 bg-gradient-to-br from-[#140f28]/85 to-[#090d18]/92 p-6 text-center md:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/70">
            Dream Now
          </p>
          <h2
            id="dream-now-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl"
          >
            Mad Hatter Oracle
          </h2>
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
            <div className="mt-6 space-y-3">
              <p className="vault-neon-instruction text-sm">
                Reach Level {maxLevel} to unlock the Oracle chamber.
              </p>
              <p className="text-xs text-white/65">
                Current progress: Level {currentLevel} / {maxLevel}
              </p>
              <button
                type="button"
                onClick={() => openOverlay({ openForm: true })}
                className="inline-flex rounded-full border border-cyan-400/40 bg-cyan-950/35 px-5 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-900/40"
              >
                View level requirements
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
