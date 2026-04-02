"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";

type FloatingPortal = {
  href: "/oracle-3d" | "/social" | "/apps";
  label: string;
  unlocked: boolean;
  className: string;
  motionClassName: string;
  drift: { x: number[]; y: number[]; duration: number; delay: number };
};

export function AlaCarteFloatingButtons() {
  const { hydrated, experienceMode, redPillUnlocks } = useProgression();
  const reduceMotion = useReducedMotion();
  if (!hydrated || experienceMode !== "wonderland") return null;

  const portals: FloatingPortal[] = [
    {
      href: "/oracle-3d",
      label: "Website portal",
      unlocked: redPillUnlocks.oracle,
      className:
        "border-cyan-400/40 bg-cyan-950/45 text-cyan-100 hover:border-cyan-300/55 hover:bg-cyan-900/55",
      motionClassName: "left-[7%] top-[18%] sm:left-[11%] sm:top-[24%]",
      drift: { x: [0, 10, -8, 0], y: [0, -12, 8, 0], duration: 16, delay: 0.4 },
    },
    {
      href: "/social",
      label: "Social portal",
      unlocked: redPillUnlocks.social,
      className:
        "border-pink-400/40 bg-pink-950/45 text-pink-100 hover:border-pink-300/55 hover:bg-pink-900/55",
      motionClassName: "right-[9%] top-[30%] sm:right-[15%] sm:top-[32%]",
      drift: { x: [0, -10, 8, 0], y: [0, 9, -10, 0], duration: 18, delay: 0.1 },
    },
    {
      href: "/apps",
      label: "Android portal",
      unlocked: redPillUnlocks.apps,
      className:
        "border-emerald-400/40 bg-emerald-950/45 text-emerald-100 hover:border-emerald-300/55 hover:bg-emerald-900/55",
      motionClassName: "left-[26%] bottom-[13%] sm:left-[34%] sm:bottom-[18%]",
      drift: { x: [0, 12, -7, 0], y: [0, 7, -8, 0], duration: 17, delay: 0.8 },
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-30" aria-hidden>
      {portals
        .filter((portal) => portal.unlocked)
        .map((portal) => (
          <motion.div
            key={portal.href}
            className={cn("pointer-events-auto absolute", portal.motionClassName)}
            animate={
              reduceMotion
                ? undefined
                : {
                    x: portal.drift.x,
                    y: portal.drift.y,
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: portal.drift.duration,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                    delay: portal.drift.delay,
                  }
            }
          >
            <Link
              href={portal.href}
              className={cn(
                "inline-flex rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] shadow-[0_0_24px_rgba(0,0,0,0.38)] backdrop-blur-md transition",
                portal.className,
              )}
            >
              {portal.label}
            </Link>
          </motion.div>
        ))}
    </div>
  );
}
