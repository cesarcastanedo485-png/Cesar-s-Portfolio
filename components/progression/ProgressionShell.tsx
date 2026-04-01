"use client";

import { ProgressionProvider } from "@/lib/progression";
import { ExperienceChoiceModal } from "@/components/overlays/ExperienceChoiceModal";
import { LevelUpOverlay } from "@/components/overlays/LevelUpOverlay";
import { SyncMatrixHtmlClass } from "@/components/progression/SyncMatrixHtmlClass";

export function ProgressionShell({ children }: { children: React.ReactNode }) {
  return (
    <ProgressionProvider>
      <SyncMatrixHtmlClass />
      <ExperienceChoiceModal />
      <LevelUpOverlay />
      {children}
    </ProgressionProvider>
  );
}

