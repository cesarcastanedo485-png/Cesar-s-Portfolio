"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BuildExperienceBar } from "@/components/build/BuildExperienceBar";
import { BuildPriceSidebar } from "@/components/build/BuildPriceSidebar";
import {
  listSelectedItemsInOrderFrom,
  type BuildMenuData,
  type BuildMenuItem,
} from "@/lib/build-menu";
import { isItemDisabled, toggleModuleSelection } from "@/lib/build-selection";
import { contactContent } from "@/lib/content";
import { cn } from "@/lib/utils";

export type PackagesBuilderVariant = "website" | "social" | "app";

const jumpClassDefault =
  "inline-flex rounded-full border border-fuchsia-500/35 bg-fuchsia-950/25 px-3 py-1.5 text-xs font-medium text-fuchsia-100/90 transition hover:border-cyan-400/40 hover:bg-cyan-950/20 hover:text-cyan-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0514]";

const jumpClassMushroom =
  "inline-flex rounded-full border border-emerald-500/35 bg-emerald-950/25 px-3 py-1.5 text-xs font-medium text-emerald-100/90 transition hover:border-violet-400/40 hover:bg-violet-950/25 hover:text-violet-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030b08]";

function makeMailBody(
  variant: PackagesBuilderVariant,
  data: BuildMenuData,
  selected: BuildMenuItem[],
  answers: Record<string, string>,
): string {
  const lines: string[] = [];
  lines.push(
    variant === "website"
      ? "À la carte scope (from portfolio builder)"
      : variant === "social"
        ? "Social à la carte scope (from portfolio)"
        : "Android app à la carte scope (from portfolio)",
  );
  lines.push("");
  lines.push(variant === "website" ? "— Context (optional questionnaire) —" : "— Context —");
  for (const step of data.questionnaire.steps) {
    const optId = answers[step.id];
    const opt = step.options.find((o) => o.id === optId);
    lines.push(`${step.question}: ${opt?.label ?? "(not set)"}`);
  }
  lines.push("");
  lines.push("— Selected modules —");
  if (!selected.length) {
    lines.push("(none selected yet)");
  } else {
    for (const item of selected) {
      lines.push(`• ${item.label}`);
      lines.push(`  ${item.priceHint.display}`);
      if (item.monthlyNote) lines.push(`  Note: ${item.monthlyNote}`);
    }
  }
  lines.push("");
  lines.push(data.meta.longDisclaimer);
  return lines.join("\n");
}

type PackagesBuilderClientProps = {
  variant: PackagesBuilderVariant;
  data: BuildMenuData;
};

