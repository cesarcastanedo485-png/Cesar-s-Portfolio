"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ORACLE_UNLOCK_LEVEL, useProgression } from "@/lib/progression";

type AlaCarteLevelGateProps = {
  title: string;
  children: ReactNode;
};

/**
 * Guardrail: In Red-pill mode, all a la carte routes stay locked until Level 5.
 * Blue-pill visitors keep normal access.
 */
export function AlaCarteLevelGate({ title, children }: AlaCarteLevelGateProps) {
  const { hydrated, experienceMode, currentLevel } = useProgression();

  if (!hydrated || experienceMode === null) {
    return (
      <main className="min-h-screen bg-[#060a13] px-4 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="vault-neon-instruction text-sm">Checking progression...</p>
        </div>
      </main>
    );
  }

  const redPillLocked = experienceMode === "wonderland" && currentLevel < ORACLE_UNLOCK_LEVEL;
  if (redPillLocked) {
    return (
      <main className="min-h-screen bg-[#060a13] px-4 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-fuchsia-400/35 bg-[#0b1020]/80 p-6 text-center shadow-[0_24px_64px_rgba(88,28,135,0.35)]">
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200/70">
            A la Carte Locked
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Reach Level {ORACLE_UNLOCK_LEVEL} to open {title}
          </h1>
          <p className="vault-neon-instruction mx-auto mt-3 max-w-xl text-sm">
            Current progression: Level {currentLevel} / {ORACLE_UNLOCK_LEVEL}. Keep leveling on
            the portfolio to unlock all a la carte scenes.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full border border-cyan-400/35 bg-cyan-950/35 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-900/40"
          >
            Back to portfolio
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
