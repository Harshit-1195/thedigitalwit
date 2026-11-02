import type { ReactNode } from "react";
import { SITE } from "@/lib/site";

// Shared shell for the privacy policy and terms: hero, "on this page" index and numbered sections.

export type LegalSection = { id: string; label: string };

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  updated: string;
  sections: LegalSection[];
  children: ReactNode;
}) {
  return (
    <>
      <section className="wrap pt-12 pb-10 sm:pt-16 lg:pt-20">
        <p className="eyebrow text-accent">{eyebrow}</p>
        <h1 className="mt-4 max-w-5xl text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted sm:text-xl">{intro}</p>
        <div className="mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl border-l-4 border-accent bg-accent-soft/85 backdrop-blur px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-4">
          <span className="font-display font-semibold">Last updated {updated}.</span>
          <span>
            Questions? Email <ContactEmail />.
          </span>
        </div>
      </section>

      <div className="wrap grid gap-10 border-t-2 border-ink pt-10 pb-20 lg:grid-cols-[15rem_1fr] lg:gap-16">
        <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-muted">On this page</p>
          <ol className="mt-3 border-t border-line">
            {sections.map((s, i) => (
              <li key={s.id} className="border-b border-line">
                <a href={`#${s.id}`} className="flex gap-3 py-2.5 font-display text-sm font-semibold hover:text-accent">
                  <span className="text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="max-w-3xl min-w-0 space-y-16 leading-relaxed">{children}</article>
      </div>
    </>
  );
}

export function Section({ n, id, title, children }: { n: number; id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-28">
      <p className="eyebrow text-accent">{String(n).padStart(2, "0")}</p>
      <h2 id={`${id}-h`} className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-extrabold">
        {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pt-2">
      <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.02em]">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="list-square space-y-2 pl-5">{children}</ul>;
}

export function ContactEmail() {
  return (
    <a href={`mailto:${SITE.contactEmail}`} className="font-semibold break-all text-accent-strong underline underline-offset-4">
      {SITE.contactEmail}
    </a>
  );
}
