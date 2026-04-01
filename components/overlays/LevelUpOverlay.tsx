"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useProgression, ORACLE_UNLOCK_LEVEL } from "@/lib/progression";

export function LevelUpOverlay() {
  const {
    hydrated,
    experienceMode,
    isMatrixMode,
    currentLevel,
    maxLevel,
    levelOneComplete,
    canAccessOracle,
    overlayCollapsed,
    username,
    collapseOverlay,
    openOverlay,
    submitDiscountClaim,
    discountClaim,
    eligibleDiscountPercent,
  } = useProgression();

  const [claimEmail, setClaimEmail] = useState("");
  const [claimName, setClaimName] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);

  const showFullOverlay = hydrated && !overlayCollapsed;
  const showFloatingPill = overlayCollapsed && currentLevel > 0;

  const heading = useMemo(() => {
    if (!hydrated) return "Initializing wonderland";
    if (canAccessOracle) {
      return `Level ${currentLevel} reached${username ? `, ${username}` : ""}`;
    }
    if (!levelOneComplete) return "Level 1: Wake the atmosphere";
    return `Level ${currentLevel} reached${username ? `, ${username}` : ""}`;
  }, [canAccessOracle, currentLevel, hydrated, levelOneComplete, username]);

  if (!hydrated || experienceMode === null || isMatrixMode) {
    return null;
  }

  const onClaim = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    const ok = submitDiscountClaim({
      email: claimEmail,
      username: claimName || undefined,
    });
    if (ok) {
      setClaimEmail("");
      setClaimName("");
    } else {
      setClaimError("Enter a valid email, and make sure you have progress to claim.");
    }
  };

  return (
    <>
      {showFullOverlay ? (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-[#04070e]/94 p-4 backdrop-blur-sm">
          <div className="relative max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-fuchsia-400/35 bg-gradient-to-b from-[#110b21]/95 to-[#070a14]/95 p-5 shadow-[0_18px_80px_rgba(236,72,153,0.25)] sm:p-7">
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
                    ? `Level ${ORACLE_UNLOCK_LEVEL} complete. Oracle access is now unlocked.`
                    : `Keep interacting to reach Level ${ORACLE_UNLOCK_LEVEL}: open vaults or expand project details.`}
              </p>
            </div>
            <div className="space-y-3">
              <p className="vault-neon-instruction text-sm">
                Progress: Level {currentLevel} / {maxLevel}
              </p>
              {!canAccessOracle ? (
                <p className="text-xs text-white/60">
                  Oracle chamber unlocks only at Level {ORACLE_UNLOCK_LEVEL}.
                </p>
              ) : (
                <p className="text-xs text-emerald-300">Oracle unlocked.</p>
              )}

              {levelOneComplete ? (
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-medium text-white/90">
                    First website perk
                  </p>
                  <p className="mt-1 text-xs text-white/65">
                    Each level adds <span className="text-fuchsia-200/90">5%</span> off your
                    first site commission, up to{" "}
                    <span className="text-fuchsia-200/90">25%</span> at Level 5. Submit your
                    email once to lock in your current tier.
                  </p>
                  {discountClaim ? (
                    <p className="mt-3 text-sm text-emerald-300/95">
                      Claimed: {discountClaim.percent}% reserved for {discountClaim.email}.
                    </p>
                  ) : eligibleDiscountPercent > 0 ? (
                    <form className="mt-3 space-y-2" onSubmit={onClaim}>
                      <label className="block text-xs text-white/55">
                        Email (required)
                        <input
                          type="email"
                          value={claimEmail}
                          onChange={(ev) => setClaimEmail(ev.target.value)}
                          required
                          autoComplete="email"
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-fuchsia-500/30 focus:ring-2"
                          placeholder="you@example.com"
                        />
                      </label>
                      <label className="block text-xs text-white/55">
                        Name (optional)
                        <input
                          type="text"
                          value={claimName}
                          onChange={(ev) => setClaimName(ev.target.value)}
                          autoComplete="name"
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-fuchsia-500/30 focus:ring-2"
                          placeholder="How we should address you"
                        />
                      </label>
                      {claimError ? (
                        <p className="text-xs text-rose-300">{claimError}</p>
                      ) : null}
                      <button
                        type="submit"
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-fuchsia-400/45 bg-fuchsia-950/40 text-sm font-medium text-fuchsia-50 transition hover:bg-fuchsia-900/45 sm:w-auto sm:px-6"
                      >
                        <Sparkles className="h-4 w-4" aria-hidden />
                        Claim {eligibleDiscountPercent}% off
                      </button>
                    </form>
                  ) : (
                    <p className="mt-2 text-xs text-white/55">
                      Reach Level 1 to unlock a discount tier.
                    </p>
                  )}
                </div>
              ) : null}

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
      ) : showFloatingPill ? (
        <button
          type="button"
          onClick={() => openOverlay({ openForm: false })}
          className="fixed bottom-4 right-4 z-[320] inline-flex h-11 items-center gap-1.5 rounded-full border border-fuchsia-400/35 bg-[#0a0d18]/90 px-4 text-sm text-fuchsia-100 backdrop-blur-sm transition hover:bg-[#13182a]/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400/70"
          aria-label="Show level overlay"
        >
          <ChevronUp className="h-4 w-4" />
          Level {currentLevel}
        </button>
      ) : null}
    </>
  );
}
