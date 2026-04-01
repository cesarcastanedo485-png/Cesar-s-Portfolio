import Link from "next/link";
import { Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { contactContent } from "@/lib/content";

function buildMailto(email: string, subject?: string) {
  const base = `mailto:${email.trim()}`;
  if (!subject?.trim()) return base;
  return `${base}?subject=${encodeURIComponent(subject.trim())}`;
}

export function ContactSection() {
  const {
    sectionEyebrow,
    headline,
    body,
    email,
    emailButtonLabel,
    emailSubject,
    secondaryLinks,
  } = contactContent;

  const mailto = email?.includes("@") ? buildMailto(email, emailSubject) : null;

  return (
    <section
      id="contact"
      className="scroll-mt-24 py-16"
      aria-labelledby="contact-heading"
    >
      <div className="container mx-auto max-w-3xl px-6">
        <div className="section-glass-panel px-6 py-8 sm:px-10 sm:py-10">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-cyan-200/70">
            {sectionEyebrow}
          </p>
          <h2
            id="contact-heading"
            className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl"
          >
            {headline}
          </h2>
          <p className="neon-sign-body mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed md:text-base">
            {body}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            {mailto ? (
              <a
                href={mailto}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex w-full gap-2 border border-cyan-500/35 bg-cyan-950/30 text-cyan-100 hover:bg-cyan-950/50 sm:w-auto"
                )}
              >
                <Mail className="size-5 shrink-0" aria-hidden />
                {emailButtonLabel ?? "Email"}
              </a>
            ) : null}
            {secondaryLinks?.map((link) => {
              const external = link.external ?? /^https?:\/\//.test(link.href);
              const className = cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full border-white/20 sm:w-auto"
              );
              if (external) {
                return (
                  <a
                    key={link.href + link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {link.label}
                  </a>
                );
              }
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className={className}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
