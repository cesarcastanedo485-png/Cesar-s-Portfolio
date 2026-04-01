"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BuildExperienceBar } from "@/components/build/BuildExperienceBar";
import { BuildPriceSidebar } from "@/components/build/BuildPriceSidebar";
import {
  listSelectedItemsInOrderFrom,
  type BuildMenuItem,
} from "@/lib/build-menu";
import { isItemDisabled, toggleModuleSelection } from "@/lib/build-selection";
import { socialMenuData } from "@/lib/social-menu";
import { contactContent } from "@/lib/content";
import { cn } from "@/lib/utils";

const categories = socialMenuData.categories;

function setToOrderedIds(set: Set<string>): string[] {
  return listSelectedItemsInOrderFrom(categories, set).map((i) => i.id);
}

function socialMailBody(args: {
  selected: BuildMenuItem[];
  answers: Record<string, string>;
}): string {
  const lines: string[] = [];
  lines.push("Social à la carte scope (from portfolio)");
  lines.push("");
  lines.push("— Context —");
  for (const step of socialMenuData.questionnaire.steps) {
    const optId = args.answers[step.id];
    const opt = step.options.find((o) => o.id === optId);
    lines.push(`${step.question}: ${opt?.label ?? "(not set)"}`);
  }
  lines.push("");
  lines.push("— Selected modules —");
  if (!args.selected.length) {
    lines.push("(none selected yet)");
  } else {
    for (const item of args.selected) {
      lines.push(`• ${item.label}`);
      lines.push(`  ${item.priceHint.display}`);
      if (item.monthlyNote) lines.push(`  Note: ${item.monthlyNote}`);
    }
  }
  lines.push("");
  lines.push(socialMenuData.meta.longDisclaimer);
  return lines.join("\n");
}

const jumpClass =
  "inline-flex rounded-full border border-fuchsia-500/35 bg-fuchsia-950/25 px-3 py-1.5 text-xs font-medium text-fuchsia-100/90 transition hover:border-cyan-400/40 hover:bg-cyan-950/20 hover:text-cyan-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0514]";

