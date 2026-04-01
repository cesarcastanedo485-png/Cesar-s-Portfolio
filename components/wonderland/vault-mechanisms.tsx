"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Cog } from "lucide-react";
import { cn } from "@/lib/utils";

/** Brass corner brackets + rivets — folio “locked” read */
export function WorkVaultMechanismFrame() {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-2xl" aria-hidden>
      <div className="absolute left-2.5 top-2.5 size-6 border-l-2 border-t-2 border-amber-600/45 sm:left-3 sm:top-3 sm:size-7" />
      <div className="absolute bottom-2.5 right-2.5 size-6 border-b-2 border-r-2 border-amber-600/45 sm:bottom-3 sm:right-3 sm:size-7" />
      {[
        [12, 12],
        [12, "calc(100% - 12px)"],
        ["calc(100% - 12px)", 12],
        ["calc(100% - 12px)", "calc(100% - 12px)"],
      ].map(([l, t], i) => (
        <span
          key={i}
          className="absolute size-1 rounded-full bg-amber-500/25 shadow-[0_0_6px_rgba(251,191,36,0.35)]"
          style={{ left: l, top: t, transform: "translate(-50%, -50%)" }}
        />
      ))}
    </div>
  );
}

/** Keyhole plate — turns slightly on hover via parent group */
export function WorkVaultKeyholePlate({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute left-2 top-1/2 hidden -translate-y-1/2 sm:block sm:left-3 md:left-4",
        className
      )}
      aria-hidden
      animate={
        reduceMotion
          ? undefined
          : { rotate: [0, -2, 0, 2, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } }
      }
    >
      <div className="relative flex flex-col items-center rounded-lg border border-amber-700/50 bg-gradient-to-b from-amber-950/90 via-amber-950/70 to-black/80 px-2.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_20px_rgba(0,0,0,0.45)]">
        <div className="mb-1 size-1 rounded-full bg-amber-400/40" />
        <svg
          viewBox="0 0 24 40"
          className="h-11 w-7 text-zinc-950 sm:h-12 sm:w-8"
          fill="currentColor"
        >
          <path d="M12 1.5C6.5 1.5 2 6.2 2 12c0 4.8 3.2 8.8 8 9.8V38h4V21.8c4.8-1 8-5 8-9.8 0-5.8-4.5-10.5-10-10.5Z" />
        </svg>
        <div className="mt-1 size-1 rounded-full bg-amber-400/35" />
      </div>
    </motion.div>
  );
}

/** Slow portal rings + tiny gear — “machinery down the hole” */
export function GamesVaultPortalRings({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 sm:left-[3.75rem] sm:top-1/2 sm:translate-x-0",
        className
      )}
      aria-hidden
    >
      <div className="absolute left-1/2 top-1/2 size-[7.5rem] -translate-x-1/2 -translate-y-1/2 sm:size-36">
        <div className="vault-portal-ring-slow absolute inset-0 rounded-full border border-dashed border-amber-400/28" />
      </div>
      <div className="absolute left-1/2 top-1/2 size-[5.25rem] -translate-x-1/2 -translate-y-1/2 sm:size-28">
        <div className="vault-portal-ring-slow-reverse absolute inset-0 rounded-full border border-amber-300/18" />
      </div>
      <div className="absolute -bottom-5 left-0 text-amber-400/28 motion-reduce:opacity-50 sm:-bottom-6 sm:-left-1">
        <Cog className="vault-cog-tick size-5 sm:size-6" strokeWidth={1.25} />
      </div>
    </div>
  );
}
