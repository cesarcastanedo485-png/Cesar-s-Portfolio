import Link from "next/link";
import { nav } from "@/lib/content";

export function Header() {
  const internal = nav.links.filter((l) => !l.external);
  const external = nav.links.filter((l) => l.external);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex min-h-14 flex-col gap-3 px-4 py-3 sm:px-6 md:min-h-16 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e17]"
        >
          <Logo />
          <span className="text-lg font-semibold text-foreground">
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
                className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 sm:px-3 sm:py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <span
            className="hidden h-4 w-px shrink-0 bg-white/15 md:block"
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
                className="rounded-md px-2.5 py-1.5 text-sm text-cyan-200/85 transition-colors hover:text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 sm:px-3 sm:py-2"
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

function Logo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground"
      aria-hidden
    >
      <path
        d="M8 6L8 22L14 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 6L20 22L14 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
