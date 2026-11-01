"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildGeoBenchmark, buildPlan, type GeoBenchmark, type Plan, type Severity } from "@/lib/gtm/build";
import { BUDGETS, COLORS, GEOS, GOALS, INDUSTRIES, STAGES } from "@/lib/gtm/data";
import { gtmBudgetId, GTM_SPEC } from "@/lib/ai/specs";
import type { Filled } from "@/lib/ai/fill";
import { DescribeBox } from "@/components/ai/DescribeBox";

// The plan is computed in the browser from static data and nothing is stored. The only request is the
// optional "Describe your case" box, which sends its text to /api/ai-fill when AI is switched on.

const GOOD = "#15803d";
const WARN = "#b45309";
const BAD = "#b91c1c";
const SEV: Record<Severity, string> = { High: BAD, Medium: WARN, Low: GOOD };

type Tab = "foundation" | "benchmark" | "tactical" | "governance";
const TABS: { id: Tab; label: string }[] = [
  { id: "foundation", label: "Strategic Foundation" },
  { id: "benchmark", label: "Market Benchmark" },
  { id: "tactical", label: "Tactical Execution" },
  { id: "governance", label: "Governance & Risk" },
];

const card = "glass rounded-3xl p-5 sm:p-6";
const select = "mt-2 h-11 w-full rounded-xl border-2 border-ink bg-white/70 px-3";

