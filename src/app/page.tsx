import Link from "next/link";
import { CountUp } from "@/components/home/CountUp";
import { ScrollProgress } from "@/components/home/ScrollProgress";
import { Reveal } from "@/components/Reveal";
import { ONE_LINERS } from "@/content/one-liners";
import { BUY_CATEGORIES, COUNTS, SELL_CALCULATORS } from "@/lib/calculators/data";
import { NAV_GROUPS, PILLARS } from "@/lib/site";

const FORMULAS = [
  "CPM = (Spend ÷ Impressions) × 1000",
  "ROAS = Revenue ÷ Spend",
  "CTR = (Clicks ÷ Impressions) × 100",
  "RPM = (Revenue ÷ Pageviews) × 1000",
  "ROI = ((Revenue − Cost) ÷ Cost) × 100",
  "Fill Rate = (Filled ÷ Requests) × 100",
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Pillars />
      <Stats />
      <Marquee />
      <ToolIndex />
      <PullQuote />
    </>
  );
}

/* -------------------------------------------------------------------- */

function Hero() {
  return (
    <ScrollProgress className="relative overflow-hidden border-b-2 border-ink">
      <div className="wrap pt-10 pb-12 sm:pt-16 lg:pt-20 lg:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow text-red">Free · No login · Buy-side and sell-side</p>
          <p className="eyebrow text-muted">
            <span aria-hidden className="mr-2 inline-block size-2 bg-red align-middle" />
            {COUNTS.total} calculators · 0 paywalls
          </p>
        </div>

        <h1 className="display-xl mt-8 sm:mt-12">
          <span className="block will-change-transform [transform:translateX(calc(var(--p)*-18%))]">Ad math,</span>
          <span className="block pl-[8vw] will-change-transform [transform:translateX(calc(var(--p)*12%))]">minus the</span>
          <span className="block text-red will-change-transform [transform:translateX(calc(var(--p)*-30%))]">invoice.</span>
        </h1>

        <div className="mt-10 grid gap-8 border-t-2 border-ink pt-8 lg:mt-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <p className="max-w-2xl text-lg leading-relaxed sm:text-xl">
            {COUNTS.total} KPI calculators, a media mix model, planning tools and a creative specs
            library. The toolkit that usually costs hundreds to hundreds of thousands a year.{" "}
            <strong className="font-semibold">Here it&apos;s free.</strong>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={PILLARS.buy.href}
              className="inline-flex h-14 items-center justify-between gap-6 bg-red px-6 font-display font-semibold text-white transition-colors hover:bg-red-strong rounded-full"
            >
              Buy-side calculators <span aria-hidden>→</span>
            </Link>
            <Link
              href={PILLARS.sell.href}
              className="inline-flex h-14 items-center justify-between gap-6 bg-charcoal px-6 font-display font-semibold text-white transition-colors hover:bg-black rounded-full"
            >
              Sell-side calculators <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Formula tape: drifts sideways as you scroll. */}
      <div aria-hidden className="overflow-hidden border-t border-ink/10 bg-white/50 py-3 backdrop-blur">
        <p className="font-mono text-sm whitespace-nowrap text-muted will-change-transform [transform:translateX(calc(var(--p)*-40%))]">
          {[...FORMULAS, ...FORMULAS].map((f, i) => (
            <span key={i} className="mr-12">
              {f}
            </span>
          ))}
        </p>
      </div>
    </ScrollProgress>
  );
}

/* -------------------------------------------------------------------- */

