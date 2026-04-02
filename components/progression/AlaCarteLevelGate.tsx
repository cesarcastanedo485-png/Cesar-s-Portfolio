"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ORACLE_UNLOCK_LEVEL, useProgression } from "@/lib/progression";

type AlaCarteLevelGateProps = {
  title: string;
  requiredLevel?: number;
  children: ReactNode;
};

/**
 * Guardrail: In Red-pill mode, all a la carte routes stay locked until Level 5.
 * Blue-pill visitors keep normal access.
 */
export function AlaCarteLevelGate({
  title,
  requiredLevel = ORACLE_UNLOCK_LEVEL,
  children,
}: AlaCarteLevelGateProps) {
  const pathname = usePathname();
  const { hydrated, experienceMode, currentLevel, redPillUnlocks } = useProgression();

  if (!hydrated || experienceMode === null) {
    return (
      <main className="min-h-screen bg-[#060a13] px-4 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="vault-neon-instruction text-sm">Checking progression...</p>
        </div>
      </main>
    );
  }

  const redPillLocked = experienceMode === "wonderland" && currentLevel < requiredLevel;
  if (redPillLocked) {
    return (
      <main className="min-h-screen bg-[#060a13] px-4 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-fuchsia-400/35 bg-[#0b1020]/80 p-6 text-center shadow-[0_24px_64px_rgba(88,28,135,0.35)]">
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200/70">
            A la Carte Locked
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Reach Level {requiredLevel} to open {title}
          </h1>
          <p className="vault-neon-instruction mx-auto mt-3 max-w-xl text-sm">
            Current progression: Level {currentLevel} / {requiredLevel}. Keep leveling on
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

  const showRouteLink = (href: "/oracle-3d" | "/social" | "/apps") => {
    if (href === "/oracle-3d") return redPillUnlocks.oracle || experienceMode !== "wonderland";
    if (href === "/social") return redPillUnlocks.social || experienceMode !== "wonderland";
    return redPillUnlocks.apps || experienceMode !== "wonderland";
  };

  return (
    <>
      <div className="border-b border-white/10 bg-[#070d18]/88 px-4 py-2 text-white/90 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          {showRouteLink("/oracle-3d") ? (
            <Link
              href="/oracle-3d"
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                pathname === "/oracle-3d"
                  ? "border-cyan-300/55 bg-cyan-900/35 text-cyan-50"
                  : "border-cyan-500/35 bg-cyan-950/20 text-cyan-100 hover:bg-cyan-900/30"
              }`}
            >
              Website a la carte
            </Link>
          ) : null}
          {showRouteLink("/social") ? (
            <Link
              href="/social"
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                pathname === "/social"
                  ? "border-pink-300/55 bg-pink-900/35 text-pink-50"
                  : "border-pink-500/35 bg-pink-950/20 text-pink-100 hover:bg-pink-900/30"
              }`}
            >
              Social a la carte
            </Link>
          ) : null}
          {showRouteLink("/apps") ? (
            <Link
              href="/apps"
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                pathname === "/apps"
                  ? "border-emerald-300/55 bg-emerald-900/35 text-emerald-50"
                  : "border-emerald-500/35 bg-emerald-950/20 text-emerald-100 hover:bg-emerald-900/30"
              }`}
            >
              Android app a la carte
            </Link>
          ) : null}
          <Link
            href="/"
            className="ml-auto rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
          >
            Back to homepage
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}
