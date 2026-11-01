"use client";

import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { compute, FULL_MARKS, LAYER_LABEL, LAYERS, SAMPLE, WEIGHTS, type Inputs, type Layer, type Result, type Status } from "@/lib/doohsight";
import { FIELDS, NUM_KEYS, type Group, type NumKey } from "@/lib/doohsight-data";
import { DataPanel, TRENDS_SOURCE, type Sources } from "./DoohSightData";
import { money, num, NumberField } from "./fields";

const STORAGE_KEY = "doohsight-state";
const TYPED = "Typed in";
const SAMPLE_COLOR = "#b45309";

/* Seven layer colours: the validated categorical order (colour-blind safe, fixed per layer). */
const LAYER_COLOR: Record<Layer, string> = {
  delivery: "#2a78d6",
  attention: "#eb6834",
  location: "#1baf7a",
  cross: "#eda100",
  business: "#e87ba4",
  brand: "#008300",
  increment: "#6250d6",
};
const CONTROL = "#a3a3a3";
const STATUS: Record<Status, { color: string; icon: string; label: string }> = {
  good: { color: "#15803d", icon: "✓", label: "Good" },
  warning: { color: "#b45309", icon: "!", label: "Watch" },
  serious: { color: "#c2410c", icon: "!!", label: "Serious" },
  critical: { color: "#b91c1c", icon: "×", label: "Critical" },
};

type TabId = "overview" | "data" | Layer | "trust" | "method";
const TABS: { id: TabId; label: string; layer?: Layer }[] = [
  { id: "overview", label: "Overview" },
  { id: "data", label: "Data Sources" },
  { id: "delivery", label: "Delivery & Reach", layer: "delivery" },
  { id: "attention", label: "Attention", layer: "attention" },
  { id: "location", label: "Location & Footfall", layer: "location" },
  { id: "cross", label: "Cross-Channel Halo", layer: "cross" },
  { id: "business", label: "Business Outcomes & ROI", layer: "business" },
  { id: "brand", label: "Brand & Funnel Lift", layer: "brand" },
  { id: "increment", label: "Incrementality", layer: "increment" },
  { id: "trust", label: "Trust & Quality" },
  { id: "method", label: "Methodology" },
];

const pct = (n: number, d = 1) => `${num(n, d)}%`;
const signed = (n: number, d = 1, unit = "%") => `${n >= 0 ? "+" : "−"}${num(Math.abs(n), d)}${unit}`;
const conf = (c: number) => (c >= 0.9995 ? ">99.9%" : `${num(c * 100, 1)}%`);
const compact = (n: number) => (Math.abs(n) >= 1e6 ? `${num(n / 1e6, 2)}M` : Math.abs(n) >= 1e4 ? `${num(n / 1e3, 0)}k` : num(n, 0));

/* ---------- tooltip that follows the cursor ---------- */
type Tip = { x: number; y: number; text: string } | null;
const TipCtx = createContext<(t: Tip) => void>(() => {});
const useTip = (text: string) => {
  const set = useContext(TipCtx);
  return {
    onMouseMove: (e: React.MouseEvent) => set({ x: e.clientX, y: e.clientY, text }),
    onMouseLeave: () => set(null),
  };
};

