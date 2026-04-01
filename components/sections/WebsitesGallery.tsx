import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { websitesSection, type WorkItem } from "@/lib/content";
import { GodotDemoEmbed } from "@/components/sections/GodotDemoEmbed";
import { CardDetailsDisclosure } from "@/components/ui/card-details-disclosure";

function workMediaShellClass(item: WorkItem, isEmbed: boolean) {
  if (item.featured) {
    return cn(
      "relative isolate bg-black",
      isEmbed
        ? "aspect-[16/10] min-h-[min(52vh,420px)] md:aspect-auto md:min-h-[280px] md:w-1/2 md:shrink-0 md:self-stretch"
        : "aspect-[16/10] min-h-[200px] md:aspect-auto md:min-h-[280px] md:w-1/2 md:shrink-0 md:self-stretch"
    );
  }
  return cn(
    "relative isolate bg-black",
    isEmbed ? "aspect-[16/10] min-h-[min(42vh,300px)]" : "aspect-[16/10]"
  );
}

/** Permissions + payments (Stripe, etc.) for live site previews; no sandbox so mobile Safari shows nested apps reliably. */
const LIVE_SITE_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; payment *";

function WorkMedia({ item, badge }: { item: WorkItem; badge?: string }) {
  const hasImage = Boolean(item.imageSrc);
  const embedUrl = item.embedUrl?.trim();
  const isEmbed = Boolean(embedUrl);

  return (
    <div className={workMediaShellClass(item, isEmbed)}>
      {embedUrl ? (
        <iframe
          title={item.imageAlt ?? `${item.title} live preview`}
          src={embedUrl}
          className="absolute inset-0 size-full touch-manipulation border-0 [transform:translateZ(0)]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allow={LIVE_SITE_IFRAME_ALLOW}
        />
      ) : hasImage && item.imageSrc ? (
        <Image
          src={item.imageSrc}
          alt={item.imageAlt ?? item.title}
          fill
          sizes={
            item.featured
              ? "(max-width: 768px) 100vw, 55vw"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
          className="object-cover"
          priority={item.featured}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            item.gradient ?? "from-white/15 to-white/5"
          )}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 md:from-black/40 md:to-transparent md:via-transparent"
        aria-hidden
      />
      {item.featured && badge ? (
        <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function WorkLinks({ links }: { links: WorkItem["links"] }) {
  if (!links.length) {
    return (
      <p className="neon-sign-body text-xs italic">More details soon.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const external = link.external ?? /^https?:\/\//.test(link.href);
        const className = cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-white/20 text-foreground hover:border-cyan-500/40 hover:bg-cyan-950/20"
        );

        if (external) {
          return (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(className, "inline-flex gap-1")}
            >
              {link.label}
              <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
            </a>
          );
        }

        return (
          <Link
            key={`${link.label}-${link.href}`}
            href={link.href}
            className={className}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

export function WebsitesGallery() {
  const { sectionEyebrow, sectionIntro, featuredBadge, items } =
    websitesSection;
  const ordered = [...items].sort(
    (a, b) => Number(!!b.featured) - Number(!!a.featured)
  );

  return (
    <section
      id="work"
      className="py-16 scroll-mt-24"
      aria-labelledby="work-heading"
    >
      <div className="container mx-auto max-w-6xl px-6">
        <div className="section-glass-panel mb-10 max-w-3xl px-5 py-4 md:px-7 md:py-5">
          <h2
            id="work-heading"
            className="text-2xl font-bold tracking-tight text-foreground md:text-3xl"
          >
            {sectionEyebrow}
          </h2>
          {sectionIntro ? (
            <p className="neon-sign-body mt-3 max-w-2xl text-sm leading-relaxed md:text-base">
              {sectionIntro}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {ordered.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "overflow-hidden border-white/10 bg-[#050810]/88 shadow-none backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.12)]",
                item.featured && "md:col-span-2"
              )}
            >
              <div
                className={cn(
                  "flex h-full flex-col",
                  item.featured && "md:flex-row"
                )}
              >
                <WorkMedia item={item} badge={featuredBadge} />
                <div
                  className={cn(
                    "flex flex-1 flex-col gap-3 p-5 sm:p-6",
                    item.featured && "md:justify-center md:py-8"
                  )}
                >
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="neon-sign-body text-xs font-medium uppercase tracking-wide">
                      {item.role}
                    </p>
                  </div>
                  <CardDetailsDisclosure disclosureId={`work-details-${item.id}`}>
                    <p className="neon-sign-body text-sm leading-relaxed">
                      {item.summary}
                    </p>
                    {item.tags?.length ? (
                      <ul
                        className="flex flex-wrap gap-1.5"
                        aria-label="Technologies"
                      >
                        {item.tags.map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/80"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <GodotDemoEmbed
                      demoEnabled={item.demoEnabled}
                      demoSlug={item.demoSlug}
                      demoTitle={item.demoTitle}
                      demoNotes={item.demoNotes}
                      demoFallbackHref={item.demoFallbackHref}
                    />
                    <WorkLinks links={item.links} />
                  </CardDetailsDisclosure>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
