import type { Metadata } from "next";
import { socialMenuData } from "@/lib/social-menu";
import { SocialPackagesClient } from "@/components/social/SocialPackagesClient";

const { meta } = socialMenuData;

export const metadata: Metadata = {
  title: meta.pageTitle,
  description: meta.pageDescription,
};

export default function SocialPackagesPage() {
  return <SocialPackagesClient />;
}