export function DoohSight() {
  const [inputs, setInputs] = useState<Inputs>(SAMPLE);
  const [sources, setSources] = useState<Sources>({});
  const [updated, setUpdated] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [tip, setTip] = useState<Tip>(null);
  const r = useMemo(() => compute(inputs), [inputs]);

  // Read the visitor's last scenario after hydration, so server and client markup match.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.inputs) {
        setInputs({ ...SAMPLE, ...saved.inputs });
        setSources(saved.sources ?? {});
        setUpdated(saved.updated ?? null);
      }
    } catch {}
  }, []);

  // Typing into a field clears where it came from; an import or lookup records it.
  const update = (patch: Partial<Inputs>, from?: Sources) => {
    const next = { ...inputs, ...patch };
    const nextSources = { ...sources };
    for (const k of Object.keys(patch) as (keyof Inputs)[]) {
      nextSources[k] = from?.[k] ?? TYPED;
    }
    const now = new Date().toISOString();
    setInputs(next);
    setSources(nextSources);
    setUpdated(now);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, inputs: next, sources: nextSources, updated: now }));
    } catch {}
  };
  const reset = () => {
    setInputs(SAMPLE);
    setSources({});
    setUpdated(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };
  // A field still needs the user's number while it holds the sample value and nothing has set it.
  const isSample = (k: NumKey) => !sources[k] && inputs[k] === SAMPLE[k];
  const pending = (g: Group) => {
    const keys = NUM_KEYS.filter((k) => FIELDS[k].group === g);
    return { left: keys.filter(isSample).length, total: keys.length };
  };
  const field = (key: NumKey, o: { prefix?: string; suffix?: string; hint?: string } = {}) => (
    <NumberField
      key={key}
      label={FIELDS[key].label}
      value={inputs[key]}
      onChange={(v) => update({ [key]: v })}
      {...o}
      tag={isSample(key) ? <SampleTag /> : undefined}
      hint={[o.hint, sources[key] && sources[key] !== TYPED && `From ${sources[key]}`].filter(Boolean).join(" · ") || undefined}
    />
  );

  return (
    <TipCtx.Provider value={setTip}>
      <div className="pb-20">
        <ScoreBar r={r} campaign={inputs.campaign} onReset={reset} onImport={() => setTab("data")} />
        <TabRail tab={tab} setTab={setTab} pending={pending} />
        <div className="wrap mt-6">
          <div role="tabpanel" id={`ds-panel-${tab}`} aria-labelledby={`ds-tab-${tab}`} tabIndex={0} className="space-y-6 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-accent">
            {tab === "overview" && <Overview r={r} inputs={inputs} update={update} pending={pending} setTab={setTab} />}
            {tab === "data" && <DataPanel inputs={inputs} sources={sources} apply={update} />}
            {tab === "delivery" && (
              <Panel
                pending={pending}
                layer="delivery"
                intro="What ran, who it reached and what it cost. Impressions are audience impressions (plays × people in view), not plays."
                inputs={[
                  field("spend", { prefix: "$" }),
                  field("screens"),
                  field("plays"),
                  field("impressions"),
                  field("reach"),
                  field("population"),
                  field("categorySpend", { prefix: "$" }),
                  field("marketSharePct", { suffix: "%" }),
                  field("benchmarkCpm", { prefix: "$" }),
                ]}
                tiles={[
                  { label: "CPM", value: money(r.delivery.cpm, 2), sub: `Benchmark ${money(inputs.benchmarkCpm, 2)}`, lead: true },
                  { label: "Reach", value: pct(r.delivery.reachPct), sub: `${compact(inputs.reach)} people` },
                  { label: "Frequency", value: `${num(r.delivery.frequency, 1)}×`, sub: "Impressions per person reached" },
                  { label: "Cost per play", value: money(r.delivery.costPerPlay, 3), sub: `${num(r.delivery.playsPerScreen)} plays per screen` },
                  { label: "Share of voice", value: pct(r.delivery.sovPct), sub: `${signed(r.delivery.esov, 1, " pts")} vs market share` },
                ]}
                chart={
                  <ChartCard title="Share of voice vs market share" note="Spending a bigger share of category media than your share of market (excess share of voice) is linked to growth.">
                    <Meter label="Share of voice" value={r.delivery.sovPct} max={Math.max(50, r.delivery.sovPct, inputs.marketSharePct) } display={pct(r.delivery.sovPct)} color={LAYER_COLOR.delivery} tick={inputs.marketSharePct} tickLabel={`Market share ${pct(inputs.marketSharePct, 0)}`} />
                  </ChartCard>
                }
              />
            )}
            {tab === "attention" && (
              <Panel
                pending={pending}
                layer="attention"
                intro="Impressions say a screen was in view. Attention says someone looked. Use eye-tracking or attention-panel rates for this placement mix."
                inputs={[
                  field("viewablePct", { suffix: "%", hint: "Share of impressions with a clear line of sight" }),
                  field("attentivePct", { suffix: "%", hint: "Share of impressions actually looked at" }),
                  field("attentiveSec", { suffix: "s" }),
                ]}
                tiles={[
                  { label: "Cost per 1,000 attentive seconds", value: money(r.attention.costPerThousandSeconds, 2), lead: true },
                  { label: "Attentive impressions", value: compact(r.attention.attentiveImps), sub: `${pct(r.attention.attentiveShare)} of impressions` },
                  { label: "Attention-adjusted CPM", value: money(r.attention.attentiveCpm, 2), sub: `vs ${money(r.delivery.cpm, 2)} on all impressions` },
                  { label: "Attentive seconds", value: compact(r.attention.attentiveSeconds) },
                ]}
                chart={
                  <ChartCard title="From impressions to attention">
                    <Bars
                      max={inputs.impressions}
                      rows={[
                        { label: "Impressions", value: inputs.impressions, display: compact(inputs.impressions), color: LAYER_COLOR.attention },
                        { label: "Viewable", value: r.attention.viewableImps, display: compact(r.attention.viewableImps), color: LAYER_COLOR.attention },
                        { label: "Attentive", value: r.attention.attentiveImps, display: compact(r.attention.attentiveImps), color: LAYER_COLOR.attention },
                      ]}
                    />
                  </ChartCard>
                }
              />
            )}
            {tab === "location" && (
              <Panel
                pending={pending}
                layer="location"
                intro="Store visits from devices seen near your screens, against a matched control group that wasn't exposed."
                inputs={[
                  field("matchedDevices"),
                  field("exposedVisitPct", { suffix: "%" }),
                  field("controlVisitPct", { suffix: "%" }),
                  field("repeatVisits"),
                  field("basket", { prefix: "$" }),
                ]}
                tiles={[
                  { label: "Footfall lift", value: signed(r.location.footfallLiftPct), sub: `${signed(r.location.liftPts, 1, " pts")} visit rate`, lead: true },
                  { label: "Incremental visitors", value: num(r.location.incVisitors), sub: "Unique reach × visit-rate lift" },
                  { label: "Incremental visits", value: num(r.location.incVisits), sub: `${num(inputs.repeatVisits, 1)} visits each` },
                  { label: "Cost per incremental visitor", value: money(r.location.costPerIncVisitor, 2) },
                  { label: "Footfall revenue", value: money(r.location.footfallRevenue) },
                ]}
                chart={
                  <ChartCard title="Store visit rate" legend={[["Exposed", LAYER_COLOR.location], ["Control", CONTROL]]} note={`Measured on ${num(inputs.matchedDevices)} matched devices.`}>
                    <Bars
                      max={Math.max(inputs.exposedVisitPct, inputs.controlVisitPct) * 1.15 || 1}
                      rows={[
                        { label: "Exposed", value: inputs.exposedVisitPct, display: pct(inputs.exposedVisitPct), color: LAYER_COLOR.location },
                        { label: "Control", value: inputs.controlVisitPct, display: pct(inputs.controlVisitPct), color: CONTROL },
                      ]}
                    />
                  </ChartCard>
                }
              />
            )}
            {tab === "cross" && (
              <Panel
                pending={pending}
                layer="cross"
                intro="DOOH lifts other channels. Compare weekly averages during the flight with the weeks before it."
                inputs={[
                  field("weeks"),
                  field("searchBase"),
                  field("searchCampaign"),
                  field("sessionsBase"),
                  field("sessionsCampaign"),
                  field("installsBase"),
                  field("installsCampaign"),
                ]}
                tiles={[
                  { label: "Average halo lift", value: signed(r.cross.avgLiftPct), lead: true },
                  ...r.cross.channels.map((c) => ({ label: c.label, value: signed(c.liftPct), sub: c.key === "search" && sources.searchBase === TRENDS_SOURCE ? "Google Trends index, so read the lift %" : `${signed(c.incremental, 0, "")} over the flight` })),
                ]}
                chart={
                  <ChartCard title="Lift by channel">
                    <Bars max={Math.max(...r.cross.channels.map((c) => c.liftPct), 1) * 1.15} rows={r.cross.channels.map((c) => ({ label: c.label, value: Math.max(0, c.liftPct), display: signed(c.liftPct), color: LAYER_COLOR.cross }))} />
                  </ChartCard>
                }
              />
            )}
            {tab === "business" && (
              <Panel
                pending={pending}
                layer="business"
                intro="Incremental revenue from store visits plus online sales attributed to the flight, against what it cost."
                inputs={[field("onlineRevenue", { prefix: "$" }), field("marginPct", { suffix: "%" })]}
                tiles={[
                  { label: "ROAS", value: `${num(r.business.roas, 2)}×`, sub: `Break-even ${num(r.business.breakEven, 2)}×`, lead: true },
                  { label: "Incremental revenue", value: money(r.business.incRevenue), sub: `${money(r.location.footfallRevenue)} in store + ${money(inputs.onlineRevenue)} online` },
                  { label: "Gross profit", value: money(r.business.grossProfit) },
                  { label: "ROI", value: signed(r.business.roiPct), sub: "Gross profit after media cost" },
                ]}
                chart={
                  <ChartCard title="ROAS against break-even" note="Break-even ROAS is 1 ÷ gross margin: below it, the media cost more than the profit it made.">
                    <Meter label="ROAS" value={r.business.roas} max={Math.max(4, r.business.roas * 1.1, r.business.breakEven * 1.2)} display={`${num(r.business.roas, 2)}×`} color={LAYER_COLOR.business} tick={r.business.breakEven} tickLabel={`Break-even ${num(r.business.breakEven, 2)}×`} />
                  </ChartCard>
                }
              />
            )}
            {tab === "brand" && (
              <Panel
                pending={pending}
                layer="brand"
                intro="Survey results from people exposed to the campaign against a matched control group."
                inputs={[
                  field("surveyN"),
                  field("awarenessExposed", { suffix: "%" }),
                  field("awarenessControl", { suffix: "%" }),
                  field("considerationExposed", { suffix: "%" }),
                  field("considerationControl", { suffix: "%" }),
                  field("intentExposed", { suffix: "%" }),
                  field("intentControl", { suffix: "%" }),
                ]}
                tiles={r.brand.stages.map((s, i) => ({
                  label: `${s.label} lift`,
                  value: signed(s.liftPts, 0, " pts"),
                  sub: `${signed(s.relLiftPct, 0)} relative · ${s.confidence >= 0.95 ? "significant" : "not significant"} at 95% (${pct(s.confidence * 100, 1)})`,
                  lead: i === 0,
                }))}
                chart={
                  <ChartCard title="Funnel, exposed vs control" legend={[["Exposed", LAYER_COLOR.brand], ["Control", CONTROL]]}>
                    <div className="space-y-4">
                      {r.brand.stages.map((s) => (
                        <div key={s.key}>
                          <p className="mb-1.5 font-display text-sm font-semibold">{s.label}</p>
                          <Bars
                            max={100}
                            rows={[
                              { label: "Exposed", value: s.exposed, display: pct(s.exposed, 0), color: LAYER_COLOR.brand },
                              { label: "Control", value: s.control, display: pct(s.control, 0), color: CONTROL },
                            ]}
                          />
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                }
              />
            )}
            {tab === "increment" && (
              <Panel
                pending={pending}
                layer="increment"
                intro="The test that separates what DOOH caused from what would have happened anyway: a geo or audience holdout."
                inputs={[
                  field("testN"),
                  field("testConv"),
                  field("controlN"),
                  field("controlConv"),
                ]}
                tiles={[
                  { label: "Incremental lift", value: signed(r.increment.liftPct), sub: `95% range ${signed(r.increment.ciLowPct, 0)} to ${signed(r.increment.ciHighPct, 0)}`, lead: true },
                  { label: "Confidence", value: conf(r.increment.confidence), sub: r.increment.significant ? "Significant at 95%" : "Not significant at 95%" },
                  { label: "Conversion rate", value: `${pct(r.increment.testRate, 2)} vs ${pct(r.increment.controlRate, 2)}`, sub: "Test vs control" },
                  { label: "Incremental conversions", value: num(r.increment.incConversions), sub: `z = ${num(r.increment.z, 2)}` },
                ]}
                chart={
                  <ChartCard title="Statistical confidence" note="Two-proportion z-test, two-sided. 95% is the usual bar for reporting a result as real.">
                    <Meter label="Confidence" value={r.increment.confidence * 100} max={100} display={conf(r.increment.confidence)} color={LAYER_COLOR.increment} tick={95} tickLabel="95% bar" />
                  </ChartCard>
                }
              />
            )}
            {tab === "trust" && <TrustPanel r={r} field={field} pending={pending("trust")} />}
            {tab === "method" && <Methodology updated={updated} />}
          </div>
        </div>
      </div>
      {tip && (
        <div role="tooltip" className="glass-strong pointer-events-none fixed z-[60] rounded-xl px-3 py-1.5 font-mono text-xs tabular-nums" style={{ left: tip.x + 14, top: tip.y + 14 }}>
          {tip.text}
        </div>
      )}
    </TipCtx.Provider>
  );
}

/* ---------- sticky score bar ---------- */
function ScoreBar({ r, campaign, onReset, onImport }: { r: Result; campaign: string; onReset: () => void; onImport: () => void }) {
  const tone = STATUS[r.verdict.tone];
  const C = 2 * Math.PI * 16;
  return (
    <div className="sticky top-16 z-40 lg:top-[4.5rem]">
      <div className="wrap pt-3">
        <div className="glass-strong flex items-center gap-3 rounded-full py-2 pr-2 pl-4 sm:gap-4">
          <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold">
            <span className="text-muted">Campaign · </span>
            {campaign}
          </p>
          <div className="flex items-center gap-2" aria-live="polite">
            <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden className="-rotate-90">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgb(17 17 17 / 0.1)" strokeWidth="5" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(C * r.score) / 100} ${C}`} className="transition-[stroke-dasharray] duration-300" />
            </svg>
            <p className="leading-tight">
              <span className="block font-display text-xl font-extrabold tabular-nums">{r.score}</span>
              <span className="hidden text-xs text-muted sm:block">Intelligence score</span>
              <span className="sr-only sm:hidden">Intelligence score, </span>
              <span className="sr-only">{tone.label}</span>
            </p>
          </div>
          <button type="button" onClick={onImport} className="rounded-full bg-ink px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-accent-strong">
            Import<span className="hidden sm:inline"> data</span>
          </button>
          <button type="button" onClick={onReset} className="rounded-full border-2 border-ink/15 bg-white/70 px-4 py-2 font-display text-sm font-semibold transition-colors hover:border-ink">
            Reset<span className="hidden sm:inline"> sample</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- tabs: one row that scrolls sideways, arrow keys move between tabs ---------- */
function TabRail({ tab, setTab, pending }: { tab: TabId; setTab: (t: TabId) => void; pending: Pending }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKey = (e: KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (n === null) return;
    e.preventDefault();
    const next = TABS[(n + TABS.length) % TABS.length].id;
    setTab(next);
    refs.current[next]?.focus();
  };
  return (
    <div className="wrap mt-4">
      <div role="tablist" aria-label="DoohSight sections" onKeyDown={onKey} className="glass flex gap-1 overflow-x-auto rounded-full p-1 [scrollbar-width:thin]">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`ds-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`ds-panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold whitespace-nowrap transition-colors ${on ? "bg-ink text-white" : "hover:bg-white"}`}
            >
              {t.layer && <span aria-hidden className="size-2.5 rounded-full" style={{ background: LAYER_COLOR[t.layer] }} />}
              {t.label}
              {(t.layer || t.id === "trust") && pending((t.layer ?? "trust") as Group).left > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full px-1 font-mono text-[0.65rem] font-bold text-white" style={{ background: SAMPLE_COLOR }}>
                  {pending((t.layer ?? "trust") as Group).left}
                  <span className="sr-only"> sample values left</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- building blocks ---------- */
type TileProps = { label: string; value: string; sub?: string; lead?: boolean };

function Tiles({ tiles, color }: { tiles: TileProps[]; color: string }) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,13rem),1fr))]">
      {tiles.map((t) => (
        <div key={t.label} className={`glass rounded-2xl border-l-4 p-4 ${t.lead ? "sm:col-span-2" : ""}`} style={{ borderLeftColor: color }}>
          <p className="text-sm text-muted">{t.label}</p>
          <p className={`mt-1 font-display font-extrabold tracking-[-0.03em] tabular-nums ${t.lead ? "text-4xl" : "text-2xl"}`}>{t.value}</p>
          {t.sub && <p className="mt-1 text-xs text-muted">{t.sub}</p>}
        </div>
      ))}
    </div>
  );
}

type Pending = (g: Group) => { left: number; total: number };

function SampleTag() {
  return (
    <span className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.65rem] font-semibold tracking-wider uppercase" style={{ color: SAMPLE_COLOR, borderColor: SAMPLE_COLOR, background: "#fffbeb" }}>
      Sample<span className="sr-only">: replace with your number</span>
    </span>
  );
}

function InputsHead({ left, total }: { left: number; total: number }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="eyebrow text-accent">Inputs</h3>
      {left > 0 ? (
        <p className="text-xs font-semibold" style={{ color: SAMPLE_COLOR }}>
          {left} of {total} still sample values
        </p>
      ) : (
        <p className="text-xs font-semibold text-[#15803d]">✓ All {total} are your data</p>
      )}
      {left > 0 && <p className="w-full text-xs text-muted">Fields marked Sample hold the fictional example campaign. Type your own numbers over them, or bring them in on the Data Sources tab.</p>}
    </div>
  );
}

function Panel({ layer, intro, inputs, tiles, chart, pending }: { layer: Layer; intro: string; inputs: ReactNode[]; tiles: TileProps[]; chart: ReactNode; pending: Pending }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.04em]">
          <span aria-hidden className="size-3.5 rounded-full" style={{ background: LAYER_COLOR[layer] }} />
          {TABS.find((t) => t.layer === layer)!.label}
        </h2>
        <p className="font-mono text-sm text-muted">{WEIGHTS[layer]}% of the score</p>
      </div>
      <p className="max-w-3xl text-muted">{intro}</p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <section aria-label="Inputs" className="glass rounded-3xl p-5 sm:p-6">
          <InputsHead {...pending(layer)} />
          <div className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,12rem),1fr))]">{inputs}</div>
        </section>
        <div className="min-w-0 space-y-6">
          <Tiles tiles={tiles} color={LAYER_COLOR[layer]} />
          {chart}
        </div>
      </div>
    </>
  );
}

function ChartCard({ title, note, legend, children }: { title: string; note?: string; legend?: [string, string][]; children: ReactNode }) {
  return (
    <figure className="glass rounded-3xl p-5 sm:p-6">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display font-bold">{title}</span>
        {legend && (
          <span className="flex gap-4 text-xs">
            {legend.map(([l, c]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-sm" style={{ background: c }} />
                {l}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      <div className="mt-4">{children}</div>
      {note && <p className="mt-4 text-xs text-muted">{note}</p>}
    </figure>
  );
}

type BarRow = { label: string; value: number; display: string; color: string };
function BarLine({ row, max, wide }: { row: BarRow; max: number; wide?: boolean }) {
  const tip = useTip(`${row.label}: ${row.display}`);
  const w = Math.max(0, Math.min(100, (row.value / (max || 1)) * 100));
  return (
    <div className={`grid ${wide ? "grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_auto]"} items-center gap-3 text-sm`}>
      <span className="truncate text-muted">{row.label}</span>
      <span className="relative h-3 rounded-full bg-ink/[0.07]" aria-hidden {...tip}>
        <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300" style={{ width: `${w}%`, minWidth: w > 0 ? 4 : 0, background: row.color }} />
      </span>
      <span className="font-mono text-xs font-semibold tabular-nums">{row.display}</span>
    </div>
  );
}
function Bars({ rows, max, wide }: { rows: BarRow[]; max: number; wide?: boolean }) {
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <BarLine key={row.label} row={row} max={max} wide={wide} />
      ))}
    </div>
  );
}

function Meter({ label, value, max, display, color, tick, tickLabel }: { label: string; value: number; max: number; display: string; color: string; tick: number; tickLabel: string }) {
  const tip = useTip(`${label}: ${display} · ${tickLabel}`);
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  const t = Math.max(0, Math.min(100, (tick / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono font-semibold tabular-nums">{display}</span>
      </div>
      <div className="relative mt-2 h-4 rounded-full bg-ink/[0.07]" aria-hidden {...tip}>
        <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300" style={{ width: `${w}%`, minWidth: w > 0 ? 4 : 0, background: color }} />
        <span className="absolute -inset-y-1.5 w-0.5 rounded-full bg-ink" style={{ left: `calc(${t}% - 1px)` }} />
      </div>
      <p className="mt-2 text-xs text-muted" style={{ paddingLeft: `min(${t}%, calc(100% - 9rem))` }}>
        ▲ {tickLabel}
      </p>
    </div>
  );
}

function Pill({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-xs font-semibold text-white" style={{ background: s.color }}>
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}

/* ---------- overview ---------- */
function Overview({ r, inputs, update, pending, setTab }: { r: Result; inputs: Inputs; update: (p: Partial<Inputs>) => void; pending: Pending; setTab: (t: TabId) => void }) {
  const id = useId();
  const groups = TABS.filter((t) => t.layer || t.id === "trust").map((t) => ({ t, ...pending((t.layer ?? "trust") as Group) }));
  const left = groups.reduce((s, g) => s + g.left, 0);
  const total = groups.reduce((s, g) => s + g.total, 0);
  const tone = STATUS[r.verdict.tone];
  const rows: [string, string, string][] = [
    ["What ran", `${num(inputs.plays)} plays · ${compact(inputs.impressions)} impressions`, `${compact(r.attention.attentiveImps)} attentive impressions · ${money(r.attention.costPerThousandSeconds, 2)} per 1,000 attentive seconds`],
    ["Who saw it", "Estimated audience", `${pct(r.delivery.reachPct)} of the market · ${num(r.delivery.frequency, 1)}× frequency`],
    ["Did it drive visits?", "Not measured", `${signed(r.location.footfallLiftPct)} footfall · ${num(r.location.incVisitors)} incremental visitors`],
    ["Did other channels move?", "Not measured", `${signed(r.cross.avgLiftPct)} average lift in search, web and app`],
    ["Did it pay back?", "Not measured", `${num(r.business.roas, 2)}× ROAS against ${num(r.business.breakEven, 2)}× break-even`],
    ["Did the brand grow?", "Not measured", `${signed(r.brand.stages[0].liftPts, 0, " pts")} awareness · ${signed(r.brand.stages[2].liftPts, 0, " pts")} purchase intent`],
    ["Is the effect real?", "Not tested", `${conf(r.increment.confidence)} confidence in a ${signed(r.increment.liftPct, 0)} lift`],
    ["Did it run as booked?", "Proof-of-play report", `${inputs.popMatchPct}% verified plays · ${inputs.ivtPct}% invalid traffic`],
  ];
  return (
    <>
      <div className="glass flex gap-4 rounded-3xl border-l-8 p-5 sm:p-6" style={{ borderLeftColor: tone.color }}>
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full font-display text-lg font-extrabold text-white" style={{ background: tone.color }}>
          {tone.icon}
        </span>
        <div>
          <p className="eyebrow" style={{ color: tone.color }}>
            {tone.label} · score {r.score} / 100
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{r.verdict.title}</h2>
          <p className="mt-2 max-w-3xl text-muted">{r.verdict.body}</p>
        </div>
      </div>

      <section aria-labelledby={`${id}-data`} className="glass rounded-3xl border-l-8 p-5 sm:p-6" style={{ borderLeftColor: left ? SAMPLE_COLOR : "#15803d" }}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 id={`${id}-data`} className="font-display text-lg font-bold">
            {left ? `${total - left} of ${total} inputs are your campaign's data` : `All ${total} inputs are your campaign's data`}
          </h3>
          <button type="button" onClick={() => setTab("data")} className="rounded-full bg-ink px-4 py-2 font-display text-sm font-semibold text-white hover:bg-accent-strong">
            Import data
          </button>
        </div>
        <div aria-hidden className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink/[0.07]">
          <div className="h-full rounded-full bg-[#15803d] transition-[width] duration-300" style={{ width: `${((total - left) / total) * 100}%` }} />
        </div>
        {left > 0 && (
          <>
            <p className="mt-3 text-sm text-muted">
              {left} {left === 1 ? "input still holds" : "inputs still hold"} the fictional sample, so the score mixes your numbers with made-up ones. Each tab below shows how many are left; fields that need your number are marked <SampleTag />.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {groups
                .filter((g) => g.left > 0)
                .map((g) => (
                  <button key={g.t.id} type="button" onClick={() => setTab(g.t.id)} className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-white/70 px-3 py-1.5 font-display text-sm font-semibold hover:border-ink">
                    {g.t.label}
                    <span className="font-mono text-xs" style={{ color: SAMPLE_COLOR }}>
                      {g.left} left
                    </span>
                  </button>
                ))}
            </div>
          </>
        )}
      </section>

      <div className="glass rounded-3xl p-5 sm:p-6">
        <label htmlFor={id} className="block font-display text-sm font-semibold">
          Campaign name
        </label>
        <input id={id} value={inputs.campaign} onChange={(e) => update({ campaign: e.target.value })} className="mt-2 w-full border-b-2 border-ink bg-transparent py-1 font-display text-xl font-semibold outline-none focus:border-accent" />
      </div>

      <Tiles
        color="var(--accent)"
        tiles={[
          { label: "Incremental revenue", value: money(r.business.incRevenue), sub: `${num(r.business.roas, 2)}× ROAS`, lead: true },
          { label: "Cost per incremental visitor", value: money(r.location.costPerIncVisitor, 2) },
          { label: "Per 1,000 attentive seconds", value: money(r.attention.costPerThousandSeconds, 2) },
          { label: "Footfall lift", value: signed(r.location.footfallLiftPct) },
          { label: "Confidence", value: conf(r.increment.confidence), sub: r.increment.significant ? "Significant at 95%" : "Not significant" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <ChartCard title="Score by layer" note={`Each layer scores 0–100 and counts for its weight. ${r.cap < 100 ? `Capped at ${r.cap} by delivery-quality problems.` : ""}`}>
          <Bars wide max={100} rows={LAYERS.map((l) => ({ label: `${LAYER_LABEL[l]} · ${WEIGHTS[l]}%`, value: r.scores[l], display: num(r.scores[l], 0), color: LAYER_COLOR[l] }))} />
        </ChartCard>
        <section aria-labelledby="ds-compare" className="glass min-w-0 rounded-3xl p-5 sm:p-6">
          <h3 id="ds-compare" className="font-display font-bold">
            Traditional reporting vs DoohSight
          </h3>
          <div className="relative mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th scope="col" className="py-2 pr-3 font-display font-semibold">Question</th>
                  <th scope="col" className="py-2 pr-3 font-display font-semibold text-muted">Traditional OOH</th>
                  <th scope="col" className="py-2 font-display font-semibold">DoohSight</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([q, a, b]) => (
                  <tr key={q} className="border-b border-ink/10 align-top">
                    <th scope="row" className="py-2.5 pr-3 font-semibold">{q}</th>
                    <td className="py-2.5 pr-3 text-muted">{a}</td>
                    <td className="py-2.5">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

/* ---------- trust ---------- */
function TrustPanel({ r, field, pending }: { r: Result; field: (k: NumKey, o?: { prefix?: string; suffix?: string; hint?: string }) => ReactNode; pending: { left: number; total: number } }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-3xl font-bold tracking-[-0.04em]">Trust & Quality</h2>
        <p className="font-mono text-sm text-muted">Quality {num(r.trust.score, 0)} / 100{r.cap < 100 ? ` · caps the score at ${r.cap}` : ""}</p>
      </div>
      <p className="max-w-3xl text-muted">Results only count if the campaign ran as booked. A critical check caps the Intelligence score at 60; a quality score under 70 caps it at 75.</p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <section aria-label="Inputs" className="glass rounded-3xl p-5 sm:p-6">
          <InputsHead {...pending} />
          <div className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,12rem),1fr))]">
            {field("popMatchPct", { suffix: "%" })}
            {field("uptimePct", { suffix: "%" })}
            {field("ivtPct", { suffix: "%" })}
            {field("safetyIncidents")}
            {field("verifiedPct", { suffix: "%" })}
            {field("freshnessHours", { suffix: "h" })}
          </div>
        </section>
        <div className="grid content-start gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,14rem),1fr))]">
          {r.trust.checks.map((c) => (
            <div key={c.key} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-sm font-semibold">{c.label}</p>
                <Pill status={c.status} />
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">{c.value}</p>
              <p className="mt-1 text-xs text-muted">Target: {c.rule}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- methodology ---------- */
function Methodology({ updated }: { updated: string | null }) {
  const F = ({ children }: { children: ReactNode }) => <code className="rounded-md bg-white/70 px-1.5 py-0.5 font-mono text-[0.8rem] text-accent-strong">{children}</code>;
  const items: [Layer, string, ReactNode][] = [
    ["delivery", `Full marks at ${FULL_MARKS.reachPct}% reach and a CPM at or under benchmark (half each).`, <>CPM <F>spend ÷ impressions × 1,000</F> · reach <F>unique reach ÷ population</F> · frequency <F>impressions ÷ reach</F> · share of voice <F>spend ÷ category spend</F></>],
    ["attention", `Full marks at ${FULL_MARKS.attentivePct}% of impressions attentive.`, <>Attentive impressions <F>impressions × attentive %</F> (never above viewable) · <F>spend ÷ (attentive impressions × seconds) × 1,000</F> per 1,000 attentive seconds</>],
    ["location", `Full marks at a ${FULL_MARKS.footfallLiftPct}% footfall lift.`, <>Lift <F>(exposed − control) ÷ control</F> · incremental visitors <F>reach × (exposed − control)</F> · revenue <F>visitors × visits each × basket</F></>],
    ["cross", `Full marks at a ${FULL_MARKS.haloLiftPct}% average lift.`, <>Each channel <F>(during − before) ÷ before</F>, weekly averages; incremental totals × campaign weeks</>],
    ["business", `Zero at half of break-even, full marks at ${FULL_MARKS.roasOverBreakEven}× break-even.`, <>Revenue <F>footfall revenue + online revenue</F> · ROAS <F>revenue ÷ spend</F> · break-even <F>1 ÷ margin</F> · ROI <F>(revenue × margin − spend) ÷ spend</F></>],
    ["brand", `Full marks at a ${FULL_MARKS.brandLiftPct}% average relative lift.`, <>Lift <F>exposed − control</F> in points; significance by two-proportion z-test on the respondents per group</>],
    ["increment", `Zero at ${FULL_MARKS.confidenceFrom * 100}% confidence, full marks at ${FULL_MARKS.confidenceTo * 100}%. Zero if the test group did worse.`, <>Two-proportion z-test, two-sided · 95% range on the lift from the unpooled standard error</>],
  ];
  return (
    <>
      <h2 className="text-3xl font-bold tracking-[-0.04em]">Methodology</h2>
      <p className="max-w-3xl text-muted">
        The Intelligence score is a weighted average of seven layers, each scored 0–100 against a benchmark, then capped if delivery quality fails. The benchmarks are planning rules of thumb, not industry standards; treat the score as a way to compare campaigns, not as an audited result.
      </p>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,22rem),1fr))]">
        {items.map(([l, score, formula]) => (
          <section key={l} className="glass rounded-2xl border-l-4 p-5" style={{ borderLeftColor: LAYER_COLOR[l] }}>
            <h3 className="flex items-baseline justify-between gap-2 font-display font-bold">
              {LAYER_LABEL[l]}
              <span className="font-mono text-sm font-normal text-muted">{WEIGHTS[l]}%</span>
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{formula}</p>
            <p className="mt-2 text-sm text-muted">{score}</p>
          </section>
        ))}
      </div>
      <div className="glass rounded-3xl p-5 text-sm leading-relaxed sm:p-6">
        <h3 className="font-display font-bold">Good to know</h3>
        <ul className="mt-2 list-square space-y-1.5 pl-5 text-muted">
          <li>The sample campaign, Meridian Coffee Co., is fictional. Replace every input with your own campaign data: type it in, or upload your vendors&apos; reports on the Data Sources tab.</li>
          <li>Footfall and brand lift are only as good as the control group. Match it on geography, demographics and time.</li>
          <li>Your numbers and uploaded files stay in this browser (local storage key <F>doohsight-state</F>). Only the market lookups send anything: the place name to Wikidata and the brand name and dates to Google Trends, through this site&apos;s server.</li>
          <li>
            Last edited:{" "}
            <span className="font-mono">{updated ? new Date(updated).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "not yet (showing the sample)"}</span>
          </li>
        </ul>
      </div>
    </>
  );
}
