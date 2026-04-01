"use client";

import type { BuildMenuItem } from "@/lib/build-menu";
import { cn } from "@/lib/utils";

type BuildTicketStripProps = {
  station: string;
  destination: string;
  punchedItems: BuildMenuItem[];
  className?: string;
};

export function BuildTicketStrip({
  station,
  destination,
  punchedItems,
  className,
}: BuildTicketStripProps) {
  return (
    <aside
      className={cn(
        "relative rounded-lg border border-cyan-500/35 bg-gradient-to-b from-[#140a22]/95 to-[#080510]/98 p-4 shadow-[0_0_28px_rgba(0,212,255,0.08),inset_0_0_0_1px_rgba(192,132,252,0.12)]",
        className,
      )}
      aria-label="Wonderland ticket punch preview"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fuchsia-200/80">
        <span className="block text-cyan-200/90">Depart · {station}</span>
        <span className="mt-1 block text-fuchsia-100/90">Arrive · {destination}</span>
      </div>
      <div
        className="mt-4 border-l-2 border-dashed border-fuchsia-500/40 pl-4"
        role="list"
        aria-label="Punched line items"
      >
        {punchedItems.length === 0 ? (
          <p className="build-alice-muted text-xs text-fuchsia-200/55">
            No punches yet — pick modules in the price menu below.
          </p>
        ) : (
          <ul className="space-y-3">
            {punchedItems.map((item) => (
              <li key={item.id} className="relative flex gap-3" role="listitem">
                <span
                  className="build-ticket-punch-hole mt-0.5 size-3 shrink-0 rounded-full border border-cyan-400/50 bg-[#06030c] shadow-[inset_0_0_8px_rgba(168,85,247,0.35)]"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-snug text-fuchsia-50/95">{item.label}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-cyan-200/80">{item.priceHint.display}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="build-alice-muted mt-4 font-mono text-[10px] leading-relaxed text-fuchsia-300/45">
        WE&apos;RE ALL MAD HERE · PRICES NOT BINDING
      </p>
    </aside>
  );
}
