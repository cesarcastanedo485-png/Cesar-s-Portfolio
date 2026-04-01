"use client";

import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";

/**
 * Red pill / blue pill: quick switch + re-open the full choice modal (opt-out).
 */
export function BuildExperienceBar() {
  const {
    hydrated,
    experienceMode,
    isMatrixMode,
    chooseExperience,
    reopenExperienceChoice,
  } = useProgression();

  if (!hydrated || experienceMode === null) {
    return (
      <p className="build-alice-muted text-center text-[11px] text-fuchsia-200/70 sm:text-left">
        Choose <span className="text-red-300">red pill</span> or{" "}
        <span className="text-sky-300">blue pill</span> in the dialog to continue.
      </p>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-fuchsia-500/25 bg-[#12081c]/90 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      role="region"
      aria-label="Site experience mode"
    >
      <p className="build-alice-muted text-[11px] leading-snug text-fuchsia-100/85 sm:text-xs">
        <span className="font-semibold text-cyan-200/95">Wonderland cyber-lane:</span>{" "}
        {isMatrixMode ? (
          <>
            <span className="text-sky-300">Blue pill</span> — calm read (Matrix browse). Switch to{" "}
            <span className="text-red-300">red pill</span> for full spectacle + discount tier on the main
            site.
          </>
        ) : (
          <>
            <span className="text-red-300">Red pill</span> — full Wonderland on the portfolio. Switch to{" "}
            <span className="text-sky-300">blue pill</span> for calm mode.
          </>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => chooseExperience(isMatrixMode ? "wonderland" : "matrix")}
          className={cn(
            "rounded-md border px-2.5 py-1 text-[11px] font-medium transition",
            "focus-visible:outline focus-visible:ring-2 focus-visible:ring-fuchsia-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0512]",
            isMatrixMode
              ? "border-red-400/45 bg-red-950/35 text-red-100 hover:bg-red-900/40"
              : "border-sky-400/45 bg-sky-950/30 text-sky-100 hover:bg-sky-900/35",
          )}
        >
          {isMatrixMode ? "Take red pill (Wonderland)" : "Take blue pill (calm)"}
        </button>
        <button
          type="button"
          onClick={() => reopenExperienceChoice()}
          className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-fuchsia-100/90 transition hover:border-fuchsia-400/35 hover:bg-fuchsia-950/25 focus-visible:outline focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0512]"
        >
          Choose again…
        </button>
      </div>
    </div>
  );
}
