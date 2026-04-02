"use client";

import { useState } from "react";
import { ChevronUp, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { contactContent } from "@/lib/content";
import { CONTACT_UNLOCK_LEVEL, useProgression } from "@/lib/progression";

function buildMailto(email: string, subject?: string) {
  const base = `mailto:${email.trim()}`;
  if (!subject?.trim()) return base;
  return `${base}?subject=${encodeURIComponent(subject.trim())}`;
}

export function ContactSection() {
  const [open, setOpen] = useState(false);
  const { experienceMode, currentLevel, redPillUnlocks } = useProgression();
  const {
    sectionEyebrow,
    headline,
    body,
    email,
    emailButtonLabel,
    emailSubject,
  } = contactContent;

  const mailto = email?.includes("@") ? buildMailto(email, emailSubject) : null;
  const contactLocked = experienceMode === "wonderland" && !redPillUnlocks.contact;

  return (
    <section
      id="contact"
      className="scroll-mt-24 py-16"
      aria-labelledby="contact-heading"
    >
      <div className="container mx-auto max-w-3xl px-6">
        <div
          className={cn(
            "rounded-2xl border transition-[background,box-shadow,backdrop-filter] duration-300",
            open
              ? "section-glass-panel border-white/15 px-6 py-8 shadow-lg backdrop-blur-md sm:px-10 sm:py-10"
              : "border-cyan-400/15 bg-transparent shadow-none backdrop-blur-none",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h2
              id="contact-heading"
              className="min-w-0 flex-1 text-center text-2xl font-semibold tracking-tight text-white md:text-left md:text-3xl"
            >
              {headline}
            </h2>
            <button
              type="button"
              onClick={() => {
                if (contactLocked) return;
                setOpen((v) => !v);
              }}
              disabled={contactLocked}
              className={cn(
                "mx-auto shrink-0 rounded-full border-2 px-5 py-2 text-sm font-bold uppercase tracking-wide transition md:mx-0",
                "shadow-[0_0_18px_rgba(59,130,246,0.45),0_0_2px_rgba(147,197,253,0.9)]",
                "border-[#38bdf8] bg-[#0c1829]/80 text-[#7dd3fc]",
                "hover:border-sky-300 hover:bg-[#152a45]/90 hover:shadow-[0_0_26px_rgba(56,189,248,0.55)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/80",
                open && "border-sky-200 bg-[#1a3050]/95 text-sky-100",
                contactLocked &&
                  "cursor-not-allowed border-sky-600/60 bg-[#0b1320]/80 text-sky-300/60 hover:border-sky-600/60 hover:bg-[#0b1320]/80 hover:shadow-[0_0_18px_rgba(59,130,246,0.2)]",
              )}
              aria-expanded={open}
              aria-controls="contact-panel"
            >
              {open && !contactLocked ? (
                <span className="inline-flex items-center gap-1.5">
                  <ChevronUp className="size-4" aria-hidden />
                  Close
                </span>
              ) : (
                "Contact"
              )}
            </button>
          </div>
          {contactLocked ? (
            <p className="mt-2 text-center text-xs text-cyan-200/70 md:text-left">
              Contact unlocks at Level {CONTACT_UNLOCK_LEVEL}. Current Level: {currentLevel}.
            </p>
          ) : null}

          <div id="contact-panel" hidden={!open}>
            <p className="mb-4 mt-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-cyan-200/70 md:text-left">
              {sectionEyebrow}
            </p>
            <p className="neon-sign-body mx-auto mt-2 max-w-xl text-center text-sm leading-relaxed md:mx-0 md:text-left md:text-base">
              {body}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap md:justify-start">
              {mailto ? (
                <a
                  href={mailto}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "inline-flex w-full gap-2 border border-cyan-500/35 bg-cyan-950/30 text-cyan-100 hover:bg-cyan-950/50 sm:w-auto",
                  )}
                >
                  <Mail className="size-5 shrink-0" aria-hidden />
                  {emailButtonLabel ?? "Email"}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
