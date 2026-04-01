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
import { useProgression } from "@/lib/progression";

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

/** Fills the section — use for quote block only. */
function makeScatterSpecs(id: string): SparkleSpec[] {
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

/** Hug left/right (and light top/bottom) edges of the wrapper. */
function makeFrameSpecs(id: string): SparkleSpec[] {
  const hues: SparkleSpec["hue"][] = ["white", "cyan", "magenta", "gold"];
  const specs: SparkleSpec[] = [];
  let k = 0;
  for (let i = 0; i < 10; i++) {
    const h = hashSeed(id, k++);
    specs.push({
      left: 0.4 + (h % 45) / 12,
      top: 7 + (i / 9) * 84 + (h % 6) * 0.35,
      size: 2 + (h % 4) * 0.75,
      delay: (h % 2800) / 1000,
      duration: 2.2 + (h % 2200) / 1000,
      hue: hues[h % hues.length]!,
    });
  }
  for (let i = 0; i < 10; i++) {
    const h = hashSeed(id, k++);
    specs.push({
      left: 94.2 + (h % 42) / 12,
      top: 7 + (i / 9) * 84 + (h % 6) * 0.35,
      size: 2 + (h % 4) * 0.75,
      delay: (h % 2600) / 1000,
      duration: 2.1 + (h % 2100) / 1000,
      hue: hues[(h + 1) % hues.length]!,
    });
  }
  for (let i = 0; i < 4; i++) {
    const h = hashSeed(id, k++);
    const topBand = i < 2;
    specs.push({
      left: 8 + (h % 84),
      top: topBand ? 1.2 + (h % 5) * 0.8 : 92.5 + (h % 5) * 0.9,
      size: 2 + (h % 3) * 0.85,
      delay: (h % 2400) / 1000,
      duration: 2.3 + (h % 1900) / 1000,
      hue: hues[(h + 2) % hues.length]!,
    });
  }
  return specs;
}

const hueClass: Record<SparkleSpec["hue"], string> = {
  white: "bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]",
  cyan: "bg-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.85)]",
  magenta: "bg-fuchsia-200 shadow-[0_0_8px_rgba(232,121,249,0.8)]",
  gold: "bg-amber-200 shadow-[0_0_7px_rgba(251,191,36,0.75)]",
};

type SparkleLayout = "frame" | "scatter";

type SectionSparklesProps = {
  children: ReactNode;
  className?: string;
  /** `frame` = sparkles along vertical edges; `scatter` = full-area (e.g. quote). */
  layout?: SparkleLayout;
};

/**
 * Wraps a block; when it enters view, twinkling particles play at ~half-disco intensity.
 */
export function SectionSparkles({
  children,
  className,
  layout = "frame",
}: SectionSparklesProps) {
  const { isMatrixMode } = useProgression();
  const reduceMotion = useReducedMotion();
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  const specs = useMemo(
    () =>
      layout === "scatter" ? makeScatterSpecs(id) : makeFrameSpecs(id),
    [id, layout],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (reduceMotion === true || isMatrixMode || !mounted) {
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
  }, [mounted, reduceMotion, isMatrixMode]);

  return (
    <div ref={wrapRef} className={cn("relative isolate", className)}>
      {reduceMotion !== true && !isMatrixMode && mounted ? (
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
