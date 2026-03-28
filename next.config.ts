import type { NextConfig } from "next";

/**
 * Custom `distDir` can help some Windows setups avoid EPERM on `.next`.
 * Vercel sets `VERCEL=1` during builds — keep the default `.next` output there
 * so the platform can find the build reliably.
 */
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { distDir: "build" }),
};

export default nextConfig;
