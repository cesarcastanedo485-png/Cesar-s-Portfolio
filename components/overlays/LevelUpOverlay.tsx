"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useProgression } from "@/lib/progression";
import { validateUsername } from "@/lib/username-policy";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LevelUpOverlay() {
  const {
    hydrated,
    levelOneComplete,
    overlayCollapsed,
    playMode,
    username,
    collapseOverlay,
    openOverlay,
    startPlay,
    submitLevelOne,
  } = useProgression();

  const [formState, setFormState] = useState({ username: "", email: "" });
  const [error, setError] = useState<string | null>(null);

  const showFullOverlay = hydrated && !levelOneComplete && !overlayCollapsed;

  const heading = useMemo(() => {
    if (!hydrated) return "Initializing wonderland";
    if (levelOneComplete) return `Level 1 unlocked${username ? `, ${username}` : ""}`;
    if (playMode) return "Level 1: Claim your badge";
    return "Level Up: Start the game";
  }, [hydrated, levelOneComplete, playMode, username]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const usernameError = validateUsername(formState.username);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (!isValidEmail(formState.email)) {
      setError("Please enter a valid email.");
      return;
    }
    setError(null);
    submitLevelOne({
      username: formState.username,
      email: formState.email,
      source: "level-one-overlay",
    });
  };

  if (!hydrated || levelOneComplete) {
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
                {playMode
                  ? "Enter a clean username + email to unlock interactive widgets."
                  : "Press Play to begin. You can still browse the site even while this is locked."}
              </p>
            </div>

            {!playMode ? (
              <button
                type="button"
                onClick={startPlay}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/40 px-5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-900/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/70"
              >
                <Sparkles className="h-4 w-4" />
                Play
              </button>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-white/80">Username</span>
                  <input
                    value={formState.username}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, username: e.target.value }))
                    }
                    maxLength={28}
                    className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-white outline-none transition focus:border-cyan-400/70"
                    placeholder="Pick a clean username"
                    autoComplete="nickname"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-white/80">Email</span>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-white outline-none transition focus:border-cyan-400/70"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                <button
                  type="submit"
                  className="inline-flex h-10 items-center rounded-full border border-fuchsia-400/45 bg-fuchsia-950/40 px-5 text-sm font-medium text-fuchsia-100 transition hover:bg-fuchsia-900/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400/70"
                >
                  Complete Level 1
                </button>
              </form>
            )}
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
          Level 1
        </button>
      )}
    </>
  );
}

