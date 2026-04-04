"use client";

import { useEffect, useState } from "react";
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
  const [arpTuneMode, setArpTuneMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const syncArpTuneMode = () => {
      const tuneEnabled = new URLSearchParams(window.location.search).get("arpTune") === "1";
      setArpTuneMode(tuneEnabled);
    };
    syncArpTuneMode();
    window.addEventListener("popstate", syncArpTuneMode);
    // #region agent log
    fetch("http://127.0.0.1:7531/ingest/a2f6d748-df85-4288-afaf-dcecbfdaa24b", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d3e82a" }, body: JSON.stringify({ sessionId: "d3e82a", runId: "pre-fix-v8", hypothesisId: "H18", location: "ProgressionShell.tsx:arpTuneOverlayGate", message: "global overlay gate for arpTune", data: { tuneEnabled: new URLSearchParams(window.location.search).get("arpTune") === "1" }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
    return () => window.removeEventListener("popstate", syncArpTuneMode);
  }, []);

  return (
    <ProgressionProvider>
      <GlobalAtmosphereAudioProvider audioSrc={audioSrc}>
        <SyncMatrixHtmlClass />
        {!arpTuneMode ? <GlobalAtmosphereAudioDock /> : null}
        {!arpTuneMode ? <ExperienceChoiceModal /> : null}
        {!arpTuneMode ? <LevelUpOverlay /> : null}
        {children}
      </GlobalAtmosphereAudioProvider>
    </ProgressionProvider>
  );
}

