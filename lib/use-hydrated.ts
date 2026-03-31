"use client";

import { useEffect, useState } from "react";

/** True only after the client has mounted — matches SSR + first paint, avoiding hydration mismatches. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
