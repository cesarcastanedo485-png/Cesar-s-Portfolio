"use client";

import Link from "next/link";
import { Card, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useState,
  type ImgHTMLAttributes,
} from "react";
import {
  gamesSection,
  type GameItem,
  type WonderlandVaultCopy,
} from "@/lib/content";
import { WonderlandVault } from "@/components/wonderland/WonderlandVault";
import { useHydrated } from "@/lib/use-hydrated";
import { useProgression } from "@/lib/progression";
import { GodotDemoEmbed } from "@/components/sections/GodotDemoEmbed";
import { CardDetailsDisclosure } from "@/components/ui/card-details-disclosure";

function gameDemoEmbedProps(game: GameItem) {
  return {
    demoEnabled: game.demoEnabled,
    demoSlug: game.demoSlug,
    demoUrl: game.demoUrl,
    demoTitle: game.demoTitle,
    demoNotes: game.demoNotes,
    demoFallbackHref: game.demoFallbackHref,
    requiresProgression: game.demoRequiresProgression !== false,
    defaultOpen: game.demoDefaultOpen === true,
  };
}

/** Always-visible demo player (not hidden inside Details). Anchor: #demo-<demoSlug> */
function GameDemoPanel({ game, className }: { game: GameItem; className?: string }) {
  if (!game.demoEnabled || (!game.demoSlug?.trim() && !game.demoUrl?.trim())) return null;
  const anchor = game.demoSlug?.trim() || `game-${game.id}`;
  return (
    <div id={`demo-${anchor}`} className={cn("scroll-mt-28", className)}>
      <GodotDemoEmbed {...gameDemoEmbedProps(game)} />
    </div>
  );
}

const DEFAULT_GAMES_VAULT: WonderlandVaultCopy = {
  teaserTitle: "Down the rabbit hole",
  teaserBody: "Stream-first games and demos hide here until you open the vault.",
  ctaClosed: "Trace the spiral",
  ctaOpen: "Lock the rabbit hole",
  accessHint: "Games stay sealed until you open this passage.",
  footnote: "React · WebSockets · live-audience UX",
};

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
  const { isMatrixMode } = useProgression();
  const allowMotion = hydrated && reduceMotion === false && !isMatrixMode;

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
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setTriedAlt(false);
    setBroken(false);
  }, [src]);

  const fallbackSrc = useMemo(() => getAltIconSrc(src), [src]);

  if (broken) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex size-full items-center justify-center bg-gradient-to-br from-white/10 to-white/5 object-center",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <span className="px-3 text-center text-xs font-medium text-white/50">
          Icon missing — add the file under <code className="text-white/70">public</code> or
          fix <code className="text-white/70">iconSrc</code> in content.
        </span>
      </div>
    );
  }

  return (
    // Local assets under /public — plain <img> avoids Next/Image + SVG/fill edge cases (blank tiles on some setups).
    <img
      key={currentSrc}
      src={currentSrc}
      alt={alt}
      width={128}
      height={128}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      {...(priority ? ({ fetchPriority: "high" } as ImgHTMLAttributes<HTMLImageElement>) : {})}
      className={cn("absolute inset-0 size-full object-contain object-center", className)}
      onError={() => {
        if (!triedAlt && fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          setTriedAlt(true);
          return;
        }
        setBroken(true);
      }}
    />
  );
}

