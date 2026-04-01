import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Moved to App À la Carte",
  description: "The former website ticket-punch flow now lives under /apps.",
};

export default function BuildPage() {
  redirect("/apps");
}
