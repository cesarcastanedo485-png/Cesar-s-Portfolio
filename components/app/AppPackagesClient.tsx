"use client";

import { PackagesBuilderClient } from "@/components/build/PackagesBuilderClient";
import { appMenuData } from "@/lib/app-menu";

export function AppPackagesClient() {
  return <PackagesBuilderClient variant="app" data={appMenuData} />;
}
