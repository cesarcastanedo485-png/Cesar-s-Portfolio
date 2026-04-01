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
import { cn } from "@/lib/utils";
import { heroContent, site } from "@/lib/content";

export default function Home() {
  const bgVideoSrc = site.backgroundVideo?.src?.trim();
  const ar = site.audioReactiveBackground;
  const arImage = ar?.imageSrc?.trim();
  const arAudio = ar?.audioSrc?.trim();
  const useAudioReactive = Boolean(ar?.enabled && arAudio);
  const atmosphereOn = useAudioReactive || Boolean(bgVideoSrc);

  return (
    <div className="relative min-h-screen">
      {useAudioReactive && arAudio ? (
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
      <BackgroundAtmosphere enabled={atmosphereOn} />
      <div className="relative z-10 min-h-screen">
        <SectionSparkles>
          <Header />
        </SectionSparkles>
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "min-h-screen space-y-24 px-6 py-12 outline-none md:space-y-32 md:px-12 md:py-16 lg:space-y-40 lg:px-20 lg:py-20",
            useAudioReactive &&
              "max-md:pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))]",
            atmosphereOn
              ? "bg-transparent"
              : "bg-gradient-to-b from-[#0a0e17] to-[#000]"
          )}
        >
          <SectionSparkles>
            <Hero content={heroContent} />
          </SectionSparkles>
          <SectionSparkles>
            <WebsitesGallery />
          </SectionSparkles>
          <SectionSparkles>
            <QuoteSection />
          </SectionSparkles>
          <SectionSparkles>
            <GamesGallery />
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
