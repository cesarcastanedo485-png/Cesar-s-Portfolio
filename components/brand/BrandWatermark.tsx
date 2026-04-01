import { cn } from "@/lib/utils";

export type BrandWatermarkProps = {
  /** Path under `public/` (same file you reuse on other sites). */
  src: string;
  /** Set when the mark conveys meaning; otherwise decorative. */
  alt?: string;
  decorative?: boolean;
  className?: string;
  opacityClassName?: string;
};

/**
 * Cross-site brand stamp: use one asset (`public/brand/…`) and the same component
 * everywhere you want the mark (vault panels, footer, case-study heroes, etc.).
 */
export function BrandWatermark({
  src,
  alt = "",
  decorative = true,
  className,
  opacityClassName = "opacity-[0.085]",
}: BrandWatermarkProps) {
  const trimmed = src.trim();
  if (!trimmed) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny fixed asset, no layout shift requirement
    <img
      src={trimmed}
      alt={decorative ? "" : alt}
      role={decorative ? "presentation" : undefined}
      draggable={false}
      className={cn(
        "pointer-events-none select-none object-contain",
        opacityClassName,
        className
      )}
    />
  );
}
