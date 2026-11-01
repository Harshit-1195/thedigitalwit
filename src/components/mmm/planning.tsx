"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { forecast, optimize, type Bounds } from "@/lib/mmm/engine";
import { fmtKpi, fmtMoney, fmtRoi } from "@/lib/mmm/insights";
import { SpendBars } from "./charts";
import { PanelHead, type Ctx } from "./panels";
import { btn, btnPrimary, btnSm, ChartCard, inp, Legend, seriesColor, STATUS, Tile, TRACK_STRONG } from "./ui";

const SCEN_KEY = "mmm-scenarios-v1";
const PCT_KEY = "mmm-scen-pct-v1";
const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = JSON.parse(localStorage.getItem(k) ?? "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};
const signed = (v: number, f: (x: number) => string) => `${v >= 0 ? "+" : "−"}${f(Math.abs(v))}`;

/* ---------- Budget optimizer ---------- */
export function OptimizerPanel({ c }: { c: Ctx }) {
  const { r, s } = c;
  const id = useId();
  const current = useMemo(() => r.channels.map((ch) => ch.current), [r]);
  const now = current.reduce((a, b) => a + b, 0);
  const [budget, setBudget] = useState(now);
  const [bounds, setBounds] = useState<Bounds[]>(() => r.channels.map((ch) => ({ min: ch.current * 0.5, max: ch.current * 2, locked: false })));
  useEffect(() => {
    setBudget(now);
    setBounds(r.channels.map((ch) => ({ min: ch.current * 0.5, max: ch.current * 2, locked: false })));
  }, [r, now]);

  const opt = useMemo(() => optimize(r, budget, bounds), [r, budget, bounds]);
  const base = useMemo(() => forecast(r, current), [r, current]);
  const better = useMemo(() => forecast(r, opt.spend), [r, opt.spend]);
  const diffDraws = better.draws.map((v, i) => v - base.draws[i]).sort((a, b) => a - b);
  const q = (p: number) => diffDraws[Math.round(p * (diffDraws.length - 1))] ?? 0;
  const gain = better.value - base.value;
  const spent = opt.spend.reduce((a, b) => a + b, 0);
  const minTotal = bounds.reduce((a, b, i) => a + (b.locked ? current[i] : b.min), 0);
  const maxTotal = bounds.reduce((a, b, i) => a + (b.locked ? current[i] : b.max), 0);
  const setB = (i: number, p: Partial<Bounds>) => setBounds((bs) => bs.map((b, j) => (j === i ? { ...b, ...p } : b)));

  return (
    <>
      <PanelHead title="Budget optimizer" intro={`The best split of a weekly budget across channels, by the model's response curves, within your limits. Today's average is ${fmtMoney(s.currency, now)} a week.`} />
      <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby={`${id}-b`}>
        <h3 id={`${id}-b`} className="font-display text-lg font-bold">
          Weekly budget
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[
            ["−10%", now * 0.9],
            ["Current", now],
            ["+10%", now * 1.1],
          ].map(([l, v]) => (
            <button key={l as string} type="button" aria-pressed={Math.abs(budget - (v as number)) < 0.5} onClick={() => setBudget(v as number)} className={Math.abs(budget - (v as number)) < 0.5 ? "inline-flex items-center justify-center rounded-full border-2 border-ink bg-ink px-4 py-2 font-display text-sm font-semibold text-white" : btn}>
              {l}
            </button>
          ))}
          <label htmlFor={`${id}-amt`} className="ml-2 font-display text-sm font-semibold">
            Custom
          </label>
          <div className="flex items-center gap-1">
            <span className="font-mono text-muted">{s.currency}</span>
            <input id={`${id}-amt`} type="number" min={0} step={100} value={Math.round(budget)} onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))} className={`${inp} w-36`} />
          </div>
          <span className="text-sm text-muted">{fmtMoney(s.currency, budget * 52)} a year</span>
        </div>
        {budget < minTotal - 0.5 && <p className="mt-3 text-sm" style={{ color: STATUS.crit }}>× The budget is below the minimums and locks ({fmtMoney(s.currency, minTotal)} a week). Lower some minimums or unlock a channel.</p>}
        {opt.unallocated > 0.5 && <p className="mt-3 text-sm" style={{ color: STATUS.warn }}>! {fmtMoney(s.currency, opt.unallocated)} a week can&apos;t be placed: every channel is at its maximum ({fmtMoney(s.currency, maxTotal)} in total). Raise some maximums.</p>}
      </section>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11.5rem),1fr))]">
        <Tile lead label={`Extra ${s.kpiType} a year`} value={signed(gain * 52, (v) => fmtKpi(s, v))} sub={`90%: ${fmtKpi(s, q(0.05) * 52)} to ${fmtKpi(s, q(0.95) * 52)}, vs today's split`} />
        <Tile label="Media-driven, per week" value={fmtKpi(s, better.value)} sub={`Today ${fmtKpi(s, base.value)}`} />
        <Tile label="Return on the budget" value={fmtRoi(s, spent ? better.value / spent : 0)} sub={`Today ${fmtRoi(s, now ? base.value / now : 0)}`} />
        <Tile label="Spend placed" value={fmtMoney(s.currency, spent)} sub={`of ${fmtMoney(s.currency, budget)} a week`} />
      </div>
      <ChartCard id="optimizer" title="Today vs recommended, per week" legend={<Legend items={[{ label: "Today", color: TRACK_STRONG }, { label: "Recommended (channel colour)", color: seriesColor(0) }]} />} render={(w, h) => <SpendBars r={r} s={s} a={current} b={opt.spend} aLabel="Today" bLabel="Recommended" w={w} h={h} />} />
      <section className="glass min-w-0 rounded-3xl p-5 sm:p-6" aria-labelledby={`${id}-l`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id={`${id}-l`} className="font-display text-lg font-bold">
            Limits per channel
          </h3>
          <button type="button" className={btnSm} onClick={() => setBounds(r.channels.map((ch) => ({ min: ch.current * 0.5, max: ch.current * 2, locked: false })))}>
            Reset limits
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">Weekly amounts. Defaults are half to double today&apos;s spend: the curves are only reliable near spend levels the data has seen. Lock a channel to keep it at today&apos;s level.</p>
        <div className="relative mt-3 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink">
                {["Channel", "Today", "Min", "Max", "Lock", "Recommended", "Change"].map((h, i) => (
                  <th key={h} scope="col" className={`py-2 pr-3 font-display font-semibold ${i && i !== 4 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.channels.map((ch, i) => {
                const d = opt.spend[i] - current[i];
                return (
                  <tr key={ch.name} className="border-b border-ink/10">
                    <th scope="row" className="py-2 pr-3 font-semibold">
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="size-2.5 rounded-sm" style={{ background: seriesColor(i) }} />
                        {ch.name}
                      </span>
                    </th>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums">{fmtMoney(s.currency, current[i])}</td>
                    {(["min", "max"] as const).map((k) => (
                      <td key={k} className="py-2 pr-3 text-right">
                        <input type="number" min={0} step={100} aria-label={`${ch.name} ${k === "min" ? "minimum" : "maximum"} weekly spend`} value={Math.round(bounds[i]?.[k] ?? 0)} disabled={bounds[i]?.locked} onChange={(e) => setB(i, { [k]: Math.max(0, Number(e.target.value) || 0) })} className={`${inp} ml-auto w-28 text-right disabled:opacity-40`} />
                      </td>
                    ))}
                    <td className="py-2 pr-3">
                      <input type="checkbox" aria-label={`Lock ${ch.name} at today's spend`} checked={!!bounds[i]?.locked} onChange={(e) => setB(i, { locked: e.target.checked })} className="size-4 accent-[var(--accent)]" />
                    </td>
                    <td className="py-2 pr-3 text-right font-mono font-semibold tabular-nums">{fmtMoney(s.currency, opt.spend[i])}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums" style={{ color: Math.abs(d) < 0.5 ? undefined : d > 0 ? STATUS.good : STATUS.crit }}>
                      {Math.abs(d) < 0.5 ? "±0" : signed(d, (v) => fmtMoney(s.currency, v))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ---------- Scenario planner ---------- */
type Saved = { name: string; dataset: string; pct: Record<string, number>; at: string };

export function ScenarioPanel({ c, notify }: { c: Ctx; notify: (m: string) => void }) {
  const { r, s, d } = c;
  const id = useId();
  const [pct, setPct] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<Saved[]>([]);
  const [name, setName] = useState("");
  useEffect(() => {
    setPct(read<Record<string, Record<string, number>>>(PCT_KEY, {})[d.name] ?? {});
    setSaved(read<Saved[]>(SCEN_KEY, []));
  }, [d.name]);
  const update = (next: Record<string, number>) => {
    setPct(next);
    const all = read<Record<string, Record<string, number>>>(PCT_KEY, {});
    write(PCT_KEY, { ...all, [d.name]: next });
  };
  const current = r.channels.map((ch) => ch.current);
  const plan = r.channels.map((ch, i) => current[i] * (1 + (pct[ch.name] ?? 0) / 100));
  const base = forecast(r, current);
  const scen = forecast(r, plan);
  const dd = scen.draws.map((v, i) => v - base.draws[i]).sort((a, b) => a - b);
  const q = (p: number) => dd[Math.round(p * (dd.length - 1))] ?? 0;
  const gain = scen.value - base.value;
  const dSpend = plan.reduce((a, b) => a + b, 0) - current.reduce((a, b) => a + b, 0);
  const total = r.baselineWeekly + scen.value;
  const mine = saved.filter((x) => x.dataset === d.name);

  const save = () => {
    const nm = name.trim() || `Scenario ${mine.length + 1}`;
    const next = [...saved.filter((x) => !(x.dataset === d.name && x.name === nm)), { name: nm, dataset: d.name, pct, at: new Date().toISOString() }];
    setSaved(next);
    write(SCEN_KEY, next);
    setName("");
    notify(`Saved “${nm}”`);
  };
  const remove = (nm: string) => {
    const next = saved.filter((x) => !(x.dataset === d.name && x.name === nm));
    setSaved(next);
    write(SCEN_KEY, next);
  };
  const outcome = (p: Record<string, number>) => {
    const sp = r.channels.map((ch, i) => current[i] * (1 + (p[ch.name] ?? 0) / 100));
    return { gain: forecast(r, sp).value - base.value, spend: sp.reduce((a, b) => a + b, 0) - current.reduce((a, b) => a + b, 0) };
  };

  return (
    <>
      <PanelHead title="Scenario planner" intro="Move each channel's weekly spend up or down and see the forecast straight away. Forecasts are steady-state weekly averages; beyond double today's spend the curves are extrapolating." />
      <div className="grid gap-6 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby={`${id}-s`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 id={`${id}-s`} className="font-display text-lg font-bold">
              Weekly spend by channel
            </h3>
            <button type="button" className={btnSm} onClick={() => update({})}>
              Reset all
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {r.channels.map((ch, i) => {
              const v = pct[ch.name] ?? 0;
              return (
                <div key={ch.name}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <label htmlFor={`${id}-${i}`} className="flex items-center gap-2 font-display font-semibold">
                      <span aria-hidden className="size-2.5 rounded-sm" style={{ background: seriesColor(i) }} />
                      {ch.name}
                    </label>
                    <span className="font-mono text-xs tabular-nums">
                      <b style={{ color: v > 0 ? STATUS.good : v < 0 ? STATUS.crit : undefined }}>{v > 0 ? "+" : v < 0 ? "−" : "±"}{Math.abs(v)}%</b> · {fmtMoney(s.currency, plan[i])}/wk
                    </span>
                  </div>
                  <input id={`${id}-${i}`} type="range" min={-100} max={150} step={5} value={v} onChange={(e) => update({ ...pct, [ch.name]: Number(e.target.value) })} aria-valuetext={`${v}% (${fmtMoney(s.currency, plan[i])} a week)`} className="mt-1.5 w-full" style={{ accentColor: seriesColor(i) }} />
                </div>
              );
            })}
          </div>
        </section>
        <div className="min-w-0 space-y-6">
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr))]">
            <Tile lead label={`Forecast ${s.kpiType}, per week`} value={fmtKpi(s, total)} sub={`Baseline ${fmtKpi(s, r.baselineWeekly)} + media ${fmtKpi(s, scen.value)}`} />
            <Tile label="Change vs today" value={signed(gain, (v) => fmtKpi(s, v))} sub={`90%: ${fmtKpi(s, q(0.05))} to ${fmtKpi(s, q(0.95))} a week`} />
            <Tile label="Spend change" value={signed(dSpend, (v) => fmtMoney(s.currency, v))} sub={`${fmtMoney(s.currency, dSpend * 52)} a year`} />
            <Tile label={s.kpiType === "revenue" ? "Return on the change" : "Cost of each extra conversion"} value={Math.abs(dSpend) < 1 ? "—" : s.kpiType === "revenue" ? `${(gain / dSpend).toFixed(2)}×` : gain > 0 && dSpend > 0 ? fmtMoney(s.currency, dSpend / gain, 2) : "—"} sub={Math.abs(dSpend) < 1 ? "Move a slider" : "Extra results ÷ extra spend"} />
          </div>
          <ChartCard id="scenario" title="Today vs scenario, per week" legend={<Legend items={[{ label: "Today", color: TRACK_STRONG }, { label: "Scenario (channel colour)", color: seriesColor(0) }]} />} render={(w, h) => <SpendBars r={r} s={s} a={current} b={plan} aLabel="Today" bLabel="Scenario" w={w} h={h} />} />
        </div>
      </div>
      <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby={`${id}-sv`}>
        <h3 id={`${id}-sv`} className="font-display text-lg font-bold">
          Saved scenarios
        </h3>
        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label htmlFor={`${id}-nm`} className="sr-only">
            Scenario name
          </label>
          <input id={`${id}-nm`} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={`Scenario ${mine.length + 1}`} className={`${inp} w-64 font-sans`} />
          <button type="submit" className={btnPrimary}>
            Save scenario
          </button>
        </form>
        {mine.length ? (
          <div className="relative mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink">
                  {["Scenario", "Spend change / wk", `${s.kpiType === "revenue" ? "Revenue" : "Conversions"} change / wk`, ""].map((h, i) => (
                    <th key={h + i} scope="col" className={`py-2 pr-3 font-display font-semibold ${i === 1 || i === 2 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mine.map((x) => {
                  const o = outcome(x.pct);
                  return (
                    <tr key={x.name} className="border-b border-ink/10">
                      <th scope="row" className="py-2 pr-3 font-semibold">{x.name}</th>
                      <td className="py-2 pr-3 text-right font-mono tabular-nums">{signed(o.spend, (v) => fmtMoney(s.currency, v))}</td>
                      <td className="py-2 pr-3 text-right font-mono tabular-nums">{signed(o.gain, (v) => fmtKpi(s, v))}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button type="button" className={btnSm} onClick={() => update(x.pct)}>
                          Load
                        </button>{" "}
                        <button type="button" className={btnSm} onClick={() => remove(x.name)} aria-label={`Delete ${x.name}`}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No saved scenarios for {d.name} yet. They&apos;re kept in this browser.</p>
        )}
      </section>
    </>
  );
}
