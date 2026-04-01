"use client";

import { Copy, Mail } from "lucide-react";
import { BuildTicketStrip } from "@/components/build/BuildTicketStrip";
import type { BuildMenuItem } from "@/lib/build-menu";
import { cn } from "@/lib/utils";

type BuildMenuMeta = {
  ticketStation: string;
  ticketDestination: string;
  stickyDisclaimer: string;
  longDisclaimer: string;
};

type BuildPriceSidebarProps = {
  meta: BuildMenuMeta;
  selectedItems: BuildMenuItem[];
  mailto: string | null;
  copied: boolean;
  onCopy: () => void;
  className?: string;
};

export function BuildPriceSidebar({
  meta,
  selectedItems,
  mailto,
  copied,
  onCopy,
  className,
}: BuildPriceSidebarProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <BuildTicketStrip
        station={meta.ticketStation}
        destination={meta.ticketDestination}
        punchedItems={selectedItems}
      />
      <aside
        id="receipt"
        className="scroll-mt-24 space-y-4 rounded-xl border border-fuchsia-500/30 bg-[#0c0614]/95 p-4 shadow-[0_0_32px_rgba(168,85,247,0.12)] backdrop-blur-sm"
        aria-labelledby="receipt-heading"
      >
        <h2 id="receipt-heading" className="text-sm font-semibold text-fuchsia-50/95">
          Running receipt · price menu
        </h2>
        <p className="build-alice-muted text-[11px] leading-relaxed text-fuchsia-100/80">
          {meta.stickyDisclaimer}
        </p>
        <ul className="max-h-[min(50vh,420px)] space-y-2 overflow-y-auto overscroll-contain text-xs xl:max-h-[min(70vh,560px)]">
          {selectedItems.length === 0 ? (
            <li className="build-alice-muted text-fuchsia-200/50">No modules punched — scroll the price menu.</li>
          ) : (
            selectedItems.map((item) => (
              <li key={item.id} className="border-b border-fuchsia-500/10 pb-2 text-slate-200">
                <span className="font-medium text-fuchsia-50/95">{item.label}</span>
                <span className="mt-0.5 block font-mono text-[11px] text-cyan-200/85">
                  {item.priceHint.display}
                </span>
              </li>
            ))
          )}
        </ul>
        <p className="build-alice-muted text-[10px] leading-relaxed text-slate-500">
          {meta.longDisclaimer}
        </p>
        <div className="flex flex-col gap-2 pt-2">
          {mailto ? (
            <a
              href={mailto}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-950/35 px-4 py-2.5 text-sm font-medium text-cyan-50 transition hover:bg-cyan-900/40 focus-visible:outline focus-visible:ring-2 focus-visible:ring-cyan-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0614]"
            >
              <Mail className="size-4 shrink-0" aria-hidden />
              Email this scope
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onCopy()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-fuchsia-500/25 bg-fuchsia-950/20 px-4 py-2.5 text-sm text-fuchsia-50 transition hover:border-fuchsia-400/40 hover:bg-fuchsia-900/30 focus-visible:outline focus-visible:ring-2 focus-visible:ring-fuchsia-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0614]"
          >
            <Copy className="size-4 shrink-0" aria-hidden />
            {copied ? "Copied" : "Copy summary"}
          </button>
        </div>
      </aside>
    </div>
  );
}
