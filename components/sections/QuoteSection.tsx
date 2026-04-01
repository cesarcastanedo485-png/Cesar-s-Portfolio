import { quoteContent } from "@/lib/content";

export function QuoteSection() {
  return (
    <section className="py-16" aria-label="Quote">
      <div className="container mx-auto px-6 text-center">
        <blockquote className="font-serif text-xl italic md:text-2xl">
          <span className="quote-neon-turquoise">
            &ldquo;{quoteContent.text}&rdquo;
          </span>
        </blockquote>
      </div>
    </section>
  );
}
