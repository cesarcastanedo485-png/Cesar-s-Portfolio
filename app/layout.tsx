import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import {
  Orbitron,
  Playfair_Display,
  Space_Grotesk,
  Tilt_Neon,
} from "next/font/google";
import "./globals.css";
import { site } from "@/lib/content";
import { SkipLink } from "@/components/layout/SkipLink";
import { ProgressionShell } from "@/components/progression/ProgressionShell";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const tiltNeon = Tilt_Neon({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-tilt-neon",
  display: "swap",
});

const orbitron = Orbitron({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const canonical = new URL(site.canonicalBase);

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0e17",
};

export const metadata: Metadata = {
  metadataBase: canonical,
  title: {
    default: site.title,
    template: `%s | ${site.author}`,
  },
  description: site.description,
  keywords: site.keywords,
  authors: [{ name: site.author }],
  openGraph: {
    title: site.title,
    description: site.description,
    url: canonical,
    siteName: site.author,
    images: [
      {
        url: site.ogImage,
        width: 1200,
        height: 630,
        alt: site.title,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: [site.ogImage],
    creator: site.twitterHandle,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${playfairDisplay.variable} ${tiltNeon.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SkipLink />
        <ProgressionShell>{children}</ProgressionShell>
      </body>
    </html>
  );
}
