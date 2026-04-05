"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlaCarteFloatingButtons } from "@/components/layout/AlaCarteFloatingButtons";
import { AudioReactiveBackground } from "@/components/layout/AudioReactiveBackground";
import { WonderlandAtmosphereStub } from "@/components/layout/WonderlandAtmosphereStub";
import { SiteBackgroundVideo } from "@/components/layout/SiteBackgroundVideo";
import { BackgroundAtmosphere } from "@/components/effects/BackgroundAtmosphere";
import { ForegroundSmokeParallax } from "@/components/effects/ForegroundSmokeParallax";
import { Hero } from "@/components/sections/Hero";
import { WebsitesGallery } from "@/components/sections/WebsitesGallery";
import { QuoteSection } from "@/components/sections/QuoteSection";
import { GamesGallery } from "@/components/sections/GamesGallery";
import { ContactSection } from "@/components/sections/ContactSection";
import { DreamNowSection } from "@/components/sections/DreamNowSection";
import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";
import {
  BG_PANORAMA_MIN_WIDTH_VW_MOBILE,
  MOBILE_ARP_SHIFT_END_VW,
  MOBILE_ARP_SHIFT_START_VW,
  panoramaScrollRangeVw,
} from "@/lib/background-parallax";
import { heroContent, site } from "@/lib/content";
import { useIsNarrowViewport } from "@/lib/use-max-width-media";
import { useEffect, useRef, useState } from "react";
import { useScrollDrivenShiftX } from "@/lib/use-scroll-driven-shift-x";
import { PARALLAX_EDITOR_DRAFT_KEY, isEditorPreviewEnabled } from "@/lib/parallax-editor";

