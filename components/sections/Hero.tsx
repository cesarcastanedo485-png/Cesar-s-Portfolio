"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HeroContentProps } from "@/lib/content";
import { useHydrated } from "@/lib/use-hydrated";

type HeroProps = {
  content: HeroContentProps;
};

export function Hero({ content }: HeroProps) {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const allowMotion = hydrated && reduceMotion === false;

  return (
    <section className="relative py-24 text-center" aria-labelledby="hero-heading">
      <div className="container mx-auto max-w-5xl px-6">
        <div className="mx-auto flex max-w-full flex-col items-center rounded-2xl border border-white/12 bg-[#0a0e17]/82 px-5 py-5 shadow-[0_12px_48px_rgba(0,0,0,0.45)] backdrop-blur-md md:px-8 md:py-7">
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
              <span className="hero-neon-title text-5xl md:text-7xl lg:text-8xl">
                {content.titlePart1}
              </span>
              <PortfolioO />
              <span className="hero-neon-title text-5xl md:text-7xl lg:text-8xl">
                {content.titlePart2}
              </span>
            </span>
          </motion.h1>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
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
  const allowMotion = hydrated && reduceMotion === false;

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
          className="drop-shadow-[0_0_10px_rgba(0,212,255,0.65)]"
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
