"use client";

import { useEffect } from "react";
import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";

/**
 * First-visit gate: red pill (full Wonderland) vs blue pill (calm Matrix browse).
 * Blocks interaction until a choice is stored in progression localStorage.
 */
export function ExperienceChoiceModal() {
  const { hydrated, experienceMode, chooseExperience, chooseExperienceAndGo } =
    useProgression();
  const open = hydrated && experienceMode === null;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[450] flex items-center justify-center bg-black/92 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="experience-choice-title"
      aria-describedby="experience-choice-desc"
    >
      <div className="max-h-[min(92dvh,880px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-gradient-to-b from-[#0a0f1a]/98 to-[#050810]/98 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-8">
        <p className="text-center text-xs uppercase tracking-[0.28em] text-red-400/85">
          Choose
        </p>
        <h1
          id="experience-choice-title"
          className="mt-3 text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          Red pill or blue pill?
        </h1>
        <p
          id="experience-choice-desc"
          className="vault-neon-instruction mt-4 text-center text-sm leading-relaxed text-white/72 sm:text-base"
        >
          This whole page is a deliberate demo of digital craft. The{" "}
          <span className="text-red-300/95">red pill</span> wakes you up: turn your volume up,
          scroll slowly, and follow the atmosphere, motion, and hidden layers. The{" "}
          <span className="text-sky-300/95">blue pill</span> keeps things calm — you can read
          everything and use the whole site, safely in the Matrix, without the heavy
          spectacle (and without the exclusive first-project discount).
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseExperience("wonderland")}
            className={cn(
              "group rounded-xl border-2 border-red-500/55 bg-gradient-to-b from-red-950/50 to-black/80 px-4 py-5 text-left transition",
              "shadow-[0_0_28px_rgba(239,68,68,0.22)] hover:border-red-400/80 hover:shadow-[0_0_36px_rgba(248,113,113,0.32)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400/80",
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-red-300/90">
              Red pill
            </span>
            <span className="mt-2 block text-sm font-medium text-white/95">
              Full Wonderland
            </span>
            <span className="mt-1 block text-xs leading-snug text-white/60">
              Sound on, slow scroll, full effects — see how deep the rabbit hole goes. Includes the
              interactive discount tier when you progress.
            </span>
          </button>

          <button
            type="button"
            onClick={() => chooseExperience("matrix")}
            className={cn(
              "group rounded-xl border-2 border-sky-500/45 bg-gradient-to-b from-slate-900/80 to-black/80 px-4 py-5 text-left transition",
              "shadow-[0_0_22px_rgba(56,189,248,0.18)] hover:border-sky-400/70 hover:shadow-[0_0_30px_rgba(125,211,252,0.25)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/70",
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-300/90">
              Blue pill
            </span>
            <span className="mt-2 block text-sm font-medium text-white/95">
              Stay in the Matrix
            </span>
            <span className="mt-1 block text-xs leading-snug text-white/60">
              Calm browsing: simpler motion, lighter background, easier reading — especially on
              phones. No discount perks.
            </span>
          </button>
        </div>

        <div
          className="mt-8 rounded-xl border border-fuchsia-500/25 bg-[#12081a]/90 p-4"
          role="region"
          aria-label="Quick start to packages"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200/85">
            Quick start
          </p>
          <p className="vault-neon-instruction mt-2 text-center text-xs leading-relaxed text-white/65">
            Skip the portfolio tour for now. Opens in calm (blue pill) mode so the price menus are
            easier to read — you can switch to red pill anytime from the site.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => chooseExperienceAndGo("matrix", "/build")}
              className={cn(
                "rounded-lg border border-cyan-500/40 bg-cyan-950/35 px-3 py-3 text-left text-sm font-medium text-cyan-50 transition",
                "hover:border-cyan-300/55 hover:bg-cyan-900/40",
                "focus-visible:outline focus-visible:ring-2 focus-visible:ring-cyan-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1a]",
              )}
            >
              Website packages
              <span className="mt-1 block text-[11px] font-normal text-cyan-200/70">
                À la carte (website) — line items & receipt
              </span>
            </button>
            <button
              type="button"
              onClick={() => chooseExperienceAndGo("matrix", "/social")}
              className={cn(
                "rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/30 px-3 py-3 text-left text-sm font-medium text-fuchsia-50 transition",
                "hover:border-fuchsia-300/55 hover:bg-fuchsia-900/35",
                "focus-visible:outline focus-visible:ring-2 focus-visible:ring-fuchsia-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1a]",
              )}
            >
              Social media packages
              <span className="mt-1 block text-[11px] font-normal text-fuchsia-200/70">
                À la carte (social media) — posts & platforms
              </span>
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-white/45">
          You can clear site data in your browser anytime to see this choice again — or use
          “Choose again” on the package pages.
        </p>
      </div>
    </div>
  );
}