function FeaturedGameSpotlight({ game }: { game: GameItem }) {
  const hasIcon = Boolean(game.iconSrc);

  return (
    <Card className="mb-6 overflow-hidden border-amber-500/25 bg-black shadow-[0_0_0_1px_rgba(245,158,11,0.12)] transition-all hover:border-amber-500/35">
      <div className="flex flex-col bg-black md:flex-row md:items-stretch">
        <div
          className={cn(
            "relative isolate min-h-[220px] bg-[#030508] md:w-[min(42%,420px)] md:shrink-0",
            "aspect-[3/4] max-md:max-h-[420px] max-md:w-full md:aspect-auto md:max-h-none md:min-h-[300px]"
          )}
        >
          {hasIcon && game.iconSrc ? (
            <GameIconImage
              src={game.iconSrc}
              alt={game.iconAlt ?? game.title}
              className="object-contain object-center drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]"
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
        <div className="flex flex-1 flex-col gap-3 border-t border-white/10 bg-black p-5 sm:p-6 md:border-l md:border-t-0">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {game.title}
            </h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-200/80">
              {game.price}
            </p>
          </div>
          <CardDetailsDisclosure disclosureId={`game-details-${game.id}`}>
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
            {game.sourceAvailable && (
              <SourceAvailableButton href={game.sourceHref} />
            )}
          </CardDetailsDisclosure>
        </div>
      </div>
      {game.demoEnabled ? (
        <div className="border-t border-white/10 bg-black px-4 py-4 sm:px-6">
          <GameDemoPanel game={game} />
        </div>
      ) : null}
    </Card>
  );
}

function GameCard({ game }: { game: GameItem }) {
  const isIconApp = Boolean(game.iconSrc);

  if (isIconApp && game.iconSrc) {
    return (
      <Card className="group overflow-hidden border-white/10 bg-black transition-all hover:border-white/20">
        <div className="relative isolate aspect-[3/4] overflow-hidden bg-[#030508]">
          <GameIconImage
            src={game.iconSrc}
            alt={game.iconAlt ?? game.title}
            className="box-border object-contain object-center p-0 drop-shadow-[0_0_14px_rgba(255,255,255,0.16)]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-3 pb-3 pt-16 sm:px-4 sm:pb-4 sm:pt-20">
            <h3 className="text-center text-base font-semibold leading-snug tracking-tight text-white sm:text-lg [text-shadow:0_2px_12px_rgba(0,0,0,0.9),0_0_20px_rgba(0,212,255,0.25)]">
              {game.title}
            </h3>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 bg-black px-4 py-3">
          <p className="text-xs text-muted-foreground">{game.price}</p>
          <GameDemoPanel game={game} />
          <CardDetailsDisclosure disclosureId={`game-details-${game.id}`}>
            <GameMeta game={game} />
            {game.sourceAvailable && (
              <SourceAvailableButton href={game.sourceHref} />
            )}
          </CardDetailsDisclosure>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden border-white/10 bg-black transition-all hover:border-white/20">
      <div className="relative aspect-[3/4] overflow-hidden bg-black">
        <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {game.title && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-semibold text-white">{game.title}</h3>
          </div>
        )}
      </div>
      <CardFooter className="flex flex-col items-start gap-2 border-t border-white/10 bg-black p-4">
        <span className="text-sm font-medium text-foreground">{game.price}</span>
        <GameDemoPanel className="w-full" game={game} />
        <CardDetailsDisclosure disclosureId={`game-details-${game.id}`}>
          <GameMeta game={game} />
          {game.sourceAvailable && (
            <SourceAvailableButton href={game.sourceHref} />
          )}
        </CardDetailsDisclosure>
      </CardFooter>
    </Card>
  );
}

export function GamesGallery() {
  const appPackagesTeaser = gamesSection.appPackagesTeaser;
  const vaultCopy = gamesSection.vault ?? DEFAULT_GAMES_VAULT;
  const spotlight = gamesSection.items.filter((g) => g.featured);
  const gridGames = gamesSection.items
    .filter((g) => !g.featured)
    .sort((a, b) => a.id - b.id);

  const showGamesHeading = Boolean(gamesSection.sectionTitle?.trim());

  return (
    <section
      id="games"
      className="py-16 scroll-mt-24"
      aria-labelledby={showGamesHeading ? "games-heading" : undefined}
      aria-label={showGamesHeading ? undefined : "Games"}
    >
      <div className="container mx-auto max-w-6xl px-6">
        {showGamesHeading ? (
          <div className="section-glass-panel mb-8 flex flex-col px-5 py-4 md:px-7 md:py-5">
            <h2 id="games-heading" className="text-2xl font-bold text-foreground">
              {gamesSection.sectionTitle}
            </h2>
          </div>
        ) : null}
        {gamesSection.builderTeaser?.href?.trim() &&
        gamesSection.builderTeaser.label?.trim() ? (
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-fuchsia-100/85">
            {gamesSection.builderTeaser.text}{" "}
            <Link
              href={gamesSection.builderTeaser.href}
              className="font-medium text-fuchsia-200 underline decoration-fuchsia-500/45 underline-offset-2 hover:text-fuchsia-50 hover:decoration-fuchsia-400/70 focus-visible:outline focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e17]"
            >
              {gamesSection.builderTeaser.label}
            </Link>
            .
          </p>
        ) : null}
        {appPackagesTeaser?.href?.trim() && appPackagesTeaser.label?.trim() ? (
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-emerald-100/85">
            {appPackagesTeaser.text}{" "}
            <Link
              href={appPackagesTeaser.href}
              className="font-medium text-emerald-200 underline decoration-emerald-500/45 underline-offset-2 hover:text-emerald-50 hover:decoration-emerald-400/70 focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e17]"
            >
              {appPackagesTeaser.label}
            </Link>
            .
          </p>
        ) : null}
        <WonderlandVault
          variant="games"
          panelId="games-vault-panel"
          copy={vaultCopy}
          overview={gamesSection.sectionEyebrow?.trim() || undefined}
          minimalClosedLayout
        >
          <>
            {spotlight.map((game) => (
              <FeaturedGameSpotlight key={game.id} game={game} />
            ))}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {gridGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </>
        </WonderlandVault>
      </div>
    </section>
  );
}
