"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SPARKLE_COUNT = 24;

type SparkleSpec = {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  hue: "white" | "cyan" | "magenta" | "gold";
};

function hashSeed(id: string, i: number) {
  let h = 0;
  const s = `${id}-${i}`;
  for (let j = 0; j < s.length; j++) {
    h = Math.imul(31, h) + s.charCodeAt(j);
  }
  return Math.abs(h);
}

function makeSpecs(id: string): SparkleSpec[] {
  const hues: SparkleSpec["hue"][] = ["white", "cyan", "magenta", "gold"];
  return Array.from({ length: SPARKLE_COUNT }, (_, i) => {
    const h = hashSeed(id, i);
    return {
      left: (h % 97) + 1.5,
      top: (Math.floor(h / 97) % 94) + 3,
      size: 2 + (h % 4) * 0.75,
      delay: (h % 2800) / 1000,
      duration: 2.2 + (h % 2200) / 1000,
      hue: hues[h % hues.length]!,
    };
  });
}

const hueClass: Record<SparkleSpec["hue"], string> = {
  white: "bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]",
  cyan: "bg-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.85)]",
  magenta: "bg-fuchsia-200 shadow-[0_0_8px_rgba(232,121,249,0.8)]",
  gold: "bg-amber-200 shadow-[0_0_7px_rgba(251,191,36,0.75)]",
};

type SectionSparklesProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Wraps a block; when it enters view, twinkling particles play at ~half-disco intensity.
 */
export function SectionSparkles({ children, className }: SectionSparklesProps) {
  const reduceMotion = useReducedMotion();
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  const specs = useMemo(() => makeSpecs(id), [id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (reduceMotion === true || !mounted) {
      return;
    }
    const el = wrapRef.current;
    if (!el) {
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => setActive(e?.isIntersecting ?? false),
      { root: null, threshold: 0.06, rootMargin: "-2% 0px -2% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, reduceMotion]);

  return (
    <div ref={wrapRef} className={cn("relative isolate", className)}>
      {reduceMotion !== true && mounted ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden
        >
          {specs.map((s, i) => (
            <span
              key={`${id}-sp-${i}`}
              className={cn(
                "sparkle-dust absolute rounded-full mix-blend-screen will-change-[opacity,transform]",
                hueClass[s.hue],
                active ? "sparkle-dust--on" : "sparkle-dust--idle",
              )}
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
              }}
            />
          ))}
        </div>
      ) : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
