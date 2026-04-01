"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AudioReactiveBackground } from "@/components/layout/AudioReactiveBackground";
import { SiteBackgroundVideo } from "@/components/layout/SiteBackgroundVideo";
import { BackgroundAtmosphere } from "@/components/effects/BackgroundAtmosphere";
import { SectionSparkles } from "@/components/effects/SectionSparkles";
import { Hero } from "@/components/sections/Hero";
import { WebsitesGallery } from "@/components/sections/WebsitesGallery";
import { QuoteSection } from "@/components/sections/QuoteSection";
import { GamesGallery } from "@/components/sections/GamesGallery";
import { ContactSection } from "@/components/sections/ContactSection";
import { DreamNowSection } from "@/components/sections/DreamNowSection";
import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";
import { heroContent, site } from "@/lib/content";

export function HomePageContent() {
  const { isMatrixMode } = useProgression();
  const bgVideoSrc = site.backgroundVideo?.src?.trim();
  const ar = site.audioReactiveBackground;
  const arImage = ar?.imageSrc?.trim();
  const arAudio = ar?.audioSrc?.trim();
  const useAudioReactive = Boolean(ar?.enabled && arAudio) && !isMatrixMode;
  const atmosphereOn =
    !isMatrixMode && (useAudioReactive || Boolean(bgVideoSrc));
  const atmosphereLayerOn = atmosphereOn || isMatrixMode;
  const showFixedBlackBackdrop =
    !isMatrixMode && !bgVideoSrc?.trim() && !useAudioReactive;

  return (
    <div className="relative min-h-screen">
      {isMatrixMode ? (
        <div
          className="pointer-events-none fixed inset-0 -z-20 bg-gradient-to-b from-[#0a0e17] via-[#0c121c] to-[#080a10]"
          aria-hidden
        />
      ) : useAudioReactive && arAudio ? (
        <AudioReactiveBackground
          imageSrc={arImage ?? ""}
          audioSrc={arAudio}
          showControls={ar?.showControls !== false}
          imageAlt={ar?.imageAlt?.trim() ?? ""}
        />
      ) : (
        <SiteBackgroundVideo
          mp4Src={site.backgroundVideo?.src}
          posterSrc={site.backgroundVideo?.poster}
        />
      )}
      {showFixedBlackBackdrop ? (
        <div
          className="pointer-events-none fixed inset-0 -z-20 bg-black"
          aria-hidden
        />
      ) : null}
      <BackgroundAtmosphere
        enabled={atmosphereLayerOn}
        matrixCalm={isMatrixMode}
        mistLayers={!useAudioReactive}
      />
      <div className="relative z-10 min-h-screen">
        <SectionSparkles>
          <Header />
        </SectionSparkles>
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "min-h-screen outline-none",
            isMatrixMode
              ? "space-y-16 px-4 py-10 md:space-y-20 md:px-10 md:py-14 lg:space-y-24 lg:px-16"
              : "space-y-24 px-6 py-12 md:space-y-32 md:px-12 md:py-16 lg:space-y-40 lg:px-20 lg:py-20",
            !isMatrixMode &&
              useAudioReactive &&
              "max-md:pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))]",
            atmosphereOn || isMatrixMode
              ? "bg-transparent"
              : "bg-black",
          )}
        >
          <SectionSparkles>
            <Hero content={heroContent} />
          </SectionSparkles>
          <SectionSparkles>
            <WebsitesGallery />
          </SectionSparkles>
          <SectionSparkles layout="scatter">
            <QuoteSection />
          </SectionSparkles>
          <SectionSparkles>
            <GamesGallery />
          </SectionSparkles>
          <SectionSparkles>
            <DreamNowSection />
          </SectionSparkles>
          <SectionSparkles>
            <ContactSection />
          </SectionSparkles>
        </main>
        <SectionSparkles>
          <Footer />
        </SectionSparkles>
      </div>
    </div>
  );
}
