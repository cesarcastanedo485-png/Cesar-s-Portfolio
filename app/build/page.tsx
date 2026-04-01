import type { Metadata } from "next";
import { buildMenuData } from "@/lib/build-menu";
import { BuildPageClient } from "@/components/build/BuildPageClient";

const { meta } = buildMenuData;

export const metadata: Metadata = {
  title: meta.pageTitle,
  description: meta.pageDescription,
};

export default function BuildPage() {
  return <BuildPageClient />;
}
