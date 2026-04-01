"use client";

import { useMemo } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useProgression } from "@/lib/progression";

export function LevelUpOverlay() {
  const {
    hydrated,
    currentLevel,
    maxLevel,
    levelOneComplete,
    canAccessOracle,
    overlayCollapsed,
    username,
    collapseOverlay,
    openOverlay,
  } = useProgression();

  const showFullOverlay = hydrated && !overlayCollapsed;

  const heading = useMemo(() => {
    if (!hydrated) return "Initializing wonderland";
    if (canAccessOracle) {
      return `Level ${currentLevel} reached${username ? `, ${username}` : ""}`;
    }
    if (!levelOneComplete) return "Level 1: Wake the atmosphere";
    return `Level ${currentLevel} reached${username ? `, ${username}` : ""}`;
  }, [canAccessOracle, currentLevel, hydrated, levelOneComplete, username]);

  if (!hydrated) {
    return null;
  }

  return (
    <>
      {showFullOverlay ? (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-[#04070e]/94 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-fuchsia-400/35 bg-gradient-to-b from-[#110b21]/95 to-[#070a14]/95 p-5 shadow-[0_18px_80px_rgba(236,72,153,0.25)] sm:p-7">
            <button
              type="button"
              onClick={collapseOverlay}
              className="absolute right-2.5 top-2.5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/85 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400/70"
              aria-label="Hide level overlay"
            >
              <ChevronDown className="h-5 w-5" />
            </button>

            <div className="mb-5 pr-10">
              <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/75">
                Wonderland progression
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {heading}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {!levelOneComplete
                  ? "Press Play in Atmosphere controls or minimize the Atmosphere dock to hit Level 1."
                  : canAccessOracle
                    ? "Level 5 complete. Oracle access is now unlocked."
                    : `Keep interacting to reach Level ${maxLevel}: open vaults or expand project details.`}
              </p>
            </div>
            <div className="space-y-3">
              <p className="vault-neon-instruction text-sm">Progress: Level {currentLevel} / {maxLevel}</p>
              {!canAccessOracle ? (
                <p className="text-xs text-white/60">
                  Oracle chamber unlocks only at Level {maxLevel}.
                </p>
              ) : (
                <p className="text-xs text-emerald-300">Oracle unlocked.</p>
              )}
              {!levelOneComplete ? (
                <button
                  type="button"
                  onClick={collapseOverlay}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/40 px-5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-900/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/70"
                >
                  <Sparkles className="h-4 w-4" />
                  Got it
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openOverlay({ openForm: false })}
          className="fixed bottom-4 right-4 z-[320] inline-flex h-11 items-center gap-1.5 rounded-full border border-fuchsia-400/35 bg-[#0a0d18]/90 px-4 text-sm text-fuchsia-100 backdrop-blur-sm transition hover:bg-[#13182a]/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400/70"
          aria-label="Show level overlay"
        >
          <ChevronUp className="h-4 w-4" />
          Level {currentLevel}
        </button>
      )}
    </>
  );
}