export function GtmGenerator() {
  const id = useId();
  const [sel, setSel] = useState({ industry: "saas", geo: "na", goal: "demand", stage: "growth", budget: "b3" });
  const [notes, setNotes] = useState("");
  const [generated, setGenerated] = useState(false);
  const [tab, setTab] = useState<Tab>("foundation");
  const [printAll, setPrintAll] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);

  // Recomputes live after the first Generate.
  const { plan, bench } = useMemo(() => {
    const i = {
      industry: INDUSTRIES.find((x) => x.id === sel.industry)!,
      geo: GEOS.find((x) => x.id === sel.geo)!,
      goal: GOALS.find((x) => x.id === sel.goal)!,
      stage: STAGES.find((x) => x.id === sel.stage)!,
      budget: BUDGETS.find((x) => x.id === sel.budget)!,
      notes,
    };
    return { plan: buildPlan(i), bench: buildGeoBenchmark(i) };
  }, [sel, notes]);
  const body = (t: Tab) => <TabBody tab={t} plan={plan} bench={bench} geo={sel.geo} onGeo={(geo) => setSel((s) => ({ ...s, geo }))} />;

  // Print all three tabs: render them, open the dialog, put the tabs back afterwards.
  useEffect(() => {
    if (!printAll) return;
    const done = () => setPrintAll(false);
    window.addEventListener("afterprint", done);
    const t = setTimeout(() => window.print(), 150);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", done);
    };
  }, [printAll]);

  const generate = () => {
    setGenerated(true);
    setTab("foundation");
    requestAnimationFrame(() => outRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const fromDescription = (v: Filled) => {
    setSel((s) => ({
      industry: typeof v.industry === "string" ? v.industry : s.industry,
      geo: typeof v.geo === "string" ? v.geo : s.geo,
      goal: typeof v.goal === "string" ? v.goal : s.goal,
      stage: typeof v.stage === "string" ? v.stage : s.stage,
      budget: typeof v.budget === "number" ? gtmBudgetId(v.budget) : s.budget,
    }));
    if (typeof v.notes === "string") setNotes(v.notes.slice(0, 300));
    generate();
  };

  const fields: { key: keyof typeof sel; label: string; options: { id: string; label: string }[] }[] = [
    { key: "industry", label: "Industry", options: INDUSTRIES },
    { key: "geo", label: "Target geography", options: GEOS },
    { key: "goal", label: "Primary goal", options: GOALS },
    { key: "stage", label: "Company stage", options: STAGES },
    { key: "budget", label: "Annual budget", options: BUDGETS },
  ];

  return (
    <div className="gtm-root wrap pb-20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase" style={{ color: GOOD, borderColor: GOOD, background: "rgb(255 255 255 / 0.75)" }}>
          <span aria-hidden className="size-2 rounded-full" style={{ background: GOOD }} />
          Built in your browser · nothing stored
        </p>
        {generated && (
          <button type="button" onClick={() => setPrintAll(true)} className="rounded-full border-2 border-ink/15 bg-white/70 px-4 py-2 font-display text-sm font-semibold hover:border-ink print:hidden">
            Print / Save as PDF
          </button>
        )}
      </div>

      <DescribeBox spec={GTM_SPEC} onApply={fromDescription} className="mb-6" intro="Say who you are, where you're going, what you want and what you can spend. The fields below fill in and the strategy is generated." />

      <div className="grid gap-6 min-[880px]:grid-cols-[300px_minmax(0,1fr)] min-[880px]:items-start print:block">
        <section aria-labelledby={`${id}-in`} className={`${card} space-y-4 print:hidden`}>
          <h2 id={`${id}-in`} className="text-2xl font-bold tracking-[-0.03em]">
            Your market
          </h2>
          {fields.map((f) => (
            <div key={f.key}>
              <label htmlFor={`${id}-${f.key}`} className="block font-display text-sm font-semibold">
                {f.label}
              </label>
              <select id={`${id}-${f.key}`} value={sel[f.key]} onChange={(e) => setSel((s) => ({ ...s, [f.key]: e.target.value }))} className={select}>
                {f.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <label htmlFor={`${id}-notes`} className="block font-display text-sm font-semibold">
              Audience notes <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea id={`${id}-notes`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={300} placeholder="e.g. mid-market ops leaders, price-sensitive, mobile-first" className="mt-2 w-full rounded-xl border-2 border-ink bg-white/70 px-3 py-2" />
          </div>
          <button
            type="button"
            onClick={generate}
            className="w-full rounded-full bg-accent px-5 py-3 font-display font-semibold text-on-accent transition-colors hover:bg-accent-strong"
          >
            Generate GTM Strategy
          </button>
        </section>

        <div ref={outRef} className="min-w-0 scroll-mt-24">
          {!generated ? (
            <div className="rounded-3xl border-2 border-dashed border-ink/15 p-8 text-center text-muted">
              <p className="font-display text-lg font-semibold text-ink">Choose your market and press Generate GTM Strategy.</p>
              <p className="mt-1">You'll get positioning, a channel mix and stack, a 26-week roadmap with decision gates, an org model and a risk register.</p>
            </div>
          ) : printAll ? (
            <div className="space-y-10">
              {TABS.map((t) => (
                <div key={t.id} className="space-y-6">
                  <h2 className="text-3xl font-bold tracking-[-0.04em]">{t.label}</h2>
                  {body(t.id)}
                </div>
              ))}
            </div>
          ) : (
            <>
              <TabBar tab={tab} setTab={setTab} />
              <div role="tabpanel" id={`gtm-panel-${tab}`} aria-labelledby={`gtm-tab-${tab}`} tabIndex={0} className="mt-6 space-y-6">
                {body(tab)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKey = (e: KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (n === null) return;
    e.preventDefault();
    const next = TABS[(n + TABS.length) % TABS.length].id;
    setTab(next);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label="Strategy sections" onKeyDown={onKey} className="glass flex gap-1 overflow-x-auto rounded-full p-1 print:hidden">
      {TABS.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          type="button"
          role="tab"
          id={`gtm-tab-${t.id}`}
          aria-selected={tab === t.id}
          aria-controls={`gtm-panel-${t.id}`}
          tabIndex={tab === t.id ? 0 : -1}
          onClick={() => setTab(t.id)}
          className={`flex-1 shrink-0 rounded-full px-4 py-2 font-display text-sm font-semibold whitespace-nowrap transition-colors ${tab === t.id ? "bg-ink text-white" : "hover:bg-white"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

type BodyProps = { tab: Tab; plan: Plan; bench: GeoBenchmark; geo: string; onGeo: (id: string) => void };
const TabBody = ({ tab, plan, bench, geo, onGeo }: BodyProps) =>
  tab === "foundation" ? <Foundation plan={plan} /> : tab === "benchmark" ? <Benchmark bench={bench} geo={geo} onGeo={onGeo} /> : tab === "tactical" ? <Tactical plan={plan} /> : <Governance plan={plan} />;

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className={`${card} break-inside-avoid`}>
      <p className="eyebrow text-accent">{eyebrow}</p>
      <h3 className="mt-1 text-2xl font-bold tracking-[-0.03em]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ---------- Strategic Foundation ---------- */
function Foundation({ plan }: { plan: Plan }) {
  const n = plan.narrative;
  return (
    <>
      <Section eyebrow="Positioning" title="Positioning statement">
        <p className="text-lg leading-relaxed">{n.positioning}</p>
      </Section>
      <Section eyebrow="Messaging" title="Three messaging pillars">
        <ol className="grid gap-3 md:grid-cols-3">
          {n.pillars.map((p, i) => (
            <li key={p} className="rounded-2xl bg-white/70 p-4">
              <span className="font-mono text-xs text-muted">0{i + 1}</span>
              <p className="mt-1 font-display font-semibold">{p}</p>
            </li>
          ))}
        </ol>
      </Section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section eyebrow="Whitespace" title="Where you can win">
          <p>{n.whitespace}</p>
        </Section>
        <Section eyebrow="Competitive angle" title="How to frame it">
          <p>{n.angle}</p>
        </Section>
      </div>
      <Section eyebrow="Market entry" title="Entry scorecard">
        <ul className="space-y-4">
          {plan.scorecard.map((s) => (
            <li key={s.label} className="grid gap-2 sm:grid-cols-[minmax(0,11rem)_auto_minmax(0,1fr)] sm:items-center sm:gap-4">
              <span className="font-display font-semibold">{s.label}</span>
              <span className="flex items-center gap-2">
                <span aria-hidden className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={`h-3 w-6 rounded-sm ${i <= s.score ? "bg-accent" : "bg-ink/10"}`} />
                  ))}
                </span>
                <span className="font-mono text-sm tabular-nums">{s.score}/5</span>
              </span>
              <span className="text-sm text-muted">{s.note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">5 is most favourable on every row.</p>
      </Section>
      <Section eyebrow="Ideal customer" title="ICP and sizing">
        <p className="font-display text-lg font-semibold">{n.icp}</p>
        {n.notes && <p className="mt-1 text-sm text-muted">Audience notes: {n.notes}</p>}
        <p className="mt-3 text-sm">
          <b>Sizing approach.</b> {n.sizing}
        </p>
        <p className="mt-2 text-sm">
          <b>Localisation.</b> {n.localisation}
        </p>
      </Section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section eyebrow="Buying committee" title="Who decides">
          <ul className="space-y-2">
            {n.committee.map((c) => (
              <li key={c} className="rounded-2xl bg-white/70 px-4 py-2.5 text-sm">
                {c}
              </li>
            ))}
          </ul>
        </Section>
        <Section eyebrow="Go-to-market motion" title="Motion and pricing">
          <p className="inline-flex rounded-full bg-ink px-3 py-1 font-display text-sm font-semibold text-white">{n.motion}</p>
          <p className="mt-3 text-sm">{n.pricing}</p>
        </Section>
      </div>
    </>
  );
}

/* ---------- Market Benchmark ---------- */
const FX_LABEL = { none: "Low", moderate: "Moderate", high: "High" } as const;
const FX_COLOR = { none: GOOD, moderate: WARN, high: BAD } as const;

function Benchmark({ bench, geo, onGeo }: { bench: GeoBenchmark; geo: string; onGeo: (id: string) => void }) {
  const mine = bench.find((g) => g.id === geo)!;
  const rank = bench.indexOf(mine) + 1;
  const cols = mine.scores.map((s) => s.label);
  return (
    <>
      <Section eyebrow="Market benchmark" title={`How ${mine.label} compares`}>
        <p className="text-muted">
          The same industry, goal, stage and budget, planned in all {bench.length} markets. {mine.label} ranks <b className="text-ink">{rank} of {bench.length}</b> on the entry score (the average of the five scorecard rows). Scores compare how hard a market is to enter, not how big it is.
        </p>
        <ul className="mt-5 space-y-2.5" aria-label="Entry score by market, best first">
          {bench.map((g) => {
            const me = g.id === geo;
            return (
              <li key={g.id} className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]">
                <span className={`truncate ${me ? "font-display font-bold" : "text-muted"}`}>
                  {g.label}
                  {me && <span className="sr-only"> (your pick)</span>}
                </span>
                <span aria-hidden className="relative h-3 rounded-full bg-ink/[0.07]">
                  <span className={`absolute inset-y-0 left-0 rounded-full ${me ? "bg-accent" : "bg-ink/35"}`} style={{ width: `${(g.overall / 5) * 100}%` }} />
                </span>
                <span className={`font-mono text-xs tabular-nums ${me ? "font-bold" : ""}`}>{g.overall.toFixed(1)}/5</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">Your pick is in red. 5 is most favourable.</p>
      </Section>
      <Section eyebrow="Side by side" title="Market comparison">
        {/* relative: keeps the screen-reader-only labels inside the scroll box. */}
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[76rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink align-bottom">
                <th scope="col" className="py-2 pr-3 font-display font-semibold">Market</th>
                <th scope="col" className="py-2 pr-3 text-right font-display font-semibold">Entry score</th>
                {cols.map((c) => (
                  <th key={c} scope="col" className="py-2 pr-3 text-right font-display font-semibold">{c}</th>
                ))}
                <th scope="col" className="py-2 pr-3 font-display font-semibold">FX risk</th>
                <th scope="col" className="py-2 pr-3 font-display font-semibold">In-market lead</th>
                <th scope="col" className="py-2 pr-3 text-right font-display font-semibold">First gate</th>
                <th scope="col" className="py-2 pr-3 text-right font-display font-semibold">High risks</th>
                <th scope="col" className="py-2 pr-3 font-display font-semibold">Lead channels</th>
                <th scope="col" className="py-2 font-display font-semibold print:hidden"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {bench.map((g) => {
                const me = g.id === geo;
                return (
                  <tr key={g.id} className={`border-b border-ink/10 align-top ${me ? "bg-accent-soft" : ""}`}>
                    <th scope="row" className="min-w-[9rem] py-2.5 pr-3 font-semibold">
                      {g.label}
                      {me && <span className="block text-xs font-normal text-muted">Your pick</span>}
                    </th>
                    <td className="py-2.5 pr-3 text-right font-mono font-bold tabular-nums">{g.overall.toFixed(1)}</td>
                    {g.scores.map((s) => (
                      <td key={s.label} className="py-2.5 pr-3 text-right font-mono tabular-nums">{s.score}</td>
                    ))}
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className="size-2 rounded-full" style={{ background: FX_COLOR[g.fx] }} />
                        {FX_LABEL[g.fx]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">{g.inMarketLead ? "Needed" : "Optional"}</td>
                    <td className="py-2.5 pr-3 text-right font-mono whitespace-nowrap tabular-nums">Week {g.firstGate}</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{g.highRisks}</td>
                    <td className="min-w-[14rem] py-2.5 pr-3 text-muted">{g.topChannels.join(", ")}</td>
                    <td className="py-2.5 print:hidden">
                      {!me && (
                        <button type="button" onClick={() => onGeo(g.id)} className="rounded-full border-2 border-ink/15 bg-white/70 px-3 py-1 font-display text-xs font-semibold whitespace-nowrap hover:border-ink" aria-label={`Plan for ${g.label}`}>
                          Plan for this market
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted">
          First gate is the week the Foundation phase ends; local set-up pushes it later. High risks counts the High-severity rows in each market&apos;s risk register. No market-size figures are shown: size each market bottom-up from your own funnel data (see ICP and sizing).
        </p>
      </Section>
    </>
  );
}

/* ---------- Tactical Execution ---------- */
function useChartColors() {
  // SVG attributes don't resolve CSS variables, so the site's tokens are read once from the page.
  const [c, setC] = useState({ axis: "#555555", grid: "#e4e4e4" });
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    setC({ axis: cs.getPropertyValue("--muted").trim() || "#555555", grid: cs.getPropertyValue("--line").trim() || "#e4e4e4" });
  }, []);
  return c;
}

function Tactical({ plan }: { plan: Plan }) {
  const c = useChartColors();
  const tip = { borderRadius: 12, border: `1px solid ${c.grid}`, fontSize: 13 };
  const span = 26;
  return (
    <>
      <Section eyebrow="Channel mix" title="Where the media budget goes">
        <div role="img" aria-label={`Channel mix: ${plan.mix.map((m) => `${m.label} ${m.pct}%`).join(", ")}`} style={{ height: 44 * plan.mix.length + 20 }}>
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 44 * plan.mix.length + 20 }}>
            <BarChart data={plan.mix} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} accessibilityLayer={false}>
              <XAxis type="number" hide domain={[0, Math.max(...plan.mix.map((m) => m.pct)) * 1.05]} />
              <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 13, fill: c.axis }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${v}%`, "Share of media"]} contentStyle={tip} cursor={{ fill: "rgb(17 17 17 / 0.05)" }} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
                {plan.mix.map((m, i) => (
                  <Cell key={m.id} fill={COLORS[i % COLORS.length]} />
                ))}
                <LabelList dataKey="pct" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 12, fill: c.axis, fontFamily: "var(--font-mono)" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section eyebrow="Stack" title="Adtech and martech by channel">
        <ul className="divide-y divide-ink/10">
          {plan.mix.map((m, i) => (
            <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span className="flex min-w-0 items-center gap-2 font-display font-semibold sm:w-56">
                <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                {m.label}
              </span>
              <span className="flex flex-wrap gap-1.5">
                {m.stack.map((t) => (
                  <span key={t} className="rounded-full bg-white/70 px-2.5 py-1 font-mono text-xs">
                    {t}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Example vendors, not endorsements. Pick one per job and keep the stack small.</p>
      </Section>

      <Section eyebrow="Budget" title="Budget allocation">
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          <div role="img" aria-label={`Budget allocation: ${plan.budget.map((b) => `${b.label} ${b.pct}%`).join(", ")}`} className="h-56">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 256, height: 224 }}>
              <PieChart accessibilityLayer={false}>
                <Pie data={plan.budget} dataKey="pct" nameKey="label" innerRadius="58%" outerRadius="92%" paddingAngle={1} stroke="#ffffff" strokeWidth={2} isAnimationActive={false}>
                  {plan.budget.map((b, i) => (
                    <Cell key={b.label} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={tip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2 text-sm">
            {plan.budget.map((b, i) => (
              <li key={b.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="size-3 rounded-sm" style={{ background: COLORS[i] }} />
                  {b.label}
                </span>
                <span className="font-mono tabular-nums">{b.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section eyebrow="Roadmap" title="26-week plan with decision gates">
        <ol className="space-y-5">
          {plan.timeline.map((ph, i) => (
            <li key={ph.name} className="break-inside-avoid">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="flex items-center gap-2 font-display text-lg font-bold">
                  <span aria-hidden className="size-2.5 rounded-full bg-accent" />
                  {i + 1}. {ph.name}
                </h4>
                <span className="font-mono text-sm text-muted">
                  Weeks {ph.start}–{ph.end}
                </span>
              </div>
              <div aria-hidden className="relative mt-2 h-2 rounded-full bg-ink/[0.07]">
                <span className="absolute inset-y-0 rounded-full bg-accent" style={{ left: `${((ph.start - 1) / span) * 100}%`, width: `${((ph.end - ph.start + 1) / span) * 100}%` }} />
              </div>
              <ul className="mt-3 list-square space-y-1 pl-5 text-sm">
                {ph.focus.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="mt-3 rounded-2xl border-l-4 bg-white/70 p-3 text-sm" style={{ borderLeftColor: GOOD }}>
                <p>
                  <b>Go if:</b> {ph.gate}.
                </p>
                <p className="mt-1 text-muted">
                  <b className="text-ink">If not:</b> {ph.kill}.
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Benchmarks" title="KPIs to track">
        <ul className="grid gap-3 sm:grid-cols-2">
          {plan.kpis.map((k) => (
            <li key={k.label} className="rounded-2xl bg-white/70 p-4">
              <p className="text-sm text-muted">{k.label}</p>
              <p className="mt-1 font-mono font-semibold" style={{ color: GOOD }}>
                {k.target}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Typical planning ranges, not guarantees. Replace them with your own baselines after the pilot.</p>
      </Section>
    </>
  );
}

/* ---------- Governance & Risk ---------- */
function Governance({ plan }: { plan: Plan }) {
  const g = plan.governance;
  const top = plan.risks[0];
  return (
    <>
      <Section eyebrow="Organisation" title="Org and governance model">
        <ul className="space-y-2">
          {g.org.map((o) => (
            <li key={o} className="rounded-2xl bg-white/70 px-4 py-2.5 text-sm">
              {o}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <b>Cadence.</b> {g.governance}
        </p>
        {g.inMarket && (
          <p className="mt-3 rounded-2xl border-l-4 border-accent bg-white/70 p-3 text-sm">
            <b>In-market lead.</b> {g.inMarket}
          </p>
        )}
      </Section>

      <Section eyebrow="Decision gates" title="Go / no-go summary">
        <ol className="grid gap-3 sm:grid-cols-2">
          {plan.timeline.map((ph) => (
            <li key={ph.name} className="rounded-2xl bg-white/70 p-4 text-sm">
              <p className="font-mono text-xs text-muted">
                End of week {ph.end} · {ph.name}
              </p>
              <p className="mt-1 font-semibold">{ph.gate}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Risk" title="Risk register">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink font-display">
                <th scope="col" className="py-2 pr-3 font-semibold">Severity</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Risk</th>
                <th scope="col" className="py-2 font-semibold">Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {plan.risks.map((r) => (
                <tr key={r.risk} className="break-inside-avoid border-b border-ink/10 align-top">
                  <td className="py-2.5 pr-3">
                    <span className="inline-flex rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold text-white" style={{ background: SEV[r.severity] }}>
                      {r.severity}
                    </span>
                  </td>
                  <th scope="row" className="py-2.5 pr-3 font-semibold">{r.risk}</th>
                  <td className="py-2.5 text-muted">{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass break-inside-avoid rounded-3xl border-l-8 p-5 sm:p-6" style={{ borderLeftColor: SEV[top.severity] }}>
          <p className="eyebrow" style={{ color: SEV[top.severity] }}>
            Key risk
          </p>
          <p className="mt-2 font-display text-lg font-semibold">{top.risk}</p>
          <p className="mt-2 text-sm text-muted">{top.mitigation}</p>
        </section>
        <section className="glass break-inside-avoid rounded-3xl border-l-8 p-5 sm:p-6" style={{ borderLeftColor: GOOD }}>
          <p className="eyebrow" style={{ color: GOOD }}>
            Week-1 quick win
          </p>
          <p className="mt-2 font-display text-lg font-semibold">{plan.narrative.quickWin}</p>
        </section>
      </div>

      <Section eyebrow="Compliance" title="Compliance notes">
        <ul className="space-y-2 text-sm">
          {plan.compliance.map((c) => (
            <li key={c} className="flex gap-2.5">
              <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: GOOD }} />
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">A starting checklist, not legal advice. Confirm requirements with counsel in each market.</p>
      </Section>
    </>
  );
}