function Pillars() {
  const cards = [
    {
      ...PILLARS.buy,
      n: "01",
      audience: "For media buyers",
      count: `${COUNTS.buySide} calculators · ${COUNTS.buyVerticals} verticals`,
      chips: BUY_CATEGORIES.map((c) => c.label),
      cta: "Open the buy-side hub",
      tone: "bg-red hover:bg-red-strong",
    },
    {
      ...PILLARS.sell,
      n: "02",
      audience: "For publishers and monetization teams",
      count: `${COUNTS.sellSide} calculators`,
      chips: SELL_CALCULATORS.map((c) => c.name),
      cta: "Open the sell-side hub",
      tone: "bg-charcoal hover:bg-black",
    },
  ];

  return (
    <section aria-labelledby="pillars-heading" className="wrap py-16 sm:py-24">
      <h2 id="pillars-heading" className="sr-only">
        Choose your side
      </h2>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {cards.map((c, i) => (
          <Reveal key={c.href} delay={i * 120} className="h-full">
            <Link
              href={c.href}
              className={`group focus-on-dark @container flex h-full min-h-[26rem] flex-col rounded-[2rem] p-6 shadow-[0_24px_60px_-24px_rgb(17_17_17/0.45)] text-white transition-colors sm:p-10 ${c.tone}`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Room for two lines side by side, so both card headings start at the same height. */}
                <p className="eyebrow text-white/80 md:min-h-[3em]">
                  {c.n} / {c.audience}
                </p>
                <span
                  aria-hidden
                  className="text-3xl leading-none transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none"
                >
                  ↗
                </span>
              </div>
              {/* Sized to the card, not the window, so "Buy-Side" and "Sell-Side" always fit on one line. */}
              <h3 className="mt-10 text-[clamp(2.5rem,19cqi,6.5rem)] leading-[0.95] font-extrabold tracking-[-0.055em] whitespace-nowrap">{c.label}</h3>
              <p className="mt-6 font-display text-lg font-semibold">{c.count}</p>
              <p className="mt-2 max-w-md text-white/85">{c.blurb}</p>
              <ul className="mt-8 flex flex-wrap gap-1.5" aria-label={`${c.label} coverage`}>
                {c.chips.map((chip) => (
                  <li key={chip} className="rounded-full border border-white/40 px-2.5 py-0.5 text-xs">
                    {chip}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-10 font-display font-semibold underline decoration-2 underline-offset-[6px]">{c.cta}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */

function Stats() {
  const stats = [
    { value: COUNTS.total, label: "KPI calculators", note: "Every field solvable, both directions" },
    { value: COUNTS.buyVerticals, label: "Buy-side verticals", note: "Display to DOOH, crypto to healthcare" },
    { value: COUNTS.sellSide, label: "Sell-side calculators", note: "Built for publishers, not borrowed" },
    { value: 0, prefix: "$", label: "To start", note: "No login, no trial, no sales call" },
  ];

  return (
    <section aria-labelledby="stats-heading" className="border-y border-ink/10">
      <div className="wrap py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="stats-heading" className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold">
            By the numbers
          </h2>
          <p className="max-w-sm text-muted">Everything below is open right now. Logging in only lets you save.</p>
        </div>
        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink/10 shadow-[0_12px_40px_-16px_rgb(17_17_17/0.22)] lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-2 bg-white/70 px-3 backdrop-blur-xl py-6 sm:px-5 lg:py-8">
              <dt className="eyebrow order-2 text-ink">{s.label}</dt>
              <dd className="order-1 font-display text-[clamp(3rem,9vw,6rem)] leading-none font-extrabold tracking-[-0.05em] text-red">
                <CountUp value={s.value} prefix={s.prefix} />
              </dd>
              <dd className="order-3 text-sm text-muted">{s.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */

function Marquee() {
  const items = ONE_LINERS.map((o) => (
    <li key={o.metric} className="flex shrink-0 items-center gap-3 pr-10 whitespace-nowrap">
      <span aria-hidden className="size-2 bg-white" />
      <span className="font-display font-bold">{o.metric}:</span>
      <span>{o.line}</span>
    </li>
  ));

  return (
    <section aria-label="KPIs in one line" className="marquee overflow-hidden bg-red py-5 text-lg text-white sm:text-xl">
      <div className="marquee-track flex w-max" style={{ "--marquee-duration": "80s" } as React.CSSProperties}>
        <ul className="flex">{items}</ul>
        <ul className="marquee-dupe flex" aria-hidden>
          {items}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */

function ToolIndex() {
  const tools = NAV_GROUPS.flatMap((g) => g.links.map((l) => ({ ...l, group: g.label })));

  return (
    <section aria-labelledby="index-heading" className="wrap py-16 sm:py-24">
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-red">Index</p>
          <h2 id="index-heading" className="mt-3 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold">
            Beyond the calculators.
          </h2>
          <p className="mt-4 max-w-sm text-muted">
            Planning, modelling, creative and governance tools that sit around the {COUNTS.total} KPIs.
          </p>
        </div>

        <ol className="border-t-2 border-ink">
          {tools.map((t, i) => (
            <Reveal as="li" key={t.href} delay={i * 60} className="border-b border-line">
              <Link
                href={t.href}
                className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 gap-y-1 rounded-2xl py-6 transition-colors hover:bg-white/70 sm:grid-cols-[4rem_1fr_auto] sm:px-4"
              >
                <span className="font-display text-sm font-semibold text-red tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-[clamp(1.6rem,4vw,2.75rem)] leading-none font-bold tracking-[-0.04em] transition-transform group-hover:translate-x-2 motion-reduce:transition-none">
                  {t.label}
                </span>
                <span aria-hidden className="text-2xl text-red transition-transform group-hover:translate-x-1 motion-reduce:transition-none">
                  →
                </span>
                <span className="col-start-2 col-end-4 mt-1 flex flex-wrap items-baseline gap-x-3 text-muted">
                  <span className="eyebrow text-ink">{t.group}</span>
                  {t.blurb}
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */

function PullQuote() {
  return (
    <section className="border-t-2 border-ink">
      <Reveal className="wrap py-20 sm:py-28">
        <figure className="grid gap-6 lg:grid-cols-[auto_1fr] lg:gap-12">
          <span aria-hidden className="font-display text-[8rem] leading-[0.7] font-extrabold text-red sm:text-[12rem]">
            “
          </span>
          <div>
            <blockquote className="font-display text-[clamp(1.75rem,4.5vw,3.75rem)] leading-[1.05] font-bold tracking-[-0.04em]">
              Every buyer and every publisher is doing the same math. Nobody should need a procurement cycle to check it.
            </blockquote>
            <figcaption className="eyebrow mt-8 text-muted">The thedigitalwit principle</figcaption>
          </div>
        </figure>
      </Reveal>
    </section>
  );
}
