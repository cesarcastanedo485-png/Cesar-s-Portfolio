"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandWatermark } from "@/components/brand/BrandWatermark";
import { footerContent, site } from "@/lib/content";
import { useProgression } from "@/lib/progression";

export function Footer() {
  const year = new Date().getFullYear();
  const wm = site.watermark;
  const pathname = usePathname();
  const { experienceMode } = useProgression();
  const hideAlaCarteLinks = pathname === "/" && experienceMode === "wonderland";

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
      {!hideAlaCarteLinks &&
      footerContent.builderLink?.href?.trim() &&
      footerContent.builderLink.label?.trim() ? (
        <p className="mt-4 max-w-xl mx-auto text-xs text-cyan-100/80">
          {footerContent.builderLink.line}{" "}
          <Link
            href={footerContent.builderLink.href}
            className="font-medium text-cyan-200 underline decoration-cyan-500/45 underline-offset-2 hover:text-cyan-50"
          >
            {footerContent.builderLink.label}
          </Link>
        </p>
      ) : null}
      {!hideAlaCarteLinks &&
      footerContent.socialPackagesLink?.href?.trim() &&
      footerContent.socialPackagesLink.label?.trim() ? (
        <p className="mt-2 max-w-xl mx-auto text-xs text-pink-100/80">
          {footerContent.socialPackagesLink.line}{" "}
          <Link
            href={footerContent.socialPackagesLink.href}
            className="font-medium text-pink-200 underline decoration-pink-500/45 underline-offset-2 hover:text-pink-50"
          >
            {footerContent.socialPackagesLink.label}
          </Link>
        </p>
      ) : null}
      {!hideAlaCarteLinks &&
      footerContent.appPackagesLink?.href?.trim() &&
      footerContent.appPackagesLink.label?.trim() ? (
        <p className="mt-2 max-w-xl mx-auto text-xs text-emerald-100/80">
          {footerContent.appPackagesLink.line}{" "}
          <Link
            href={footerContent.appPackagesLink.href}
            className="font-medium text-emerald-200 underline decoration-emerald-500/45 underline-offset-2 hover:text-emerald-50"
          >
            {footerContent.appPackagesLink.label}
          </Link>
        </p>
      ) : null}
    </footer>
  );
}