export function HomePageContent() {
  const [previewLayerOverrides, setPreviewLayerOverrides] = useState<{
    baseImageSrc?: string;
    beatFlashImageSrc?: string;
    beatFlashOpacityGain?: number;
    smokeImageSrc?: string;
    rainVideoSrc?: string;
    rainVideoBlend?: "normal" | "screen" | "plus-lighter";
    rainVideoKey?: "none" | "luma";
    rainVideoLumaThreshold?: number;
    rainVideoLumaSoften?: number;
    rainVideoLumaCeiling?: number;
    rainVideoLumaCeilingSoften?: number;
    atmosphereMistLayers?: boolean;
    foregroundSmokeEnabled?: boolean;
    foregroundSmokeIntensity?: "low" | "default" | "high";
  } | null>(null);
  const { isMatrixMode, hydrated, experienceMode } = useProgression();
  const narrowViewport = useIsNarrowViewport();
  const bgVideoSrc = site.backgroundVideo?.src?.trim();
  const ar = site.audioReactiveBackground;
  const foregroundSmoke = site.foregroundSmoke;
  const arImage = ar?.imageSrc?.trim();
  const arMushroomImage = ar?.mushroomImageSrc?.trim();
  const arAudio = ar?.audioSrc?.trim();
  const useAudioReactive = Boolean(ar?.enabled && arAudio) && !isMatrixMode;
  const showFallbackWonderlandBackground =
    !isMatrixMode &&
    experienceMode === "wonderland" &&
    !Boolean(bgVideoSrc?.trim()) &&
    !useAudioReactive;
  const fallbackBgRef = useRef<HTMLDivElement>(null);
  const fallbackPanMinVw = narrowViewport ? BG_PANORAMA_MIN_WIDTH_VW_MOBILE : 118;
  useScrollDrivenShiftX(fallbackBgRef, {
    enabled: hydrated && showFallbackWonderlandBackground,
    cssVarName: "--fallback-scroll-x",
    ...(narrowViewport
      ? {
          shiftStartVw: MOBILE_ARP_SHIFT_START_VW,
          shiftEndVw: MOBILE_ARP_SHIFT_END_VW,
        }
      : { rangeVw: panoramaScrollRangeVw(fallbackPanMinVw) }),
  });
  /**
   * Stub unlocks Level 1 when there is no `audioSrc` — do not gate on `ar.enabled`
   * (missing/false in JSON would hide the only path to progression on phones).
   */
  const showWonderlandAtmosphereStub =
    hydrated &&
    experienceMode === "wonderland" &&
    !isMatrixMode &&
    !Boolean(arAudio?.trim());
  /**
   * Ambient grade + mist behind transparent main — not only when video/audio URL exists.
   * Wonderland mode always gets the atmosphere layer so a mis-set `enabled: false` does
   * not flatten the whole experience to black.
   */
  const atmosphereOn =
    !isMatrixMode &&
    (useAudioReactive ||
      Boolean(bgVideoSrc?.trim()) ||
      Boolean(ar?.enabled) ||
      experienceMode === "wonderland");
  const atmosphereLayerOn = isMatrixMode || (atmosphereOn && !useAudioReactive);
  const backgroundMistLayersEnabled =
    previewLayerOverrides?.atmosphereMistLayers ?? !useAudioReactive;
  /**
   * Guardrail: Foreground smoke enablement is decided once here (not spread across components).
   * This prevents "it worked, then disappeared" regressions from branch-specific conditions.
   */
  const foregroundDebug = foregroundSmoke?.debugBlatantCenter === true;
  const foregroundSmokeEnabled =
    hydrated &&
    (previewLayerOverrides?.foregroundSmokeEnabled ??
      foregroundSmoke?.enabled !== false) &&
    (foregroundDebug ||
      ((!isMatrixMode && experienceMode === "wonderland") ||
        (isMatrixMode && foregroundSmoke?.inMatrixMode === true)));
  const foregroundSmokeIntensity =
    previewLayerOverrides?.foregroundSmokeIntensity ??
    foregroundSmoke?.intensity ??
    "default";
  const showFixedBlackBackdrop =
    !isMatrixMode &&
    !bgVideoSrc?.trim() &&
    !useAudioReactive &&
    !showFallbackWonderlandBackground;

  useEffect(() => {
    if (typeof window === "undefined" || !isEditorPreviewEnabled()) {
      setPreviewLayerOverrides(null);
      return;
    }
    try {
      const raw = window.localStorage.getItem(PARALLAX_EDITOR_DRAFT_KEY);
      if (!raw) {
        setPreviewLayerOverrides(null);
        return;
      }
      const parsed = JSON.parse(raw) as { layers?: typeof previewLayerOverrides };
      setPreviewLayerOverrides(parsed.layers ?? null);
    } catch {
      setPreviewLayerOverrides(null);
    }
  }, []);

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7531/ingest/a2f6d748-df85-4288-afaf-dcecbfdaa24b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "2431dd",
      },
      body: JSON.stringify({
        sessionId: "2431dd",
        runId: "pre-fix",
        hypothesisId: "H1_H2",
        location: "HomePageContent.tsx:mode-gates",
        message: "homepage background mode gates snapshot",
        data: {
          hydrated,
          experienceMode,
          isMatrixMode,
          windowInnerWidth: typeof window !== "undefined" ? window.innerWidth : null,
          mobileMatch: typeof window !== "undefined"
            ? window.matchMedia("(max-width: 767px)").matches
            : null,
          narrowViewport,
          useAudioReactive,
          arEnabled: Boolean(ar?.enabled),
          hasArAudio: Boolean(arAudio),
          showFallbackWonderlandBackground,
          showWonderlandAtmosphereStub,
          atmosphereLayerOn,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [
    ar?.enabled,
    arAudio,
    atmosphereLayerOn,
    experienceMode,
    hydrated,
    isMatrixMode,
    narrowViewport,
    showFallbackWonderlandBackground,
    showWonderlandAtmosphereStub,
    useAudioReactive,
  ]);

  return (
    <div className="relative min-h-screen">
      {isMatrixMode ? (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#0a0e17] via-[#0c121c] to-[#080a10]"
          aria-hidden
        />
      ) : useAudioReactive && arAudio ? (
        <AudioReactiveBackground
          imageSrc={previewLayerOverrides?.baseImageSrc ?? arImage ?? ""}
          beatFlashImageSrc={
            previewLayerOverrides?.beatFlashImageSrc ??
            ar?.beatFlashImageSrc?.trim() ??
            ""
          }
          beatFlashOpacityGain={
            previewLayerOverrides?.beatFlashOpacityGain ?? ar?.beatFlashOpacityGain
          }
          mushroomImageSrc={previewLayerOverrides?.smokeImageSrc ?? arMushroomImage ?? ""}
          rainVideoSrc={previewLayerOverrides?.rainVideoSrc ?? ar?.rainVideoSrc?.trim() ?? ""}
          rainVideoBlend={previewLayerOverrides?.rainVideoBlend ?? ar?.rainVideoBlend}
          rainVideoKey={previewLayerOverrides?.rainVideoKey ?? ar?.rainVideoKey}
          rainVideoLumaThreshold={
            previewLayerOverrides?.rainVideoLumaThreshold ?? ar?.rainVideoLumaThreshold
          }
          rainVideoLumaSoften={
            previewLayerOverrides?.rainVideoLumaSoften ?? ar?.rainVideoLumaSoften
          }
          rainVideoLumaCeiling={
            previewLayerOverrides?.rainVideoLumaCeiling ?? ar?.rainVideoLumaCeiling
          }
          rainVideoLumaCeilingSoften={
            previewLayerOverrides?.rainVideoLumaCeilingSoften ??
            ar?.rainVideoLumaCeilingSoften
          }
          mobileTune={ar?.mobileTune}
          desktopTune={ar?.desktopTune}
          imageAlt={ar?.imageAlt?.trim() ?? ""}
          mushroomImageAlt={ar?.mushroomImageAlt?.trim() ?? ""}
        />
      ) : (
        <SiteBackgroundVideo
          mp4Src={site.backgroundVideo?.src}
          posterSrc={site.backgroundVideo?.poster}
        />
      )}
      {showFixedBlackBackdrop ? (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-black"
          aria-hidden
        />
      ) : null}
      {showFallbackWonderlandBackground ? (
        <div
          ref={fallbackBgRef}
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden [--fallback-scroll-x:0vw]"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[#050810]" />
          <img
            src="/work/linda.svg"
            alt=""
            className="absolute left-1/2 top-1/2 h-[132%] max-w-none object-cover opacity-[0.42] blur-[0.5px]"
            style={{
              minWidth: `${fallbackPanMinVw}vw`,
              transform:
                "translate3d(calc(-50% + var(--fallback-scroll-x, 0vw)), -50%, 0) scale(1.04)",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_44%_at_50%_56%,rgba(99,102,241,0.26)_0%,rgba(59,130,246,0.12)_38%,transparent_74%)]" />
        </div>
      ) : null}
      <>
          <BackgroundAtmosphere
            enabled={atmosphereLayerOn}
            matrixCalm={isMatrixMode}
            mistLayers={backgroundMistLayersEnabled}
          />
          <ForegroundSmokeParallax
            enabled={foregroundSmokeEnabled}
            intensity={foregroundSmokeIntensity}
            debugBlatantCenter={foregroundSmoke?.debugBlatantCenter === true}
          />
          <AlaCarteFloatingButtons />
          {showWonderlandAtmosphereStub ? <WonderlandAtmosphereStub /> : null}
          <div className="relative z-10 min-h-screen">
            <Header />
            <main
              id="main-content"
              tabIndex={-1}
              className={cn(
                "min-h-screen outline-none",
                isMatrixMode
                  ? "space-y-16 px-4 py-10 md:space-y-20 md:px-10 md:py-14 lg:space-y-24 lg:px-16"
                  : "space-y-24 px-6 py-12 md:space-y-32 md:px-12 md:py-16 lg:space-y-40 lg:px-20 lg:py-20",
                !isMatrixMode &&
                  (useAudioReactive || showWonderlandAtmosphereStub) &&
                  "max-md:pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))]",
                atmosphereOn || isMatrixMode
                  ? "bg-transparent"
                  : "bg-black",
              )}
            >
              <Hero content={heroContent} />
              <WebsitesGallery />
              <QuoteSection />
              <GamesGallery />
              <DreamNowSection />
              <ContactSection />
            </main>
            <Footer />
          </div>
      </>
    </div>
  );
}
