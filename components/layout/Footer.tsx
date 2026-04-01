import { BrandWatermark } from "@/components/brand/BrandWatermark";
import { footerContent, site } from "@/lib/content";

export function Footer() {
  const year = new Date().getFullYear();
  const wm = site.watermark;

  return (
    <footer
      className="relative border-t border-white/10 py-10 text-center text-sm text-muted-foreground"
      role="contentinfo"
    >
      {wm?.imageSrc?.trim() ? (
        <div
          className="pointer-events-none absolute bottom-6 right-4 sm:right-8 md:right-12"
          aria-hidden
        >
          <BrandWatermark
            src={wm.imageSrc}
            alt={wm.alt}
            decorative={wm.decorative !== false}
            className="h-10 w-10 sm:h-11 sm:w-11"
            opacityClassName="opacity-[0.12]"
          />
        </div>
      ) : null}
      <p>
        © {year} {footerContent.copyright}
      </p>
      <p className="mt-2 max-w-xl mx-auto text-xs opacity-80">
        {footerContent.note}
      </p>
    </footer>
  );
}
