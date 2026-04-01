import type { Metadata } from "next";
import { appMenuData } from "@/lib/app-menu";
import { AppPackagesClient } from "@/components/app/AppPackagesClient";

const { meta } = appMenuData;

export const metadata: Metadata = {
  title: meta.pageTitle,
  description: meta.pageDescription,
};

export default function AppPackagesPage() {
  return <AppPackagesClient />;
}
