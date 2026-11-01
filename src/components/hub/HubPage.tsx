import { calculatorHref, oneLiner, SIDES, type Side } from "@/lib/calculators/data";
import { CalculatorHub } from "./CalculatorHub";

const COPY: Record<Side, { eyebrow: string; intro: (n: number, groups: number) => string; scope: string }> = {
  buy: {
    eyebrow: "Pillar 01 / For media buyers",
    intro: (n, g) =>
      `${n} KPI calculators across ${g} verticals. Fill in any two fields and the third solves itself, in whichever direction your plan needs.`,
    scope: "buy-side calculators",
  },
  sell: {
    eyebrow: "Pillar 02 / For publishers and monetization teams",
    intro: (n) =>
      `${n} KPI calculators for yield, fill, header bidding and deal health. Same engine as the buy-side: fill in any two fields and the third solves itself.`,
    scope: "sell-side calculators",
  },
};

/** Shared hub layout for both pillars; the sell-side accent comes from its layout. */
export function HubPage({ side }: { side: Side }) {
  const meta = SIDES[side];
  const copy = COPY[side];
  const [first, second] = meta.label.split("-");
  const items = meta.calculators.map((c) => ({
    id: c.id,
    cat: c.cat,
    name: c.name,
    desc: oneLiner(c),
    href: calculatorHref(side, c.id),
    formula: c.formulaDisplay,
  }));

  return (
    <>
      <section className="wrap pt-12 pb-10 sm:pt-16 lg:pt-20">
        <p className="eyebrow text-accent">{copy.eyebrow}</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h1 className="text-[clamp(3rem,10vw,8rem)] leading-[0.88] font-extrabold tracking-[-0.055em]">
            {first}-<span className={side === "buy" ? "text-accent" : "inline-block rounded-[0.18em] bg-accent px-[0.1em] pb-[0.08em] leading-[0.92] text-on-accent"}>{second}</span>
          </h1>
          <p className="max-w-lg text-lg text-muted sm:text-xl">{copy.intro(items.length, meta.categories.length)}</p>
        </div>
      </section>
      <CalculatorHub items={items} categories={meta.categories} scopeLabel={copy.scope} />
    </>
  );
}
