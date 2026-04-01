"use client";

import { ProgressionProvider } from "@/lib/progression";
import { LevelUpOverlay } from "@/components/overlays/LevelUpOverlay";

export function ProgressionShell({ children }: { children: React.ReactNode }) {
  return (
    <ProgressionProvider>
      <LevelUpOverlay />
      {children}
    </ProgressionProvider>
  );
}

