"use client";

import Link from "next/link";
import { nav } from "@/lib/content";
import { useProgression } from "@/lib/progression";

export function Header() {
  const { canAccessOracle } = useProgression();
  const internal = nav.links.filter((l) => {
    if (l.external) return false;
    if (l.href === "/oracle-3d" && !canAccessOracle) return false;
    return true;
  });
  const external = nav.links.filter((l) => l.external);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-fuchsia-500/15 bg-background/92 backdrop-blur-xl">
      <div className="container mx-auto flex min-h-14 flex-col gap-3 px-4 py-3 sm:px-6 md:min-h-16 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e17]"
        >
          <BrandMark />
          <span className="header-brand-word text-lg md:text-xl">
            {nav.brandLabel}
          </span>
        </Link>
        <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-x-3 md:gap-y-1">
          <nav
            className="flex flex-wrap items-center gap-1 sm:gap-2 md:justify-end"
            aria-label="Primary"
          >
            {internal.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-fuchsia-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/45 sm:px-3 sm:py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <span
            className="hidden h-4 w-px shrink-0 bg-gradient-to-b from-transparent via-fuchsia-500/35 to-transparent md:block"
            aria-hidden
          />
          <nav
            className="flex flex-wrap items-center gap-1 border-t border-white/10 pt-2 md:border-t-0 md:pt-0 sm:gap-2"
            aria-label="Social and links"
          >
            {external.map((link) => (
              <a
                key={link.href + link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-2.5 py-1.5 text-sm text-fuchsia-200/90 transition-colors hover:text-pink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/50 sm:px-3 sm:py-2"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

/** Soft diamond mark — reads as a gem / spark, not letterforms like “L I”. */
function BrandMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="header-mark-glow shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient
          id="headerMarkGrad"
          x1="4"
          y1="4"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f0abfc" />
          <stop offset="0.45" stopColor="#e879f9" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <path
        d="M14 4l8.5 8.5L14 24 5.5 12.5 14 4z"
        stroke="url(#headerMarkGrad)"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="rgba(168,85,247,0.12)"
      />
      <circle cx="14" cy="12.5" r="2" fill="#fce7f3" opacity="0.95" />
    </svg>
  );
}