export function SocialPackagesClient() {
  const { meta, questionnaire } = socialMenuData;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedItems = useMemo(
    () => listSelectedItemsInOrderFrom(categories, selectedSet),
    [selectedSet],
  );

  const toggleItem = useCallback(
    (item: BuildMenuItem) => {
      const on = !selectedIds.includes(item.id);
      const next = toggleModuleSelection(selectedSet, item.id, on, categories);
      setSelectedIds(setToOrderedIds(next));
    },
    [selectedIds, selectedSet],
  );

  const mailto = useMemo(() => {
    const email = contactContent.email?.trim();
    if (!email?.includes("@")) return null;
    const body = socialMailBody({ selected: selectedItems, answers });
    const subject = meta.mailSubject;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [answers, meta.mailSubject, selectedItems]);

  const copySummary = useCallback(async () => {
    const text = socialMailBody({ selected: selectedItems, answers });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [answers, selectedItems]);

  return (
    <div className="build-rabbit-hole min-h-screen bg-gradient-to-b from-[#0a0514] via-[#12081f] to-[#040208] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-fuchsia-500/20 bg-[#0a0514]/94 backdrop-blur-md">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md text-sm text-cyan-200/90 transition hover:text-cyan-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-fuchsia-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0514]"
            >
              <ArrowLeft className="size-4 shrink-0 opacity-80" aria-hidden />
              Portfolio home
            </Link>
            <p className="max-w-[min(100%,220px)] text-right font-mono text-[10px] uppercase leading-snug tracking-[0.18em] text-fuchsia-300/75 sm:max-w-none">
              Social orbit · à la carte (social media)
            </p>
          </div>
          <BuildExperienceBar />
        </div>
      </header>

      <p className="sr-only" role="note">
        {meta.stickyDisclaimer}
      </p>

      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-[1] mx-auto max-w-6xl px-4 pb-28 pt-8 outline-none sm:px-6 sm:pb-16"
      >
        <div className="mb-8 border-b border-fuchsia-500/15 pb-8">
          <h1 className="build-alice-copy text-3xl font-semibold tracking-tight sm:text-4xl [font-family:var(--font-orbitron),system-ui,sans-serif]">
            {meta.heroTitle}{" "}
            <span className="text-lg font-normal text-fuchsia-200/80 sm:text-xl">(social media)</span>
          </h1>
          <p className="build-alice-muted mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
            {meta.heroSubtitle}
          </p>
          <div className="mt-4 rounded-lg border border-cyan-500/20 bg-[#0c1020]/80 p-4 text-sm text-cyan-100/85">
            <p className="font-medium text-cyan-50/95">Orbit map</p>
            <p className="build-alice-muted mt-1 text-xs">
              Planet / moons art goes here when you&apos;re ready—this box is a placeholder for your
              cyberpunk scene or Meshy export.
            </p>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="On this page">
            <a href="#social-prices" className={jumpClass}>
              Price menu
            </a>
            <a href="#social-receipt" className={jumpClass}>
              Running receipt
            </a>
            <a href="#social-context" className={jumpClass}>
              Context questions
            </a>
            <Link href="/build" className={jumpClass}>
              Website packages
            </Link>
          </nav>
          <p className="mt-4 rounded-md border border-fuchsia-500/30 bg-fuchsia-950/20 px-3 py-2 text-xs leading-relaxed text-fuchsia-100/90">
            {meta.stickyDisclaimer}
          </p>
        </div>

        <div className="flex flex-col gap-10 xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-12">
          <section id="social-prices" className="scroll-mt-28 min-w-0 space-y-3 xl:col-start-1">
            <h2 className="build-alice-copy text-xl font-semibold text-fuchsia-50/95 sm:text-2xl">
              Price menu · social line items
            </h2>
            <p className="build-alice-muted text-sm">
              Toggle packages and add-ons. Nothing here is a final quote—email the receipt when
              you&apos;re ready.
            </p>
            <div className="mt-6 space-y-8">
              {categories.map((cat) => (
                <fieldset
                  key={cat.id}
                  className="rounded-xl border border-fuchsia-500/20 bg-[#100818]/90 p-4 shadow-[0_0_24px_rgba(168,85,247,0.06)] sm:p-5"
                >
                  <legend className="px-1 text-base font-semibold text-fuchsia-100/95">
                    {cat.label}
                  </legend>
                  {cat.description ? (
                    <p className="build-alice-muted mb-4 mt-1 text-xs sm:text-sm">
                      {cat.description}
                    </p>
                  ) : null}
                  <ul className="space-y-3" role="list">
                    {cat.items.map((item) => {
                      const on = selectedIds.includes(item.id);
                      const { disabled, reason } = isItemDisabled(item, selectedSet, categories);
                      const itemDisabled = disabled && !on;
                      return (
                        <li key={item.id} role="listitem">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            disabled={itemDisabled}
                            aria-describedby={reason ? `${item.id}-hint` : undefined}
                            onClick={() => {
                              if (itemDisabled) return;
                              toggleItem(item);
                            }}
                            className={cn(
                              "flex w-full gap-3 rounded-lg border px-3 py-3 text-left text-sm transition",
                              on
                                ? "border-cyan-400/45 bg-gradient-to-br from-fuchsia-950/50 to-[#0c0614]/95 text-fuchsia-50 shadow-[0_0_28px_rgba(0,212,255,0.1)]"
                                : "border-white/10 bg-black/25 text-slate-200 hover:border-fuchsia-500/35 hover:bg-black/35",
                              itemDisabled && "cursor-not-allowed opacity-45 hover:border-white/10",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 font-mono text-[11px]",
                                on
                                  ? "border-cyan-400/80 bg-[#1a0a24] text-cyan-200"
                                  : "border-fuchsia-800/50 bg-[#0a0610]",
                              )}
                              aria-hidden
                            >
                              {on ? "●" : ""}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium leading-snug">{item.label}</span>
                              <span className="build-alice-muted mt-1 block text-xs leading-relaxed">
                                {item.description}
                              </span>
                              <span className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold text-cyan-200/90">
                                  {item.priceHint.display}
                                </span>
                                {item.tags?.length ? (
                                  <span className="flex flex-wrap gap-1">
                                    {item.tags.map((t) => (
                                      <span
                                        key={t}
                                        className="rounded border border-fuchsia-500/20 bg-fuchsia-950/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-fuchsia-200/75"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </span>
                                ) : null}
                              </span>
                              {item.priceHint.basis ? (
                                <span className="build-alice-muted mt-1 block text-[11px] text-slate-500">
                                  {item.priceHint.basis}
                                </span>
                              ) : null}
                            </span>
                          </button>
                          {reason ? (
                            <p
                              id={`${item.id}-hint`}
                              className="mt-1 pl-8 text-xs text-amber-300/85"
                            >
                              {reason}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              ))}
            </div>
          </section>

          <BuildPriceSidebar
            className="xl:row-span-2 xl:col-start-2 xl:row-start-1"
            meta={meta}
            selectedItems={selectedItems}
            mailto={mailto}
            copied={copied}
            onCopy={() => void copySummary()}
            receiptDomId="social-receipt"
            receiptHeading="Running receipt · social menu"
          />

          <section
            id="social-context"
            className="scroll-mt-28 min-w-0 space-y-4 xl:col-start-1"
            aria-labelledby="social-questionnaire-heading"
          >
            <h2
              id="social-questionnaire-heading"
              className="build-alice-copy text-lg font-semibold text-fuchsia-50/95"
            >
              {questionnaire.title}
            </h2>
            {questionnaire.description ? (
              <p className="build-alice-muted text-sm">{questionnaire.description}</p>
            ) : null}
            <div className="space-y-6">
              {questionnaire.steps.map((step) => (
                <fieldset
                  key={step.id}
                  className="rounded-lg border border-cyan-500/15 bg-[#0a0f18]/85 p-4"
                >
                  <legend className="px-1 text-sm font-medium text-cyan-100/90">
                    {step.question}
                  </legend>
                  <div
                    className="mt-3 flex flex-col gap-2"
                    role="radiogroup"
                    aria-label={step.question}
                  >
                    {step.options.map((opt) => {
                      const checked = answers[step.id] === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={cn(
                            "flex cursor-pointer gap-3 rounded-md border px-3 py-2 text-sm transition",
                            checked
                              ? "border-cyan-400/45 bg-cyan-950/30 text-cyan-50"
                              : "border-transparent bg-white/[0.03] text-slate-300 hover:border-fuchsia-500/20",
                          )}
                        >
                          <input
                            type="radio"
                            name={`social-${step.id}`}
                            value={opt.id}
                            checked={checked}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [step.id]: opt.id }))
                            }
                            className="mt-1 size-4 shrink-0 accent-cyan-500"
                          />
                          <span>
                            <span className="font-medium">{opt.label}</span>
                            {opt.description ? (
                              <span className="build-alice-muted mt-0.5 block text-xs">
                                {opt.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>
        </div>
      </main>

      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-fuchsia-500/25 bg-[#0a0514]/98 px-4 py-2 text-center text-[10px] leading-snug text-fuchsia-100/85 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] sm:hidden"
        role="status"
      >
        {meta.stickyDisclaimer}
      </div>
    </div>
  );
}
