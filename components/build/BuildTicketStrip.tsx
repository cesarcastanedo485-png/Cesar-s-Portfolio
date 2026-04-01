"use client";

import type { BuildMenuItem } from "@/lib/build-menu";
import { cn } from "@/lib/utils";

type BuildTicketStripProps = {
  station: string;
  destination: string;
  punchedItems: BuildMenuItem[];
  className?: string;
  /** Emerald / violet Underland lane for /apps */
  tone?: "default" | "mushroom";
};

export function BuildTicketStrip({
  station,
  destination,
  punchedItems,
  className,
  tone = "default",
}: BuildTicketStripProps) {
  const mushroom = tone === "mushroom";
  return (
    <aside
      className={cn(
        "relative rounded-lg border p-4",
        mushroom
          ? "border-emerald-400/35 bg-gradient-to-b from-[#061814]/95 to-[#040810]/98 shadow-[0_0_28px_rgba(52,211,153,0.12),inset_0_0_0_1px_rgba(139,92,246,0.15)]"
          : "border-cyan-500/35 bg-gradient-to-b from-[#140a22]/95 to-[#080510]/98 shadow-[0_0_28px_rgba(0,212,255,0.08),inset_0_0_0_1px_rgba(192,132,252,0.12)]",
        className,
      )}
      aria-label="Wonderland ticket punch preview"
    >
      <div
        className={cn(
          "font-mono text-[10px] uppercase tracking-[0.28em]",
          mushroom ? "text-emerald-200/85" : "text-fuchsia-200/80",
        )}
      >
        <span className={cn("block", mushroom ? "text-violet-200/90" : "text-cyan-200/90")}>
          Depart · {station}
        </span>
        <span className={cn("mt-1 block", mushroom ? "text-emerald-100/90" : "text-fuchsia-100/90")}>
          Arrive · {destination}
        </span>
      </div>
      <div
        className={cn(
          "mt-4 border-l-2 border-dashed pl-4",
          mushroom ? "border-emerald-500/45" : "border-fuchsia-500/40",
        )}
        role="list"
        aria-label="Punched line items"
      >
        {punchedItems.length === 0 ? (
          <p
            className={cn(
              "build-alice-muted text-xs",
              mushroom ? "text-emerald-200/55" : "text-fuchsia-200/55",
            )}
          >
            No punches yet — pick modules in the price menu below.
          </p>
        ) : (
          <ul className="space-y-3">
            {punchedItems.map((item) => (
              <li key={item.id} className="relative flex gap-3" role="listitem">
                <span
                  className={cn(
                    "build-ticket-punch-hole mt-0.5 size-3 shrink-0 rounded-full border bg-[#06030c]",
                    mushroom
                      ? "border-emerald-400/55 shadow-[inset_0_0_8px_rgba(52,211,153,0.4)]"
                      : "border-cyan-400/50 shadow-[inset_0_0_8px_rgba(168,85,247,0.35)]",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-medium leading-snug",
                      mushroom ? "text-emerald-50/95" : "text-fuchsia-50/95",
                    )}
                  >
                    {item.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 font-mono text-[11px]",
                      mushroom ? "text-violet-200/85" : "text-cyan-200/80",
                    )}
                  >
                    {item.priceHint.display}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p
        className={cn(
          "build-alice-muted mt-4 font-mono text-[10px] leading-relaxed",
          mushroom ? "text-emerald-300/50" : "text-fuchsia-300/45",
        )}
      >
        WE&apos;RE ALL MAD HERE · PRICES NOT BINDING
      </p>
    </aside>
  );
}
