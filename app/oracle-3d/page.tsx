"use client";

import Link from "next/link";
import Script from "next/script";
import { createElement } from "react";
import { AlaCarteLevelGate } from "@/components/progression/AlaCarteLevelGate";
import { ORACLE_UNLOCK_LEVEL } from "@/lib/progression";
import {
  ORACLE_MODEL_DEFAULT_PATH,
  ORACLE_MODEL_SRC,
  ORACLE_POSTER_SRC,
} from "@/lib/oracle-3d-config";

export default function Oracle3DPage() {
  const modelSrc = ORACLE_MODEL_SRC.trim();
  const posterSrc = ORACLE_POSTER_SRC.trim();

  return (
    <AlaCarteLevelGate
      title="Website à la carte (Fortune Teller)"
      requiredLevel={ORACLE_UNLOCK_LEVEL}
    >
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
              {modelSrc ? (
                createElement("model-viewer", {
                  src: modelSrc,
                  ...(posterSrc ? { poster: posterSrc } : {}),
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
                    3D model path is not configured yet. Add the model file at{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/90">
                      public{ORACLE_MODEL_DEFAULT_PATH}
                    </code>{" "}
                    and set{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5">
                      ORACLE_MODEL_SRC
                    </code>{" "}
                    in{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5">
                      lib/oracle-3d-config.ts
                    </code>{" "}
                    to <code className="rounded bg-white/10 px-1.5 py-0.5">"{ORACLE_MODEL_DEFAULT_PATH}"</code>.
                  </p>
                </div>
              )}
            </div>
          </section>

          {modelSrc ? (
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

