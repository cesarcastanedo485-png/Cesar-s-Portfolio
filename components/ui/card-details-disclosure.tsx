import { cn } from "@/lib/utils";

type CardDetailsDisclosureProps = {
  /** Stable id for anchor / accordion semantics */
  disclosureId: string;
  /** Visible label — "Details" reads for copy, stack, demos, and links without overpromising "Try" on static cards */
  label?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Collapsible body for portfolio cards: summary, tags, embeds, CTAs.
 * Uses native <details> for keyboard + screen reader support.
 */
export function CardDetailsDisclosure({
  disclosureId,
  label = "Details",
  children,
  className,
}: CardDetailsDisclosureProps) {
  return (
    <details id={disclosureId} className={cn("group mt-2", className)}>
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-teal-500/30 bg-teal-950/20 px-3 py-2.5 text-left text-sm font-medium text-teal-200/95 transition hover:border-teal-400/45 hover:bg-teal-950/30",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <span>{label}</span>
        <span
          className="inline-block text-xs text-teal-300/90 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          ▼
        </span>
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}
