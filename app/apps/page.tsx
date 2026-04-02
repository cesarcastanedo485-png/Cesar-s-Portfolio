import type { Metadata } from "next";
import { buildMenuData } from "@/lib/build-menu";
import { BuildPageClient } from "@/components/build/BuildPageClient";
import { AlaCarteLevelGate } from "@/components/progression/AlaCarteLevelGate";
import { APPS_UNLOCK_LEVEL } from "@/lib/progression";

export const metadata: Metadata = {
  title: `${buildMenuData.meta.pageTitle} (App)`,
  description: buildMenuData.meta.pageDescription,
};

export default function AppPackagesPage() {
  return (
    <AlaCarteLevelGate title="Android app à la carte" requiredLevel={APPS_UNLOCK_LEVEL}>
      <BuildPageClient />
    </AlaCarteLevelGate>
  );
}
