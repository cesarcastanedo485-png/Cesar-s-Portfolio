"use client";

import { FormEvent, useMemo, useState } from "react";
import { MoonStar, Sparkles } from "lucide-react";
import { useProgression } from "@/lib/progression";
import { cn } from "@/lib/utils";

type BriefType = "app" | "website" | "other";

const slotRect = { left: 62, top: 40, width: 24, height: 18 };
const promptStarters = [
  {
    id: "starter-noir",
    label: "Neon noir",
    text:
      "Mobile-first website, cinematic neon noir, rain-slick reflections, glowing glass cards, high contrast typography, subtle parallax smoke, premium dark UI, dramatic but clean hierarchy, micro-animations on tap.",
  },
  {
    id: "starter-editorial",
    label: "Editorial luxe",
    text:
      "Luxury editorial experience, elegant serif headlines, minimalist grid with generous whitespace, warm gold accents on deep charcoal, buttery scroll transitions, tactile buttons, polished storytelling sections with immersive visuals.",
  },
  {
    id: "starter-playful",
    label: "Playful retro-future",
    text:
      "Playful retro-futuristic app UI, holographic gradients, chunky rounded controls, arcade-inspired badges, expressive motion, delightful sound cues, clear onboarding, and highly readable mobile interactions.",
  },
  {
    id: "starter-tech",
    label: "Tech product",
    text:
      "Conversion-focused product site, crisp SaaS layout, clean data visualization accents, trust-building social proof, sticky mobile CTA, performance-first UX, and polished accessibility-friendly components.",
  },
];

function withinSlot(x: number, y: number): boolean {
  return (
    x >= slotRect.left &&
    x <= slotRect.left + slotRect.width &&
    y >= slotRect.top &&
    y <= slotRect.top + slotRect.height
  );
}

