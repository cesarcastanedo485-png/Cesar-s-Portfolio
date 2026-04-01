"use client";

import Link from "next/link";
import { Card, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { gamesSection, type GameItem } from "@/lib/content";
import { useHydrated } from "@/lib/use-hydrated";
import { GodotDemoEmbed } from "@/components/sections/GodotDemoEmbed";

/** Summary + tech tags (price is rendered by the parent row). */
function GameMeta({ game }: { game: GameItem }) {
  return (
    <>
      {game.summary ? (
        <p className="neon-sign-body text-xs leading-relaxed">
          {game.summary}
        </p>
      ) : null}
      {game.tags?.length ? (
        <ul
          className="flex flex-wrap gap-1.5"
          aria-label={`Tech for ${game.title}`}
        >
          {game.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/75"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function SourceAvailableButton({ href }: { href?: string }) {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const allowMotion = hydrated && reduceMotion === false;

  const inner = (
    <>
      Source Available
      {allowMotion ? (
        <motion.span
          initial={{ opacity: 0.6, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1.1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="ml-2 inline-flex"
          aria-hidden
        >
          <Sparkles className="h-4 w-4 text-yellow-400 group-hover:text-yellow-300" />
        </motion.span>
      ) : (
        <span className="ml-2 inline-flex opacity-90" aria-hidden>
          <Sparkles className="h-4 w-4 text-yellow-400 group-hover:text-yellow-300" />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "group inline-flex w-full border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/30 sm:w-auto"
        )}
      >
        {inner}
      </Link>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      className="w-full cursor-not-allowed opacity-60 sm:w-auto"
      title="Add sourceHref in content/portfolio.json when the repo is public"
    >
      Source coming soon
    </Button>
  );
}

function getAltIconSrc(src: string): string | null {
  if (src.endsWith(".svg")) return src.replace(/\.svg$/, ".png");
  if (src.endsWith(".png")) return src.replace(/\.png$/, ".svg");
  return null;
}

function GameIconImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  /** @deprecated kept for call-site compatibility; sizes only applied to next/image */
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [triedAlt, setTriedAlt] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setTriedAlt(false);
  }, [src]);

  const fallbackSrc = useMemo(() => getAltIconSrc(src), [src]);

  return (
    // Local assets under /public — plain <img> avoids Next/Image + SVG/fill edge cases (blank tiles on some setups).
    <img
      src={currentSrc}
      alt={alt}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={cn("absolute inset-0 size-full object-contain object-center", className)}
      onError={() => {
        if (!triedAlt && fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          setTriedAlt(true);
        }
      }}
    />
  );
}

function FeaturedGameSpotlight({ game }: { game: GameItem }) {
  const hasIcon = Boolean(game.iconSrc);

  return (
    <Card className="mb-6 overflow-hidden border-amber-500/25 bg-[#050810]/90 shadow-[0_0_0_1px_rgba(245,158,11,0.12)] backdrop-blur-md transition-all hover:border-amber-500/35">
      <div className="flex flex-col md:flex-row md:items-stretch">
        <div
          className={cn(
            "relative min-h-[220px] bg-[#06080f] md:w-[min(42%,420px)] md:shrink-0",
            "aspect-[3/4] max-md:max-h-[420px] max-md:w-full md:aspect-auto md:max-h-none md:min-h-[300px]"
          )}
        >
          {hasIcon && game.iconSrc ? (
            <GameIconImage
              src={game.iconSrc}
              alt={game.iconAlt ?? game.title}
              className="object-contain object-center"
              priority
            />
          ) : (
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br",
                game.gradient
              )}
            />
          )}
          <span className="absolute left-3 top-3 rounded-full border border-amber-500/40 bg-black/60 px-3 py-1 text-xs font-medium text-amber-100/95 backdrop-blur-sm">
            Flagship project
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 border-t border-white/10 p-5 sm:p-6 md:border-l md:border-t-0">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {game.title}
            </h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-200/80">
              {game.price}
            </p>
          </div>
          {game.detail ? (
            <p className="neon-sign-body text-sm leading-relaxed">
              {game.detail}
            </p>
          ) : null}
          {game.highlights?.length ? (
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              {game.highlights.map((line, i) => (
                <li key={`${game.id}-hl-${i}`} className="neon-sign-body">
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
          <GameMeta game={game} />
          <GodotDemoEmbed
            demoEnabled={game.demoEnabled}
            demoSlug={game.demoSlug}
            demoTitle={game.demoTitle}
            demoNotes={game.demoNotes}
            demoFallbackHref={game.demoFallbackHref}
          />
          {game.sourceAvailable && (
            <SourceAvailableButton href={game.sourceHref} />
          )}
        </div>
      </div>
    </Card>
  );
}

function GameCard({ game }: { game: GameItem }) {
  const isIconApp = Boolean(game.iconSrc);

  if (isIconApp && game.iconSrc) {
    return (
      <Card className="group overflow-hidden border-white/10 bg-[#050810]/88 backdrop-blur-md transition-all hover:border-white/20">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#06080f]">
          <GameIconImage
            src={game.iconSrc}
            alt={game.iconAlt ?? game.title}
            className="box-border object-contain object-center p-0"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-3 pb-3 pt-16 sm:px-4 sm:pb-4 sm:pt-20">
            <h3 className="text-center text-base font-semibold leading-snug tracking-tight text-white sm:text-lg [text-shadow:0_2px_12px_rgba(0,0,0,0.9),0_0_20px_rgba(0,212,255,0.25)]">
              {game.title}
            </h3>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-white/5 bg-[#03050a]/90 px-4 py-3">
          <p className="text-xs text-muted-foreground">{game.price}</p>
          <GameMeta game={game} />
          <GodotDemoEmbed
            demoEnabled={game.demoEnabled}
            demoSlug={game.demoSlug}
            demoTitle={game.demoTitle}
            demoNotes={game.demoNotes}
            demoFallbackHref={game.demoFallbackHref}
          />
          {game.sourceAvailable && (
            <SourceAvailableButton href={game.sourceHref} />
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden border-white/10 transition-all hover:border-white/20">
      <div className="relative aspect-[3/4] overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {game.title && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-semibold text-white">{game.title}</h3>
          </div>
        )}
      </div>
      <CardFooter className="flex flex-col items-start gap-3 border-t border-white/10 bg-[#03050a]/88 p-4 backdrop-blur-sm">
        <div className="flex w-full flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            {game.price}
          </span>
          <GameMeta game={game} />
          <GodotDemoEmbed
            demoEnabled={game.demoEnabled}
            demoSlug={game.demoSlug}
            demoTitle={game.demoTitle}
            demoNotes={game.demoNotes}
            demoFallbackHref={game.demoFallbackHref}
          />
        </div>
        {game.sourceAvailable && (
          <SourceAvailableButton href={game.sourceHref} />
        )}
      </CardFooter>
    </Card>
  );
}

export function GamesGallery() {
  const spotlight = gamesSection.items.filter((g) => g.featured);
  const gridGames = gamesSection.items
    .filter((g) => !g.featured)
    .sort((a, b) => a.id - b.id);

  return (
    <section
      id="games"
      className="py-16 scroll-mt-24"
      aria-labelledby="games-heading"
    >
      <div className="container mx-auto max-w-6xl px-6">
        <div className="section-glass-panel mb-8 flex flex-col gap-3 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:px-7 md:py-5">
          <h2 id="games-heading" className="text-2xl font-bold text-foreground">
            {gamesSection.sectionTitle}
          </h2>
          <span className="neon-sign-body max-w-xl text-sm leading-snug sm:text-right md:text-base">
            {gamesSection.sectionEyebrow}
          </span>
        </div>
        {spotlight.map((game) => (
          <FeaturedGameSpotlight key={game.id} game={game} />
        ))}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {gridGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </section>
  );
}
