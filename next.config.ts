import type { NextConfig } from "next";

/**
 * Default `.next` output — required for reliable Vercel deploys.
 * If Windows hits EPERM on `.next`, use Defender exclusions or a short path (see README).
 */
const nextConfig: NextConfig = {
  /** Godot 4 Web (threads) needs isolation headers on the page that loads the engine. */
  async headers() {
    return [
      {
        source: "/demos/dungeon-master-lite/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
