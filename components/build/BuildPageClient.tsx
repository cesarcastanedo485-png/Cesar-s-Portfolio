"use client";

import { PackagesBuilderClient } from "@/components/build/PackagesBuilderClient";
import { buildMenuData } from "@/lib/build-menu";

export function BuildPageClient() {
  return <PackagesBuilderClient variant="website" data={buildMenuData} />;
}
