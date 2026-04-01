"use client";

import { useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GodotDemoEmbedProps = {
  demoEnabled?: boolean;
  demoSlug?: string;
  demoTitle?: string;
  demoNotes?: string;
  demoFallbackHref?: string;
  className?: string;
};

export function GodotDemoEmbed({
  demoEnabled,
  demoSlug,
  demoTitle,
  demoNotes,
  demoFallbackHref,
  className,
}: GodotDemoEmbedProps) {
  const [isOpen, setIsOpen] = useState(false);

  const src = useMemo(() => {
    const slug = demoSlug?.trim();
    if (!slug) return undefined;
    return `/demos/${slug}/index.html`;
  }, [demoSlug]);

  if (!demoEnabled || !src) {
    return null;
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
