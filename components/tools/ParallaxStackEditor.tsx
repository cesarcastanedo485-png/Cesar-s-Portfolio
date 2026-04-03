"use client";

import { useMemo, useState } from "react";
import {
  BG_PANORAMA_MIN_WIDTH_VW,
  BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
  MOBILE_ARP_SHIFT_END_VW,
  MOBILE_ARP_SHIFT_START_VW,
  panoramaScrollRangeVw,
} from "@/lib/background-parallax";
import {
  type EditorArpTune,
  type EditorDraft,
  PARALLAX_EDITOR_DRAFT_KEY,
} from "@/lib/parallax-editor";

type EditorSeed = {
  imageSrc: string;
  beatFlashImageSrc: string;
  beatFlashOpacityGain: number;
  mushroomImageSrc: string;
  rainVideoSrc: string;
  rainVideoBlend: "normal" | "screen" | "plus-lighter";
  rainVideoKey: "none" | "luma";
  rainVideoLumaThreshold: number;
  rainVideoLumaSoften: number;
  rainVideoLumaCeiling: number;
  rainVideoLumaCeilingSoften: number;
  foregroundSmokeEnabled: boolean;
  foregroundSmokeIntensity: "low" | "default" | "high";
};

const defaultMobile: EditorArpTune = {
  widthVw: BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
  startVw: MOBILE_ARP_SHIFT_START_VW,
  endVw: MOBILE_ARP_SHIFT_END_VW,
  objectPosX: 2,
  objectPosY: 0,
  snapToEndWithinPx: 220,
  pulseScale: 0,
};

const defaultDesktop: EditorArpTune = {
  widthVw: BG_PANORAMA_MIN_WIDTH_VW,
  startVw: 0,
  endVw: -panoramaScrollRangeVw(BG_PANORAMA_MIN_WIDTH_VW),
  objectPosX: 0,
  objectPosY: 0,
  snapToEndWithinPx: 0,
  pulseScale: 0.1,
};

