"use client";

import { Copy, Mail } from "lucide-react";
import { BuildTicketStrip } from "@/components/build/BuildTicketStrip";
import type { BuildMenuCategory, BuildMenuItem } from "@/lib/build-menu";
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
  /** Defaults to `receipt` for anchor links on /build */
  receiptDomId?: string;
  receiptHeading?: string;
  tone?: "default" | "mushroom";
  /** When set with `tone="mushroom"`, shows stacked caps for categories with any selection */
  categories?: BuildMenuCategory[];
  selectedIds?: Set<string>;
};

function MushroomCapStack({
  categories,
  selectedIds,
}: {
  categories: BuildMenuCategory[];
  selectedIds: Set<string>;
}) {
  return (
    <div
      className="flex flex-wrap justify-center gap-1.5 py-3"
      aria-hidden
      title="One cap lights up per category with a selection"
    >
      {categories.map((cat, idx) => {
        const active = cat.items.some((i) => selectedIds.has(i.id));
        return (
          <div
            key={cat.id}
            className={cn(
              "h-3.5 w-9 rounded-t-full border transition-all duration-300 ease-out",
              active
                ? "translate-y-0 border-emerald-400/50 bg-gradient-to-b from-emerald-400/55 to-violet-600/45 shadow-[0_0_14px_rgba(52,211,153,0.35)]"
                : "translate-y-1 border-white/10 bg-black/45 opacity-45",
            )}
            style={{ zIndex: idx }}
          />
        );
      })}
    </div>
  );
}

export function BuildPriceSidebar({
  meta,
  selectedItems,
  mailto,
  copied,
  onCopy,
  className,
  receiptDomId = "receipt",
  receiptHeading = "Running receipt · price menu",
  tone = "default",
  categories,
  selectedIds,
}: BuildPriceSidebarProps) {
  const headingId = `${receiptDomId}-heading`;
  const mushroom = tone === "mushroom";
  const showCaps = mushroom && categories?.length && selectedIds;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {showCaps ? (
        <div
          className="rounded-lg border border-emerald-500/25 bg-[#040e0c]/90 px-2 shadow-[inset_0_0_24px_rgba(139,92,246,0.08)]"
          aria-hidden
        >
          <p className="px-2 pt-2 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/70">
            Spore stack · categories lit
          </p>
          <MushroomCapStack categories={categories} selectedIds={selectedIds} />
        </div>
      ) : null}
      <BuildTicketStrip
        station={meta.ticketStation}
        destination={meta.ticketDestination}
        punchedItems={selectedItems}
        tone={tone}
      />
      <aside
        id={receiptDomId}
        className={cn(
          "scroll-mt-24 space-y-4 rounded-xl border p-4 backdrop-blur-sm",
          mushroom
            ? "border-emerald-500/35 bg-[#040a0c]/95 shadow-[0_0_32px_rgba(52,211,153,0.14)]"
            : "border-fuchsia-500/30 bg-[#0c0614]/95 shadow-[0_0_32px_rgba(168,85,247,0.12)]",
        )}
        aria-labelledby={headingId}
      >
        <h2
          id={headingId}
          className={cn("text-sm font-semibold", mushroom ? "text-emerald-50/95" : "text-fuchsia-50/95")}
        >
          {receiptHeading}
        </h2>
        <p
          className={cn(
            "build-alice-muted text-[11px] leading-relaxed",
            mushroom ? "text-emerald-100/80" : "text-fuchsia-100/80",
          )}
        >
          {meta.stickyDisclaimer}
        </p>
        <ul className="max-h-[min(50vh,420px)] space-y-2 overflow-y-auto overscroll-contain text-xs xl:max-h-[min(70vh,560px)]">
          {selectedItems.length === 0 ? (
            <li
              className={cn(
                "build-alice-muted",
                mushroom ? "text-emerald-200/50" : "text-fuchsia-200/50",
              )}
            >
              No modules punched — scroll the price menu.
            </li>
          ) : (
            selectedItems.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "border-b pb-2 text-slate-200",
                  mushroom ? "border-emerald-500/15" : "border-fuchsia-500/10",
                )}
              >
                <span
                  className={cn("font-medium", mushroom ? "text-emerald-50/95" : "text-fuchsia-50/95")}
                >
                  {item.label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block font-mono text-[11px]",
                    mushroom ? "text-violet-200/85" : "text-cyan-200/85",
                  )}
                >
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
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2",
                mushroom
                  ? "border-emerald-500/40 bg-emerald-950/35 text-emerald-50 hover:bg-emerald-900/40 focus-visible:ring-emerald-400/55 focus-visible:ring-offset-[#040a0c]"
                  : "border-cyan-500/40 bg-cyan-950/35 text-cyan-50 hover:bg-cyan-900/40 focus-visible:ring-cyan-400/55 focus-visible:ring-offset-[#0c0614]",
              )}
            >
              <Mail className="size-4 shrink-0" aria-hidden />
              Email this scope
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onCopy()}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2",
              mushroom
                ? "border-violet-500/30 bg-violet-950/25 text-violet-50 hover:border-violet-400/45 hover:bg-violet-900/30 focus-visible:ring-violet-400/45 focus-visible:ring-offset-[#040a0c]"
                : "border-fuchsia-500/25 bg-fuchsia-950/20 text-fuchsia-50 hover:border-fuchsia-400/40 hover:bg-fuchsia-900/30 focus-visible:ring-fuchsia-400/45 focus-visible:ring-offset-[#0c0614]",
            )}
          >
            <Copy className="size-4 shrink-0" aria-hidden />
            {copied ? "Copied" : "Copy summary"}
          </button>
        </div>
      </aside>
    </div>
  );
}
