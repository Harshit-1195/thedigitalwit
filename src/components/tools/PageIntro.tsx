import type { ReactNode } from "react";

/** Shared hero for tool pages: eyebrow, big title, short intro. */
export function PageIntro({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent: string; children: ReactNode }) {
  return (
    <section className="wrap pt-12 pb-10 sm:pt-16 lg:pt-20">
      <p className="eyebrow text-accent">{eyebrow}</p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <h1 className="text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
          {title} <span className="text-accent">{accent}</span>
        </h1>
        <div className="max-w-lg space-y-3 text-lg text-muted sm:text-xl">{children}</div>
      </div>
    </section>
  );
}
