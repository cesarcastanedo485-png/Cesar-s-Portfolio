"use client";

import { PackagesBuilderClient } from "@/components/build/PackagesBuilderClient";
import { socialMenuData } from "@/lib/social-menu";

export function SocialPackagesClient() {
  return <PackagesBuilderClient variant="social" data={socialMenuData} />;
}
