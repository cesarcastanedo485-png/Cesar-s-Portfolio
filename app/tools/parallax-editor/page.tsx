import { ParallaxStackEditor } from "@/components/tools/ParallaxStackEditor";
import { site } from "@/lib/content";

export default function ParallaxEditorPage() {
  const ar = site.audioReactiveBackground;
  const smoke = site.foregroundSmoke;

  return (
    <ParallaxStackEditor
      seed={{
        imageSrc: ar?.imageSrc?.trim() ?? "",
        beatFlashImageSrc: ar?.beatFlashImageSrc?.trim() ?? "",
        beatFlashOpacityGain: ar?.beatFlashOpacityGain ?? 1,
        mushroomImageSrc: ar?.mushroomImageSrc?.trim() ?? "",
        rainVideoSrc: ar?.rainVideoSrc?.trim() ?? "",
        rainVideoBlend: ar?.rainVideoBlend ?? "normal",
        rainVideoKey: ar?.rainVideoKey ?? "none",
        rainVideoLumaThreshold: ar?.rainVideoLumaThreshold ?? 0.12,
        rainVideoLumaSoften: ar?.rainVideoLumaSoften ?? 0.06,
        rainVideoLumaCeiling: ar?.rainVideoLumaCeiling ?? 1,
        rainVideoLumaCeilingSoften: ar?.rainVideoLumaCeilingSoften ?? 0.05,
        foregroundSmokeEnabled: smoke?.enabled !== false,
        foregroundSmokeIntensity: smoke?.intensity ?? "default",
      }}
    />
  );
}

