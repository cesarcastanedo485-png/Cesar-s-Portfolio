"use client";

import { useReducedMotion } from "framer-motion";
import { useHydrated } from "@/lib/use-hydrated";

type SiteBackgroundVideoProps = {
  mp4Src?: string;
  posterSrc?: string;
};

/** Full-viewport loop behind the page. Respects reduced motion (static poster or off). */
export function SiteBackgroundVideo({
  mp4Src,
  posterSrc,
}: SiteBackgroundVideoProps) {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const src = mp4Src?.trim();
  const poster = posterSrc?.trim();

  if (!src) {
    return null;
  }

  const preferStill = !hydrated || reduceMotion === true;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      aria-hidden
    >
      {preferStill && poster ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- poster is optional decorative full-bleed */}
          <img
            src={poster}
            alt=""
            className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17]/82 via-[#0a0e17]/76 to-[#000]/88" />
        </>
      ) : null}
      {!preferStill ? (
        <>
          <video
            className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover will-change-transform"
            src={src}
            poster={poster || undefined}
            muted
            playsInline
            autoPlay
            loop
            preload="auto"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17]/82 via-[#0a0e17]/76 to-[#000]/88" />
        </>
      ) : null}
      {preferStill && !poster ? (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17] to-[#000]" />
      ) : null}
    </div>
  );
}
