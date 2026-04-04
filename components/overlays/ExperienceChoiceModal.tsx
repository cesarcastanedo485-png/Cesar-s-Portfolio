"use client";

import { useEffect, useState } from "react";
import { ExperienceChoiceEditor } from "@/components/overlays/ExperienceChoiceEditor";
import { ExperienceChoicePreview } from "@/components/overlays/ExperienceChoicePreview";
import {
  clearExperienceChoiceConfigStorage,
  defaultExperienceChoiceConfig,
  readExperienceChoiceConfigFromStorage,
  sanitizeExperienceChoiceConfig,
  writeExperienceChoiceConfigToStorage,
} from "@/lib/experience-choice-config";
import { useProgression } from "@/lib/progression";

/**
 * First-visit gate: red pill (full Wonderland) vs blue pill (calm Matrix browse).
 * Blocks interaction until a choice is stored in progression localStorage.
 */
export function ExperienceChoiceModal() {
  const { hydrated, experienceMode, chooseExperience, chooseExperienceAndGo } =
    useProgression();
  const [editorMode, setEditorMode] = useState(false);
  const [config, setConfig] = useState(defaultExperienceChoiceConfig);
  const [configReady, setConfigReady] = useState(false);
  const [arpTuneMode, setArpTuneMode] = useState(false);
  const open = hydrated && !arpTuneMode && (experienceMode === null || editorMode);

  useEffect(() => {
    if (!hydrated) return;
    setConfig(readExperienceChoiceConfigFromStorage());
    const params = new URLSearchParams(window.location.search);
    setArpTuneMode(params.get("arpTune") === "1");
    const shouldOpenEditor =
      params.get("choiceEditor") === "1" || window.localStorage.getItem("choiceEditor") === "1";
    if (shouldOpenEditor) setEditorMode(true);
    setConfigReady(true);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    // #region agent log
    fetch("http://127.0.0.1:7531/ingest/a2f6d748-df85-4288-afaf-dcecbfdaa24b", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d3e82a" }, body: JSON.stringify({ sessionId: "d3e82a", runId: "pre-fix-v6", hypothesisId: "H16", location: "ExperienceChoiceModal.tsx:open-gate-d3e82a", message: "experience modal open gate with arpTune mode", data: { hydrated, experienceMode, editorMode, arpTuneMode, open }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
  }, [arpTuneMode, editorMode, experienceMode, hydrated, open]);

  useEffect(() => {
    if (!configReady) return;
    writeExperienceChoiceConfigToStorage(sanitizeExperienceChoiceConfig(config));
  }, [config, configReady]);

  useEffect(() => {
    if (!editorMode) return;
    try {
      window.localStorage.setItem("choiceEditor", "1");
    } catch {
      /* no-op */
    }
  }, [editorMode]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[450] flex items-center justify-center bg-black/92 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="experience-choice-title"
      aria-describedby="experience-choice-desc"
    >
      {editorMode ? (
        <div className="w-full max-w-[1280px]">
          <div className="mb-3 text-center text-xs uppercase tracking-[0.22em] text-white/60">
            Editor mode active
          </div>
          <ExperienceChoiceEditor
            config={config}
            onChange={setConfig}
            onReset={() => {
              clearExperienceChoiceConfigStorage();
              setConfig(defaultExperienceChoiceConfig);
            }}
            onClose={() => {
              setEditorMode(false);
              try {
                window.localStorage.removeItem("choiceEditor");
              } catch {
                /* no-op */
              }
            }}
            onChoose={(mode) => chooseExperience(mode)}
            onChooseAndGo={(path) => chooseExperienceAndGo("matrix", path)}
          />
        </div>
      ) : (
        <ExperienceChoicePreview
          config={config}
          onChoose={(mode) => chooseExperience(mode)}
          onChooseAndGo={(path) => chooseExperienceAndGo("matrix", path)}
        />
      )}
    </div>
  );
}
