import { readFile, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import type { EditorDraft } from "@/lib/parallax-editor";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function sanitizeTune(input: EditorDraft["arp"]["mobile"]) {
  return {
    widthVw: clamp(input.widthVw, 120, 260),
    startVw: clamp(input.startVw, -220, 160),
    endVw: clamp(input.endVw, -220, 160),
    objectPosX: clamp(input.objectPosX, 0, 100),
    objectPosY: clamp(input.objectPosY, -40, 45),
    snapToEndWithinPx: clamp(input.snapToEndWithinPx, 0, 600),
    pulseScale: clamp(input.pulseScale, 0, 0.2),
  };
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
    ar.mobileTune = sanitizeTune(draft.arp.mobile);
    ar.desktopTune = sanitizeTune(draft.arp.desktop);

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

