import type { Metadata } from "next";
import { socialMenuData } from "@/lib/social-menu";
import { SocialPackagesClient } from "@/components/social/SocialPackagesClient";
import { AlaCarteLevelGate } from "@/components/progression/AlaCarteLevelGate";

const { meta } = socialMenuData;

export const metadata: Metadata = {
  title: meta.pageTitle,
  description: meta.pageDescription,
};

export default function SocialPackagesPage() {
  return (
    <AlaCarteLevelGate title="Social media à la carte">
      <SocialPackagesClient />
    </AlaCarteLevelGate>
  );
}
