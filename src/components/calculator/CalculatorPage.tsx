import Link from "next/link";
import { tacticalGuide, variableHint, workedExample } from "@/lib/calculators/copy";
import { calculatorHref, getCategory, oneLiner, SIDES, type Side } from "@/lib/calculators/data";
import type { Calculator } from "@/lib/calculators/types";
import { CalculatorPanel } from "./CalculatorPanel";

/** One template for every calculator on both sides (PROJECT_SPEC.md §3). */
export function CalculatorPage({ side, calc }: { side: Side; calc: Calculator }) {
  const meta = SIDES[side];
  const category = getCategory(side, calc.cat);
  const metric = calc.vars[calc.vars.length - 1];
  const example = workedExample(calc);
  const siblings = meta.calculators.filter((c) => c.cat === calc.cat && c.id !== calc.id);

  return (
    <article className="wrap py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href={meta.hub} className="font-semibold text-accent hover:text-accent-strong">
              {meta.label}
            </Link>
          </li>
          <li aria-hidden className="text-muted">/</li>
          <li>
            <Link href={`${meta.hub}#${category.slug}`} className="font-semibold text-accent hover:text-accent-strong">
              {category.label}
            </Link>
          </li>
          <li aria-hidden className="text-muted">/</li>
          <li aria-current="page" className="text-muted">
            {calc.name}
          </li>
        </ol>
      </nav>

      <header className="mt-6 max-w-4xl">
        <p className="eyebrow text-accent">
          {category.label} · {meta.label} calculator
        </p>
        <h1 className="mt-3 text-[clamp(2.25rem,6.5vw,5rem)] leading-[0.95] font-extrabold tracking-[-0.05em]">{calc.name}</h1>
        <p className="mt-4 text-lg text-muted sm:text-xl">{oneLiner(calc)}</p>
      </header>

      <div className="mt-8 sm:mt-10">
        <CalculatorPanel calc={calc} path={calculatorHref(side, calc.id)} />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-6">
        <Card tone="soft" n="A" title={`What is ${metric.label}?`}>
          <p>{calc.about}</p>
        </Card>

        <Card tone="ink" n="B" title="Worked example">
          {example ? (
            <p className="text-lg leading-relaxed">{example}</p>
          ) : (
            <p className="text-white/70">No worked example is available for these default values.</p>
          )}
          <p className="mt-4 font-mono text-sm text-white/60">{calc.formulaDisplay}</p>
        </Card>

        <Card tone="raised" n="C" title="Formula variable breakdown">
          <dl className="divide-y divide-line border-y border-line">
            {calc.vars.map((v, i) => (
              <div key={v.key} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt>
                  <span className="block font-mono text-sm text-accent">{v.key}</span>
                  <span className="block font-display text-sm font-semibold">
                    {v.label}
                    {i === calc.vars.length - 1 && <span className="ml-1 font-normal text-muted">(output)</span>}
                  </span>
                </dt>
                <dd className="text-sm text-muted">{variableHint(calc, i)}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card tone="outline" n="D" title="Tactical application guide">
          <p>{tacticalGuide(calc)}</p>
        </Card>
      </div>

      {siblings.length > 0 && (
        <section aria-labelledby="more-heading" className="mt-14 border-t-2 border-ink pt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="more-heading" className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold">
              More in {category.label}
            </h2>
            <Link href={`${meta.hub}#${category.slug}`} className="font-display font-semibold text-accent hover:text-accent-strong">
              All {category.label} calculators →
            </Link>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((s) => (
              <li key={s.id}>
                <Link href={calculatorHref(side, s.id)} className="glass group flex h-full flex-col gap-1 rounded-2xl p-4 hover:bg-accent-soft/80 sm:p-5">
                  <span className="flex items-baseline justify-between gap-3 font-display text-lg font-bold tracking-tight">
                    {s.name}
                    <span aria-hidden className="text-accent transition-transform group-hover:translate-x-1 motion-reduce:transition-none">
                      →
                    </span>
                  </span>
                  <span className="text-sm text-muted">{oneLiner(s)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

const TONES = {
  soft: { box: "rounded-3xl bg-accent-soft/85 backdrop-blur-xl", tag: "bg-accent text-on-accent", eyebrow: "text-accent-strong" },
  ink: { box: "glass-ink rounded-3xl text-white focus-on-dark", tag: "bg-white text-ink", eyebrow: "text-white/70" },
  raised: { box: "glass rounded-3xl", tag: "bg-ink text-white", eyebrow: "text-muted" },
  outline: { box: "glass rounded-3xl ring-2 ring-accent/50", tag: "bg-accent text-on-accent", eyebrow: "text-accent" },
} as const;

function Card({ tone, n, title, children }: { tone: keyof typeof TONES; n: string; title: string; children: React.ReactNode }) {
  const t = TONES[tone];
  return (
    <section className={`p-5 sm:p-7 ${t.box}`}>
      <div className="flex items-center gap-3">
        <span aria-hidden className={`grid size-7 place-items-center rounded-full font-display text-sm font-bold ${t.tag}`}>
          {n}
        </span>
        <h2 className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">{title}</h2>
      </div>
      <div className="mt-4 leading-relaxed">{children}</div>
    </section>
  );
}
