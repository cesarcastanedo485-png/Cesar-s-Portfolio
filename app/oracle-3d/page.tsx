"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { createElement, useEffect, useState } from "react";
import {
  ORACLE_UNLOCK_LEVEL,
  STORAGE_KEY,
  safeParseProgression,
} from "@/lib/progression";

const MODEL_SRC = "/models/mad-hatter-oracle.glb";
const POSTER_SRC = "/backgrounds/alice-parallax.png";

export default function Oracle3DPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const next = safeParseProgression(raw);
    if (next.experienceMode === null) {
      router.replace("/");
      return;
    }
    setCurrentLevel(next.currentLevel);
    setHydrated(true);
  }, [router]);

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#060a13] px-4 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="vault-neon-instruction text-sm">Checking progression...</p>
        </div>
      </main>
    );
  }

  if (currentLevel < ORACLE_UNLOCK_LEVEL) {
    return (
      <main className="min-h-screen bg-[#060a13] px-4 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-fuchsia-400/35 bg-[#0b1020]/80 p-6 text-center shadow-[0_24px_64px_rgba(88,28,135,0.35)]">
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200/70">Oracle Locked</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Reach Level {ORACLE_UNLOCK_LEVEL} to enter
          </h1>
          <p className="vault-neon-instruction mx-auto mt-3 max-w-xl text-sm">
            Current progression: Level {currentLevel} / {ORACLE_UNLOCK_LEVEL}. Open vaults and expand project
            details to finish the climb.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full border border-cyan-400/35 bg-cyan-950/35 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-900/40"
          >
            Back to portfolio
          </Link>
        </div>
      </main>
    );
  }

  return (
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

        <section className="overflow-hidden rounded-2xl border border-white/12 bg-black/30 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="relative aspect-[9/14] min-h-[68svh] w-full sm:aspect-[16/10]">
            {createElement("model-viewer", {
              src: MODEL_SRC,
              poster: POSTER_SRC,
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
                  "radial-gradient(circle at 50% 22%, rgba(172, 85, 247, 0.25), rgba(8, 12, 20, 0.95) 58%)",
              },
            })}
          </div>
        </section>

        <p className="vault-neon-instruction text-xs leading-relaxed">
          Note: this model is currently high-resolution and may load slowly on
          cellular/mobile. I can add compressed LOD versions next.
        </p>
      </div>
    </main>
  );
}

