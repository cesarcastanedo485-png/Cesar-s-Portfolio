"use client";

import { ProgressionProvider } from "@/lib/progression";
import { ExperienceChoiceModal } from "@/components/overlays/ExperienceChoiceModal";
import { LevelUpOverlay } from "@/components/overlays/LevelUpOverlay";
import { SyncMatrixHtmlClass } from "@/components/progression/SyncMatrixHtmlClass";
import {
  GlobalAtmosphereAudioDock,
  GlobalAtmosphereAudioProvider,
} from "@/components/audio/GlobalAtmosphereAudio";
import { site } from "@/lib/content";

export function ProgressionShell({ children }: { children: React.ReactNode }) {
  const audioSrc = site.audioReactiveBackground?.audioSrc?.trim() ?? "";

  return (
    <ProgressionProvider>
      <GlobalAtmosphereAudioProvider audioSrc={audioSrc}>
        <SyncMatrixHtmlClass />
        <GlobalAtmosphereAudioDock />
        <ExperienceChoiceModal />
        <LevelUpOverlay />
        {children}
      </GlobalAtmosphereAudioProvider>
    </ProgressionProvider>
  );
}

