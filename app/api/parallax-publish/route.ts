import { readFile, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import type { EditorDraft } from "@/lib/parallax-editor";
import { sanitizeEditorTune } from "@/lib/parallax-editor-config";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export async function POST(request: Request) {
  try {
    const draft = (await request.json()) as EditorDraft;
    const filePath = path.join(process.cwd(), "content", "portfolio.json");
    const raw = await readFile(filePath, "utf8");
    const json = JSON.parse(raw) as {
      site?: {
        audioReactiveBackground?: Record<string, unknown>;
        foregroundSmoke?: Record<string, unknown>;
      };
    };

    if (!json.site) json.site = {};
    if (!json.site.audioReactiveBackground) json.site.audioReactiveBackground = {};
    if (!json.site.foregroundSmoke) json.site.foregroundSmoke = {};

    const ar = json.site.audioReactiveBackground;
    const smoke = json.site.foregroundSmoke;
    const layers = draft.layers ?? {};

    ar.imageSrc = layers.baseImageSrc ?? ar.imageSrc;
    ar.beatFlashImageSrc = layers.beatFlashImageSrc ?? ar.beatFlashImageSrc;
    ar.beatFlashOpacityGain =
      typeof layers.beatFlashOpacityGain === "number"
        ? clamp(layers.beatFlashOpacityGain, 0, 3)
        : ar.beatFlashOpacityGain;
    ar.mushroomImageSrc = layers.smokeImageSrc ?? ar.mushroomImageSrc;
    ar.rainVideoSrc = layers.rainVideoSrc ?? ar.rainVideoSrc;
    ar.rainVideoBlend = layers.rainVideoBlend ?? ar.rainVideoBlend;
    ar.rainVideoKey = layers.rainVideoKey ?? ar.rainVideoKey;
    ar.rainVideoLumaThreshold =
      typeof layers.rainVideoLumaThreshold === "number"
        ? clamp(layers.rainVideoLumaThreshold, 0, 1)
        : ar.rainVideoLumaThreshold;
    ar.rainVideoLumaSoften =
      typeof layers.rainVideoLumaSoften === "number"
        ? clamp(layers.rainVideoLumaSoften, 0, 1)
        : ar.rainVideoLumaSoften;
    ar.rainVideoLumaCeiling =
      typeof layers.rainVideoLumaCeiling === "number"
        ? clamp(layers.rainVideoLumaCeiling, 0, 1)
        : ar.rainVideoLumaCeiling;
    ar.rainVideoLumaCeilingSoften =
      typeof layers.rainVideoLumaCeilingSoften === "number"
        ? clamp(layers.rainVideoLumaCeilingSoften, 0, 1)
        : ar.rainVideoLumaCeilingSoften;
    ar.mobileTune = sanitizeEditorTune(draft.arp.mobile);
    ar.desktopTune = sanitizeEditorTune(draft.arp.desktop);

    smoke.enabled =
      typeof layers.foregroundSmokeEnabled === "boolean"
        ? layers.foregroundSmokeEnabled
        : smoke.enabled;
    smoke.intensity = layers.foregroundSmokeIntensity ?? smoke.intensity;

    await writeFile(filePath, JSON.stringify(json, null, 2) + "\n", "utf8");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publish failed" },
      { status: 500 },
    );
  }
}

