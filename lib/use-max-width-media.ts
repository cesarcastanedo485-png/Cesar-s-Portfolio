"use client";

import { useSyncExternalStore } from "react";

/** Matches Tailwind `md:` breakpoint (mobile-first). */
const MOBILE_MAX_QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_MAX_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_MAX_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/** True when viewport width is at most 767px (typical phone / small tablet). */
export function useIsNarrowViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
