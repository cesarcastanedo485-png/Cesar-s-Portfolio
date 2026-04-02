"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HeroContentProps } from "@/lib/content";
import { useHydrated } from "@/lib/use-hydrated";
import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";

type HeroProps = {
  content: HeroContentProps;
};

export function Hero({ content }: HeroProps) {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const { isMatrixMode } = useProgression();
  const allowMotion = hydrated && reduceMotion === false && !isMatrixMode;

  return (
    <section className="relative py-16 text-center sm:py-24" aria-labelledby="hero-heading">
      <div className="container mx-auto max-w-sm px-4 sm:max-w-xl sm:px-5 md:max-w-3xl md:px-6 lg:max-w-4xl xl:max-w-5xl">
        <div
          className={cn(
            "mx-auto flex max-w-full flex-col items-center rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 md:px-8 md:py-7",
            isMatrixMode
              ? "border-white/10 bg-[#0f172a]/90 shadow-sm backdrop-blur-sm"
              : "border-white/12 bg-[#0a0e17]/82 shadow-[0_12px_48px_rgba(0,0,0,0.45)] backdrop-blur-md",
          )}
        >
          <motion.h1
            id="hero-heading"
            className="mb-3 flex w-full flex-col items-center justify-center md:mb-4"
            animate={
              allowMotion
                ? {
                    scale: [1, 1.008, 1],
                    opacity: [0.98, 1, 0.98],
                  }
                : undefined
            }
            transition={{
              duration: 3.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="sr-only">{content.screenReaderTitle}</span>
            <span
              aria-hidden
              className="hero-neon-glow inline-flex flex-wrap items-center justify-center gap-x-1 sm:flex-nowrap sm:gap-x-1.5"
            >
              <span className="hero-neon-title text-4xl sm:text-5xl md:text-7xl lg:text-8xl">
                {content.titlePart1}
              </span>
              <PortfolioO />
              <span className="hero-neon-title text-4xl sm:text-5xl md:text-7xl lg:text-8xl">
                {content.titlePart2}
              </span>
            </span>
          </motion.h1>
          <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg md:text-xl">
            {content.tagline}
          </p>
        </div>
      </div>
    </section>
  );
}

function PortfolioO() {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const { isMatrixMode } = useProgression();
  const allowMotion = hydrated && reduceMotion === false && !isMatrixMode;

  return (
    <motion.span
      className="relative inline-flex shrink-0 items-center justify-center self-center"
      animate={allowMotion ? { rotate: 360 } : undefined}
      transition={
        allowMotion
          ? { duration: 20, repeat: Infinity, ease: "linear" }
          : undefined
      }
    >
      <svg
        width="0.9em"
        height="0.9em"
        viewBox="0 0 64 64"
        className="text-[0.9em] align-middle"
        aria-hidden
      >
        <defs>
          <linearGradient
            id="ringGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="50%" stopColor="#ff00aa" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="24"
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r="24"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2"
          strokeDasharray="4 4"
          transform="rotate(-45 32 32)"
        />
      </svg>
    </motion.span>
  );
}
