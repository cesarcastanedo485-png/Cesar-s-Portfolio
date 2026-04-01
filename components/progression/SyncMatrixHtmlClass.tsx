"use client";

import { useEffect } from "react";
import { useProgression } from "@/lib/progression";

/** Toggles `matrix-mode` on `<html>` for global CSS that simplifies neon / motion. */
export function SyncMatrixHtmlClass() {
  const { hydrated, experienceMode } = useProgression();

  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return;
    const el = document.documentElement;
    if (experienceMode === "matrix") {
      el.classList.add("matrix-mode");
    } else {
      el.classList.remove("matrix-mode");
    }
    return () => {
      el.classList.remove("matrix-mode");
    };
  }, [hydrated, experienceMode]);

  return null;
}