export function ParallaxStackEditor({ seed }: { seed: EditorSeed }) {
  const [draft, setDraft] = useState<EditorDraft>({
    profile: "mobile",
    arp: {
      mobile: defaultMobile,
      desktop: defaultDesktop,
    },
    layers: {
      baseImageSrc: seed.imageSrc,
      beatFlashImageSrc: seed.beatFlashImageSrc,
      beatFlashOpacityGain: seed.beatFlashOpacityGain,
      smokeImageSrc: seed.mushroomImageSrc,
      rainVideoSrc: seed.rainVideoSrc,
      rainVideoBlend: seed.rainVideoBlend,
      rainVideoKey: seed.rainVideoKey,
      rainVideoLumaThreshold: seed.rainVideoLumaThreshold,
      rainVideoLumaSoften: seed.rainVideoLumaSoften,
      rainVideoLumaCeiling: seed.rainVideoLumaCeiling,
      rainVideoLumaCeilingSoften: seed.rainVideoLumaCeilingSoften,
      atmosphereMistLayers: true,
      foregroundSmokeEnabled: seed.foregroundSmokeEnabled,
      foregroundSmokeIntensity: seed.foregroundSmokeIntensity,
    },
  });
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [runningChecks, setRunningChecks] = useState(false);
  const activeTune = draft.profile === "mobile" ? draft.arp.mobile : draft.arp.desktop;

  const previewUrl = useMemo(() => "/?arpPreview=1", []);
  const guidedAnchorUrl = useMemo(() => "/?arpTune=1", []);

  const setTune = (patch: Partial<EditorArpTune>) => {
    setDraft((prev) => ({
      ...prev,
      arp: {
        ...prev.arp,
        [prev.profile]: {
          ...activeTune,
          ...patch,
        },
      },
    }));
  };

  const saveDraft = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PARALLAX_EDITOR_DRAFT_KEY, JSON.stringify(draft));
    window.localStorage.setItem("arp-mobile-tune-v1", JSON.stringify(draft.arp));
    setStatus("Draft saved locally. Preview now uses this config.");
  };

  const startPreview = () => {
    saveDraft();
    window.location.href = previewUrl;
  };

  const stopPreview = () => {
    window.location.href = "/";
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setStatus("Uploading...");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/parallax-assets", { method: "POST", body });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) {
        throw new Error(data.error ?? "Upload failed");
      }
      setDraft((prev) => ({ ...prev, layers: { ...prev.layers, baseImageSrc: data.path } }));
      setStatus(`Uploaded: ${data.path}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const publish = async () => {
    saveDraft();
    setStatus("Publishing to content/portfolio.json...");
    try {
      const res = await fetch("/api/parallax-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Publish failed");
      }
      setStatus("Published to content/portfolio.json");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Publish failed");
    }
  };

  const warnings = useMemo(() => {
    const list: string[] = [];
    const mobile = draft.arp.mobile;
    const desktop = draft.arp.desktop;
    if (!draft.layers.baseImageSrc?.trim()) {
      list.push("Base image path is empty.");
    }
    if (
      draft.layers.baseImageSrc &&
      !draft.layers.baseImageSrc.startsWith("/") &&
      !draft.layers.baseImageSrc.startsWith("http")
    ) {
      list.push("Base image should start with '/' or 'http'.");
    }
    if (
      draft.layers.rainVideoSrc &&
      !draft.layers.rainVideoSrc.startsWith("/") &&
      !draft.layers.rainVideoSrc.startsWith("http")
    ) {
      list.push("Rain video should start with '/' or 'http'.");
    }
    if (Math.abs(mobile.startVw - mobile.endVw) < 2) {
      list.push("Mobile start/end anchors are almost identical.");
    }
    if (Math.abs(desktop.startVw - desktop.endVw) < 2) {
      list.push("Desktop start/end anchors are almost identical.");
    }
    if (mobile.widthVw < 125) {
      list.push("Mobile widthVw is very zoomed in and may crop head/tail.");
    }
    if (mobile.objectPosY < -20 || mobile.objectPosY > 30) {
      list.push("Mobile objectPosY is extreme and may create black bands.");
    }
    return list;
  }, [draft]);

  const runHealthChecks = async () => {
    setRunningChecks(true);
    setStatus("Running system checks...");
    const results: string[] = [];
    try {
      if (typeof window === "undefined") {
        results.push("Window unavailable.");
      } else {
        try {
          window.localStorage.setItem("__arp_check__", "ok");
          window.localStorage.removeItem("__arp_check__");
          results.push("Local storage: OK");
        } catch {
          results.push("Local storage: failed");
        }
      }

      const publishPing = await fetch("/api/parallax-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (publishPing.ok) {
        results.push("Publish API: OK");
      } else {
        results.push(`Publish API: ${publishPing.status}`);
      }
    } catch {
      results.push("Publish API: request failed");
    } finally {
      setRunningChecks(false);
    }

    const warningLine = warnings.length
      ? `Warnings: ${warnings.length} (${warnings.join(" | ")})`
      : "Warnings: none";
    setStatus(`${results.join(" | ")} | ${warningLine}`);
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-3 pb-24 text-white md:p-4">
      <h1 className="text-xl font-semibold md:text-2xl">Parallax Stack Editor</h1>
      <p className="text-sm text-white/70">
        Mobile and desktop profiles are independent. Use Preview first, then Publish.
      </p>

      <section className="sticky top-2 z-20 rounded-xl border border-cyan-300/20 bg-black/80 p-3 shadow-xl backdrop-blur">
        <p className="mb-2 text-xs text-cyan-100">
          Quick actions (mobile-safe): saves draft before preview.
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <button type="button" className="rounded-md bg-cyan-600 px-3 py-2" onClick={saveDraft}>
            Save Draft
          </button>
          <button type="button" className="rounded-md bg-emerald-600 px-3 py-2" onClick={startPreview}>
            Preview
          </button>
          <button type="button" className="rounded-md bg-white/15 px-3 py-2" onClick={stopPreview}>
            Exit Preview
          </button>
          <button
            type="button"
            className="rounded-md bg-fuchsia-600 px-3 py-2"
            onClick={publish}
          >
            Publish JSON
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-white/15 bg-black/40 p-3">
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            className={`rounded px-3 py-1 ${draft.profile === "mobile" ? "bg-cyan-500/70" : "bg-white/15"}`}
            onClick={() => setDraft((prev) => ({ ...prev, profile: "mobile" }))}
          >
            Mobile Profile
          </button>
          <button
            type="button"
            className={`rounded px-3 py-1 ${draft.profile === "desktop" ? "bg-cyan-500/70" : "bg-white/15"}`}
            onClick={() => setDraft((prev) => ({ ...prev, profile: "desktop" }))}
          >
            Desktop Profile
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs">
            widthVw {activeTune.widthVw}
            <input
              className="w-full"
              type="range"
              min={120}
              max={260}
              step={1}
              value={activeTune.widthVw}
              onChange={(e) => setTune({ widthVw: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs">
            startVw {activeTune.startVw}
            <input
              className="w-full"
              type="range"
              min={-180}
              max={120}
              step={1}
              value={activeTune.startVw}
              onChange={(e) => setTune({ startVw: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs">
            endVw {activeTune.endVw}
            <input
              className="w-full"
              type="range"
              min={-220}
              max={120}
              step={1}
              value={activeTune.endVw}
              onChange={(e) => setTune({ endVw: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs">
            objectPosY {activeTune.objectPosY}
            <input
              className="w-full"
              type="range"
              min={-30}
              max={40}
              step={1}
              value={activeTune.objectPosY}
              onChange={(e) => setTune({ objectPosY: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            className="rounded bg-white/15 px-3 py-2"
            onClick={() => window.location.assign(guidedAnchorUrl)}
          >
            Open Guided Anchor Tool
          </button>
          <button
            type="button"
            className="rounded bg-white/15 px-3 py-2"
            onClick={runHealthChecks}
            disabled={runningChecks}
          >
            {runningChecks ? "Checking..." : "Run Health Check"}
          </button>
        </div>
      </section>

      <details className="rounded-lg border border-white/15 bg-black/40 p-3" open>
        <summary className="cursor-pointer text-sm font-semibold">Layer Controls</summary>
        <p className="mb-2 mt-1 text-xs text-white/60">
          Keep paths repo-relative (ex: /backgrounds/my-file.png).
        </p>
        <h2 className="mb-2 text-sm font-semibold">Layer Controls</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs">
            Base image path
            <input
              value={draft.layers.baseImageSrc ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  layers: { ...prev.layers, baseImageSrc: e.target.value },
                }))
              }
              className="w-full rounded border border-white/25 bg-black/40 px-2 py-1"
            />
          </label>
          <label className="text-xs">
            Beat flash image path
            <input
              value={draft.layers.beatFlashImageSrc ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  layers: { ...prev.layers, beatFlashImageSrc: e.target.value },
                }))
              }
              className="w-full rounded border border-white/25 bg-black/40 px-2 py-1"
            />
          </label>
          <label className="text-xs">
            Rain video path
            <input
              value={draft.layers.rainVideoSrc ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  layers: { ...prev.layers, rainVideoSrc: e.target.value },
                }))
              }
              className="w-full rounded border border-white/25 bg-black/40 px-2 py-1"
            />
          </label>
          <label className="text-xs">
            Foreground smoke intensity
            <select
              value={draft.layers.foregroundSmokeIntensity ?? "default"}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  layers: {
                    ...prev.layers,
                    foregroundSmokeIntensity: e.target.value as "low" | "default" | "high",
                  },
                }))
              }
              className="w-full rounded border border-white/25 bg-black/40 px-2 py-1"
            >
              <option value="low">low</option>
              <option value="default">default</option>
              <option value="high">high</option>
            </select>
          </label>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.layers.atmosphereMistLayers ?? true}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  layers: { ...prev.layers, atmosphereMistLayers: e.target.checked },
                }))
              }
            />
            Atmosphere mist layers
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.layers.foregroundSmokeEnabled ?? true}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  layers: { ...prev.layers, foregroundSmokeEnabled: e.target.checked },
                }))
              }
            />
            Foreground smoke enabled
          </label>
        </div>
      </details>

      <details className="rounded-lg border border-white/15 bg-black/40 p-3" open>
        <summary className="cursor-pointer text-sm font-semibold">Assets / Publish</summary>
        <h2 className="mb-2 mt-2 text-sm font-semibold">Assets / Publish</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => void handleUpload(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
          <button type="button" className="rounded bg-fuchsia-600 px-3 py-1" onClick={publish}>
            Publish to JSON
          </button>
          <button
            type="button"
            className="rounded bg-white/15 px-3 py-1"
            onClick={() => {
              void navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
              setStatus("Draft JSON copied.");
            }}
          >
            Copy JSON
          </button>
        </div>
      </details>

      <section className="rounded-lg border border-amber-300/30 bg-amber-950/30 p-3">
        <h2 className="mb-2 text-sm font-semibold text-amber-100">Troubleshooting Signals</h2>
        {warnings.length === 0 ? (
          <p className="text-xs text-emerald-200">No immediate draft risks detected.</p>
        ) : (
          <ul className="space-y-1 text-xs text-amber-100">
            {warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-cyan-200">{status}</p>
    </main>
  );
}