export function PackagesBuilderClient({ variant, data }: PackagesBuilderClientProps) {
  const { meta, questionnaire, categories } = data;
  const isApp = variant === "app";
  const isSocial = variant === "social";

  const ids = useMemo(() => {
    if (variant === "social") {
      return {
        prices: "social-prices",
        receipt: "social-receipt",
        context: "social-context",
        qHeading: "social-questionnaire-heading",
      };
    }
    if (variant === "app") {
      return {
        prices: "app-prices",
        receipt: "app-receipt",
        context: "app-context",
        qHeading: "app-questionnaire-heading",
      };
    }
    return {
      prices: "prices",
      receipt: "receipt",
      context: "build-context",
      qHeading: "questionnaire-heading",
    };
  }, [variant]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [openCategoryId, setOpenCategoryId] = useState<string>(
    () => categories[0]?.id ?? "",
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedItems = useMemo(
    () => listSelectedItemsInOrderFrom(categories, selectedSet),
    [categories, selectedSet],
  );

  const setToOrderedIds = useCallback(
    (set: Set<string>) => listSelectedItemsInOrderFrom(categories, set).map((i) => i.id),
    [categories],
  );

  const toggleItem = useCallback(
    (item: BuildMenuItem) => {
      const on = !selectedIds.includes(item.id);
      const next = toggleModuleSelection(selectedSet, item.id, on, categories);
      setSelectedIds(setToOrderedIds(next));
    },
    [categories, selectedIds, selectedSet, setToOrderedIds],
  );

  const mailto = useMemo(() => {
    const email = contactContent.email?.trim();
    if (!email?.includes("@")) return null;
    const body = makeMailBody(variant, data, selectedItems, answers);
    const subject = meta.mailSubject;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [answers, data, meta.mailSubject, selectedItems, variant]);

  const copySummary = useCallback(async () => {
    const text = makeMailBody(variant, data, selectedItems, answers);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [answers, data, selectedItems, variant]);

  const jumpClass = isApp ? jumpClassMushroom : jumpClassDefault;

  const shellClass = isApp
    ? "build-rabbit-hole build-app-mushroom min-h-screen bg-gradient-to-b from-[#030b08] via-[#0a1020] to-[#020408] text-slate-100"
    : "build-rabbit-hole min-h-screen bg-gradient-to-b from-[#0a0514] via-[#12081f] to-[#040208] text-slate-100";

  const headerBar = isApp
    ? "border-emerald-500/25 bg-[#030b08]/94"
    : "border-fuchsia-500/20 bg-[#0a0514]/94";

  const brandLine = isApp
    ? "Spore transit · à la carte (Android app)"
    : isSocial
      ? "Social orbit · à la carte (social media)"
      : "Cheshire Transit · à la carte (website)";

  const heroBadge = isApp ? "(Android app)" : isSocial ? "(social media)" : "(website)";
  const heroBadgeClass = isApp ? "text-emerald-200/85" : "text-fuchsia-200/80";

  const priceMenuTitle = isApp
    ? "Price menu · Android app line items"
    : isSocial
      ? "Price menu · social line items"
      : "Price menu · line items";

  const priceMenuBlurb = isApp
    ? "Toggle stacks, APK/Play, and ASO modules. Conflicting radios swap automatically—still not a final quote."
    : isSocial
      ? "Toggle packages and add-ons. Nothing here is a final quote—email the receipt when you're ready."
      : "Toggle what you want explored. Conflicting options (like Square vs Stripe) swap automatically. Nothing here is a final quote.";

  const receiptHeading = isApp
    ? "Running receipt · Android app menu"
    : isSocial
      ? "Running receipt · social menu"
      : "Running receipt · price menu";

  const fieldsetShell = isApp
    ? "rounded-xl border border-emerald-500/25 bg-[#061210]/90 p-4 shadow-[0_0_24px_rgba(52,211,153,0.08)] sm:p-5"
    : "rounded-xl border border-fuchsia-500/20 bg-[#100818]/90 p-4 shadow-[0_0_24px_rgba(168,85,247,0.06)] sm:p-5";

  const legendClass = isApp ? "px-1 text-base font-semibold text-emerald-100/95" : "px-1 text-base font-semibold text-fuchsia-100/95";

  const itemOn = isApp
    ? "border-emerald-400/50 bg-gradient-to-br from-emerald-950/45 to-[#040c10]/95 text-emerald-50 shadow-[0_0_28px_rgba(139,92,246,0.12)]"
    : "border-cyan-400/45 bg-gradient-to-br from-fuchsia-950/50 to-[#0c0614]/95 text-fuchsia-50 shadow-[0_0_28px_rgba(0,212,255,0.1)]";

  const itemOff = isApp
    ? "border-white/10 bg-black/25 text-slate-200 hover:border-emerald-500/35 hover:bg-black/35"
    : "border-white/10 bg-black/25 text-slate-200 hover:border-fuchsia-500/35 hover:bg-black/35";

  const checkOn = isApp
    ? "border-emerald-400/80 bg-[#061814] text-emerald-200"
    : "border-cyan-400/80 bg-[#1a0a24] text-cyan-200";

  const checkOff = isApp ? "border-emerald-800/50 bg-[#050810]" : "border-fuchsia-800/50 bg-[#0a0610]";

  const tagPill = isApp
    ? "rounded border border-emerald-500/25 bg-emerald-950/25 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-200/80"
    : "rounded border border-fuchsia-500/20 bg-fuchsia-950/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-fuchsia-200/75";

  const monoPrice = isApp ? "text-violet-200/90" : "text-cyan-200/90";

  const qFieldset = isApp
    ? "rounded-lg border border-violet-500/20 bg-[#060e14]/85 p-4"
    : "rounded-lg border border-cyan-500/15 bg-[#0a0f18]/85 p-4";

  const qLegend = isApp ? "px-1 text-sm font-medium text-violet-100/90" : "px-1 text-sm font-medium text-cyan-100/90";

  const radioChecked = isApp
    ? "border-emerald-400/45 bg-emerald-950/30 text-emerald-50"
    : "border-cyan-400/45 bg-cyan-950/30 text-cyan-50";

  const radioUnchecked = isApp
    ? "border-transparent bg-white/[0.03] text-slate-300 hover:border-emerald-500/25"
    : "border-transparent bg-white/[0.03] text-slate-300 hover:border-fuchsia-500/20";

  const heroBorder = isApp ? "border-emerald-500/20" : "border-fuchsia-500/15";
  const disclaimerBox = isApp
    ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-100/90"
    : "border-fuchsia-500/30 bg-fuchsia-950/20 text-fuchsia-100/90";

  const homeLinkClass = isApp
    ? "text-emerald-200/90 hover:text-emerald-50 focus-visible:ring-emerald-500/50"
    : "text-cyan-200/90 hover:text-cyan-50 focus-visible:ring-fuchsia-500/50";

  const ringOffset = isApp ? "focus-visible:ring-offset-[#030b08]" : "focus-visible:ring-offset-[#0a0514]";

  return (
    <div className={shellClass}>
      <header className={cn("sticky top-0 z-40 border-b backdrop-blur-md", headerBar)}>
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className={cn(
                  "inline-flex items-center gap-2 rounded-md text-sm transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2",
                  homeLinkClass,
                  ringOffset,
                )}
              >
                <ArrowLeft className="size-4 shrink-0 opacity-80" aria-hidden />
                Portfolio home
              </Link>
              {variant === "website" ? (
                <Link
                  href="/social"
                  className="rounded-full border border-pink-500/35 bg-pink-950/20 px-2.5 py-1 text-[11px] font-medium text-pink-100/90 transition hover:border-pink-400/50 hover:bg-pink-900/30 focus-visible:outline focus-visible:ring-2 focus-visible:ring-pink-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0514]"
                >
                  À la carte (social)
                </Link>
              ) : null}
              {variant === "website" ? (
                <Link href="/apps" className={jumpClassMushroom}>
                  À la carte (Android app)
                </Link>
              ) : null}
              {variant === "social" ? (
                <>
                  <Link href="/oracle-3d" className={jumpClass}>
                    Website a la carte
                  </Link>
                  <Link href="/apps" className={jumpClassMushroom}>
                    Android app packages
                  </Link>
                </>
              ) : null}
              {variant === "app" ? (
                <>
                  <Link href="/oracle-3d" className={jumpClass}>
                    Website a la carte
                  </Link>
                  <Link href="/social" className={jumpClassDefault}>
                    Social packages
                  </Link>
                </>
              ) : null}
            </div>
            <p
              className={cn(
                "max-w-[min(100%,240px)] text-right font-mono text-[10px] uppercase leading-snug tracking-[0.18em] sm:max-w-none",
                isApp ? "text-emerald-300/75" : "text-fuchsia-300/75",
              )}
            >
              {brandLine}
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
        <div className={cn("mb-8 border-b pb-8", heroBorder)}>
          <h1 className="build-alice-copy text-3xl font-semibold tracking-tight sm:text-4xl [font-family:var(--font-orbitron),system-ui,sans-serif]">
            {meta.heroTitle}{" "}
            <span className={cn("text-lg font-normal sm:text-xl", heroBadgeClass)}>{heroBadge}</span>
          </h1>
          <p className="build-alice-muted mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
            {meta.heroSubtitle}
          </p>
          {isSocial ? (
            <div className="mt-4 rounded-lg border border-cyan-500/20 bg-[#0c1020]/80 p-4 text-sm text-cyan-100/85">
              <p className="font-medium text-cyan-50/95">Orbit map</p>
              <p className="build-alice-muted mt-1 text-xs">
                Planet / moons art goes here when you&apos;re ready—this box is a placeholder for your
                cyberpunk scene or Meshy export.
              </p>
            </div>
          ) : null}
          {isApp ? (
            <div className="mt-4 rounded-lg border border-violet-500/25 bg-[#060e14]/85 p-4 text-sm text-violet-100/88">
              <p className="font-medium text-emerald-100/95">Underland spore lane</p>
              <p className="build-alice-muted mt-1 text-xs leading-relaxed">
                Each category is a cap on the stem—light them by selecting line items. Same ticket
                terminal as the website builder, different forest palette.
              </p>
            </div>
          ) : null}
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="On this page">
            <a href={`#${ids.prices}`} className={jumpClass}>
              Price menu
            </a>
            <a href={`#${ids.receipt}`} className={jumpClass}>
              Running receipt
            </a>
            <a href={`#${ids.context}`} className={jumpClass}>
              Context questions
            </a>
          </nav>
          <p
            className={cn(
              "mt-4 rounded-md border px-3 py-2 text-xs leading-relaxed",
              disclaimerBox,
            )}
          >
            {meta.stickyDisclaimer}
          </p>
        </div>

        <div className="flex flex-col gap-10 xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-12">
          <section id={ids.prices} className="scroll-mt-28 min-w-0 space-y-3 xl:col-start-1">
            <h2
              className={cn(
                "build-alice-copy text-xl font-semibold sm:text-2xl",
                isApp ? "text-emerald-50/95" : "text-fuchsia-50/95",
              )}
            >
              {priceMenuTitle}
            </h2>
            <p className="build-alice-muted text-sm">{priceMenuBlurb}</p>
            <div className="mt-6 space-y-8">
              {categories.map((cat) => (
                <fieldset key={cat.id} className={fieldsetShell}>
                  <legend className="sr-only">{cat.label}</legend>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md px-1 py-1 text-left transition",
                      isApp
                        ? "text-emerald-100/95 hover:text-emerald-50"
                        : "text-fuchsia-100/95 hover:text-fuchsia-50",
                    )}
                    aria-expanded={openCategoryId === cat.id}
                    onClick={() => setOpenCategoryId(cat.id)}
                  >
                    <span className={legendClass}>{cat.label}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                        isApp
                          ? "border-emerald-500/35 bg-emerald-950/25 text-emerald-200/90"
                          : "border-fuchsia-500/30 bg-fuchsia-950/20 text-fuchsia-200/90",
                      )}
                    >
                      {cat.items.filter((item) => selectedSet.has(item.id)).length} selected
                    </span>
                  </button>
                  {openCategoryId === cat.id ? (
                    <>
                      {cat.description ? (
                        <p className="build-alice-muted mb-4 mt-1 text-xs sm:text-sm">{cat.description}</p>
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
                                  on ? itemOn : itemOff,
                                  itemDisabled && "cursor-not-allowed opacity-45 hover:border-white/10",
                                )}
                              >
                                <span
                                  className={cn(
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 font-mono text-[11px]",
                                    on ? checkOn : checkOff,
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
                                    <span
                                      className={cn(
                                        "font-mono text-[11px] font-semibold",
                                        monoPrice,
                                      )}
                                    >
                                      {item.priceHint.display}
                                    </span>
                                    {item.tags?.length ? (
                                      <span className="flex flex-wrap gap-1">
                                        {item.tags.map((t) => (
                                          <span key={t} className={tagPill}>
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
                                  {item.monthlyNote ? (
                                    <span className="build-alice-muted mt-1 block text-[11px] text-sky-300/85">
                                      {item.monthlyNote}
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                              {reason ? (
                                <p id={`${item.id}-hint`} className="mt-1 pl-8 text-xs text-amber-300/85">
                                  {reason}
                                </p>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : null}
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
            receiptDomId={ids.receipt}
            receiptHeading={receiptHeading}
            tone={isApp ? "mushroom" : "default"}
            categories={isApp ? categories : undefined}
            selectedIds={isApp ? selectedSet : undefined}
          />

          <section
            id={ids.context}
            className="scroll-mt-28 min-w-0 space-y-4 xl:col-start-1"
            aria-labelledby={ids.qHeading}
          >
            <h2
              id={ids.qHeading}
              className={cn(
                "build-alice-copy text-lg font-semibold",
                isApp ? "text-emerald-50/95" : "text-fuchsia-50/95",
              )}
            >
              {questionnaire.title}
            </h2>
            {questionnaire.description ? (
              <p className="build-alice-muted text-sm">{questionnaire.description}</p>
            ) : null}
            <div className="space-y-6">
              {questionnaire.steps.map((step) => (
                <fieldset key={step.id} className={qFieldset}>
                  <legend className={qLegend}>{step.question}</legend>
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
                            checked ? radioChecked : radioUnchecked,
                          )}
                        >
                          <input
                            type="radio"
                            name={`${variant}-${step.id}`}
                            value={opt.id}
                            checked={checked}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [step.id]: opt.id }))
                            }
                            className={cn(
                              "mt-1 size-4 shrink-0",
                              isApp ? "accent-emerald-500" : "accent-cyan-500",
                            )}
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
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 border-t px-4 py-2 text-center text-[10px] leading-snug shadow-[0_-8px_24px_rgba(0,0,0,0.45)] sm:hidden",
          isApp
            ? "border-emerald-500/25 bg-[#030b08]/98 text-emerald-100/85"
            : "border-fuchsia-500/25 bg-[#0a0514]/98 text-fuchsia-100/85",
        )}
        role="status"
      >
        {meta.stickyDisclaimer}
      </div>
    </div>
  );
}
