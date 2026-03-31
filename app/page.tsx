import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AudioReactiveBackground } from "@/components/layout/AudioReactiveBackground";
import { SiteBackgroundVideo } from "@/components/layout/SiteBackgroundVideo";
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
      <div className="relative z-10 min-h-screen">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "min-h-screen space-y-24 px-6 py-12 outline-none md:space-y-32 md:px-12 md:py-16 lg:space-y-40 lg:px-20 lg:py-20",
            useAudioReactive || bgVideoSrc
              ? "bg-gradient-to-b from-[#0a0e168c] via-[#0a0e1794] to-[#000000b3]"
              : "bg-gradient-to-b from-[#0a0e17] to-[#000]"
          )}
        >
          <Hero content={heroContent} />
          <WebsitesGallery />
          <QuoteSection />
          <GamesGallery />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
