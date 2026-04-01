import { cn } from "@/lib/utils";

type SectionTone = "work" | "games";

const toneSummary: Record<
  SectionTone,
  string
> = {
  work: "border-fuchsia-500/35 bg-fuchsia-950/20 text-fuchsia-100 hover:border-fuchsia-400/50 hover:bg-fuchsia-950/28",
  games:
    "border-amber-500/40 bg-amber-950/20 text-amber-100 hover:border-amber-400/50 hover:bg-amber-950/28",
};

type SectionOverviewDisclosureProps = {
  id: string;
  tone: SectionTone;
  children: React.ReactNode;
  className?: string;
};

/**
 * Second pattern vs card “Details”: section-level copy (intro / eyebrow) lives
 * in the expandable panel; the H2 stays visible above.
 */
export function SectionOverviewDisclosure({
  id,
  tone,
  children,
  className,
}: SectionOverviewDisclosureProps) {
  return (
    <details id={id} className={cn("group mt-3", className)}>
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition",
          toneSummary[tone],
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <span>Overview</span>
        <span
          className="inline-block text-xs opacity-90 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          ▼
        </span>
      </summary>
      <div className="mt-3 max-w-2xl">{children}</div>
    </details>
  );
}
