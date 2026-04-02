"use client";

import { useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProgression } from "@/lib/progression";

type GodotDemoEmbedProps = {
  demoEnabled?: boolean;
  demoSlug?: string;
  demoUrl?: string;
  demoTitle?: string;
  demoNotes?: string;
  demoFallbackHref?: string;
  className?: string;
  /** Default true: hide iframe behind progression Level 1. */
  requiresProgression?: boolean;
  /** Default false: when true, iframe section starts open. */
  defaultOpen?: boolean;
};

export function GodotDemoEmbed({
  demoEnabled,
  demoSlug,
  demoUrl,
  demoTitle,
  demoNotes,
  demoFallbackHref,
  className,
  requiresProgression = true,
  defaultOpen = false,
}: GodotDemoEmbedProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { levelOneComplete, openOverlay } = useProgression();

  const src = useMemo(() => {
    const slug = demoSlug?.trim();
    if (slug) return `/demos/${slug}/index.html`;
    const external = demoUrl?.trim();
    if (external) return external;
    return undefined;
  }, [demoSlug, demoUrl]);

  if (!demoEnabled || !src) {
    return null;
  }

  if (requiresProgression && !levelOneComplete) {
    return (
      <div
        className={cn(
          "rounded-lg border border-white/10 bg-[#050810]/85 p-3 backdrop-blur-sm",
          className,
        )}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-amber-200/85">
          Demo locked
        </p>
        <p className="neon-sign-body mt-2 text-xs leading-relaxed">
          Level up once to unlock interactive demos.
        </p>
        <button
          type="button"
          onClick={() => openOverlay({ openForm: true })}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-3 h-8 border-amber-500/40 text-amber-100 hover:bg-amber-950/30",
          )}
        >
          Unlock with Level 1
        </button>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-white/10 bg-[#050810]/85 p-3 backdrop-blur-sm", className)}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-cyan-300/90">
          {demoTitle ?? "Interactive demo"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 border-cyan-500/35 text-cyan-200 hover:bg-cyan-950/30"
            )}
          >
            {isOpen ? "Hide demo" : "Launch demo"}
          </button>
          <a
            href={demoFallbackHref ?? src}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 border-white/20 text-white/85 hover:bg-white/5"
            )}
          >
            Open new tab
          </a>
        </div>
      </div>
      {demoNotes ? (
        <p className="neon-sign-body mb-2 text-xs leading-relaxed">{demoNotes}</p>
      ) : null}
      {isOpen ? (
        <div className="relative aspect-video min-h-[200px] overflow-hidden rounded-md border border-white/10 bg-black touch-manipulation [transform:translateZ(0)] sm:min-h-0">
          <iframe
            title={demoTitle ?? "Godot demo"}
            src={src}
            className="absolute inset-0 size-full border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals"
            allow="fullscreen; autoplay; encrypted-media; gyroscope; accelerometer; gamepad *; clipboard-write"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-white/15 bg-black/25 px-3 py-4 text-xs text-muted-foreground">
          Demo is ready but not loaded yet. Use "Launch demo" to start it.
        </div>
      )}
    </div>
  );
}
