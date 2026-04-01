"use client";

import Link from "next/link";
import Script from "next/script";
import { createElement } from "react";
import { AlaCarteLevelGate } from "@/components/progression/AlaCarteLevelGate";

/** Drop `public/models/mad-hatter-oracle.glb` (and optional poster) when ready — avoids 404s on live. */
const MODEL_SRC = "";
const POSTER_SRC = "";

export default function Oracle3DPage() {
  return (
    <AlaCarteLevelGate title="Website à la carte (Fortune Teller)">
      <main className="min-h-screen bg-[#060a13] px-4 py-8 text-white sm:px-8">
        <Script
          type="module"
          src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        />
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200/70">
                3D Experience
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Mad Hatter Oracle Chamber
              </h1>
              <p className="vault-neon-instruction mt-2 max-w-2xl text-sm">
                Drag to orbit, pinch to zoom, and inspect the model. This page is
                optimized for mobile-first interaction.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-cyan-400/35 bg-cyan-950/35 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-900/40"
            >
              Back to portfolio
            </Link>
          </div>

          <section className="overflow-hidden rounded-2xl border border-white/12 bg-black shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="relative aspect-[9/14] min-h-[68svh] w-full sm:aspect-[16/10]">
              {MODEL_SRC.trim() ? (
                createElement("model-viewer", {
                  src: MODEL_SRC,
                  ...(POSTER_SRC.trim() ? { poster: POSTER_SRC } : {}),
                  cameraControls: true,
                  touchAction: "pan-y",
                  autoRotate: true,
                  "auto-rotate-delay": "1200",
                  "rotation-per-second": "22deg",
                  exposure: "1",
                  shadowIntensity: "1",
                  ar: true,
                  "ar-modes": "scene-viewer webxr quick-look",
                  style: {
                    width: "100%",
                    height: "100%",
                    background:
                      "radial-gradient(circle at 50% 22%, rgba(172, 85, 247, 0.25), #000 58%)",
                  },
                })
              ) : (
                <div className="flex size-full min-h-[68svh] flex-col items-center justify-center gap-3 bg-black px-6 text-center text-sm text-white/75 sm:min-h-[320px]">
                  <p className="max-w-md leading-relaxed">
                    3D model not bundled in this repo yet. Add{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/90">
                      public/models/mad-hatter-oracle.glb
                    </code>{" "}
                    and set <code className="rounded bg-white/10 px-1.5 py-0.5">MODEL_SRC</code> in{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5">app/oracle-3d/page.tsx</code>.
                  </p>
                </div>
              )}
            </div>
          </section>

          {MODEL_SRC.trim() ? (
            <p className="vault-neon-instruction text-xs leading-relaxed">
              Note: this model is currently high-resolution and may load slowly on cellular/mobile.
              Compressed LOD versions can be added next.
            </p>
          ) : null}
        </div>
      </main>
    </AlaCarteLevelGate>
  );
}