export function DreamNowSection() {
  const { levelOneComplete, openOverlay, addDreamBrief } = useProgression();
  const [coinPos, setCoinPos] = useState({ x: 22, y: 74 });
  const [coinInserted, setCoinInserted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    type: "website" as BriefType,
    vibePrompt: "",
    primaryGoal: "",
    features: "",
  });

  const applyStarter = (text: string) => {
    setForm((prev) => ({
      ...prev,
      vibePrompt: prev.vibePrompt.trim() ? `${prev.vibePrompt.trim()}\n\n${text}` : text,
    }));
    setSaved(false);
  };

  const machineStatus = useMemo(() => {
    if (!levelOneComplete) return "Level 1 required";
    if (coinInserted) return "Oracle awake";
    return "Insert coin to begin";
  }, [coinInserted, levelOneComplete]);

  const onCoinPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!levelOneComplete || coinInserted || (e.buttons & 1) !== 1) return;
    const container = e.currentTarget.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clamped = {
      x: Math.max(6, Math.min(94, x)),
      y: Math.max(12, Math.min(92, y)),
    };
    setCoinPos(clamped);
    if (withinSlot(clamped.x, clamped.y)) {
      setCoinInserted(true);
      setCoinPos({ x: slotRect.left + slotRect.width / 2, y: slotRect.top + slotRect.height / 2 });
      if ("vibrate" in navigator) navigator.vibrate([10, 20, 10]);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.vibePrompt.trim() || !form.primaryGoal.trim()) return;
    setSubmitting(true);
    addDreamBrief({
      type: form.type,
      vibePrompt: form.vibePrompt.trim(),
      primaryGoal: form.primaryGoal.trim(),
      features: form.features.trim(),
    });
    setTimeout(() => {
      setSubmitting(false);
      setSaved(true);
      setForm({ type: "website", vibePrompt: "", primaryGoal: "", features: "" });
    }, 320);
  };

  return (
    <section id="dream-now" className="scroll-mt-24 py-16" aria-labelledby="dream-now-heading">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="section-glass-panel overflow-hidden border-fuchsia-500/30 bg-gradient-to-br from-[#140f28]/85 to-[#090d18]/92 p-5 md:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/70">Dream Now</p>
              <h2 id="dream-now-heading" className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Mad Hatter Oracle
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Fortune machine disguised brief intake: drop a coin, then describe your build like an AI prompt.
              </p>
            </div>
            <p className="rounded-full border border-fuchsia-400/35 bg-fuchsia-950/35 px-3 py-1 text-xs text-fuchsia-100/90">
              {machineStatus}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-xl border border-white/12 bg-black/35 p-3">
              <div className="relative aspect-[4/5] rounded-lg border border-amber-300/25 bg-gradient-to-b from-[#1a0f05]/95 to-[#0a0907]/95 p-3">
                <div className="pointer-events-none absolute inset-x-3 top-5 rounded-md border border-amber-200/15 bg-black/35 p-2 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-amber-100/65">Fortunes and blueprints</p>
                </div>
                <div className="pointer-events-none absolute left-[62%] top-[40%] h-[18%] w-[24%] rounded-md border border-amber-200/28 bg-black/40 shadow-[inset_0_0_14px_rgba(0,0,0,0.5)]" />
                <button
                  type="button"
                  onPointerMove={onCoinPointerMove}
                  className={cn(
                    "absolute left-0 top-0 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100/40 bg-gradient-to-b from-amber-200/80 to-amber-600/80 text-black shadow-md transition",
                    coinInserted && "pointer-events-none scale-90 opacity-75",
                  )}
                  style={{ left: `${coinPos.x}%`, top: `${coinPos.y}%` }}
                  aria-label="Drag coin into slot"
                >
                  25¢
                </button>
                <div className="pointer-events-none absolute inset-x-5 bottom-4 rounded-lg border border-fuchsia-200/20 bg-fuchsia-950/25 p-3 text-xs text-white/65">
                  <p className="inline-flex items-center gap-1">
                    <MoonStar className="h-3.5 w-3.5" />
                    Drop coin to awaken the oracle
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/12 bg-black/35 p-4">
              {!levelOneComplete ? (
                <div className="space-y-3">
                  <p className="text-sm text-white/75">
                    Complete Level 1 first to unlock Dream Now.
                  </p>
                  <button
                    type="button"
                    onClick={() => openOverlay({ openForm: true })}
                    className="inline-flex rounded-full border border-cyan-400/40 bg-cyan-950/35 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-900/40"
                  >
                    Unlock with Level 1
                  </button>
                </div>
              ) : coinInserted ? (
                <form onSubmit={onSubmit} className="space-y-3">
                  <label className="block text-sm text-white/80">
                    App or website?
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, type: e.target.value as BriefType }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#0a1020] px-3 py-2 text-white"
                    >
                      <option value="website">Website</option>
                      <option value="app">App</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label className="block text-sm text-white/80">
                    Describe the look as if writing an AI image prompt
                    <textarea
                      value={form.vibePrompt}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, vibePrompt: e.target.value }))
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#0a1020] px-3 py-2 text-white"
                      placeholder="Example: Cinematic neon noir dashboard, glossy glass cards, kinetic typography..."
                    />
                  </label>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-fuchsia-100/70">
                      Prompt starters (tap to insert)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {promptStarters.map((starter) => (
                        <button
                          key={starter.id}
                          type="button"
                          onClick={() => applyStarter(starter.text)}
                          className="rounded-full border border-fuchsia-300/30 bg-fuchsia-950/25 px-3 py-1.5 text-xs text-fuchsia-100/85 transition hover:bg-fuchsia-900/35"
                        >
                          {starter.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs leading-relaxed text-white/55">
                      Include style, mood, color palette, layout, motion, and interaction intent.
                    </p>
                  </div>
                  <label className="block text-sm text-white/80">
                    What should it do for users?
                    <textarea
                      value={form.primaryGoal}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, primaryGoal: e.target.value }))
                      }
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#0a1020] px-3 py-2 text-white"
                    />
                  </label>
                  <label className="block text-sm text-white/80">
                    Must-have features (optional)
                    <textarea
                      value={form.features}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, features: e.target.value }))
                      }
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#0a1020] px-3 py-2 text-white"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/45 bg-fuchsia-950/40 px-5 py-2 text-sm text-fuchsia-100 transition hover:bg-fuchsia-900/45 disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" />
                    {submitting ? "Casting..." : "Cast the dream"}
                  </button>
                  {saved ? (
                    <p className="text-sm text-emerald-300">Dream captured. Check the dev leads page.</p>
                  ) : null}
                </form>
              ) : (
                <p className="text-sm text-white/70">
                  Drag the coin into the slot to start the oracle sequence.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

