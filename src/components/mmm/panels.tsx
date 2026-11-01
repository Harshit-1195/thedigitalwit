"use client";

import { useState, type ReactNode } from "react";
import type { Dataset, FitResult } from "@/lib/mmm/engine";
import { fmtKpi, fmtMoney, fmtRoi, roiLabel, type Settings, type Summary } from "@/lib/mmm/insights";
import { sampleTruthRoi, SAMPLE_TRUTH } from "@/lib/mmm/sample";
import { CurveGrid, FitChart, RoiChart, WeeklyChart, type FitStyle, type RoiStyle, type WeeklyView } from "./charts";
import { ActionPill, btnSm, ChartCard, INK, Legend, Seg, seriesColor, shortDate, STATUS, Tile, TRACK, TRACK_STRONG } from "./ui";

export type View = { weekly: WeeklyView; smooth: boolean; roi: RoiStyle; fit: FitStyle };
export type Ctx = {
  r: FitResult;
  s: Settings;
  sum: Summary;
  d: Dataset;
  view: View;
  setView: (p: Partial<View>) => void;
  zoom: [number, number] | null;
  setZoom: (z: [number, number] | null) => void;
};

const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;

function ZoomControls({ c }: { c: Ctx }) {
  const n = c.r.n;
  const opts: [string, number | null][] = [["13w", 13], ["26w", 26], ["52w", 52], ["All", null]];
  const on = (k: number | null) => (k === null ? c.zoom === null : !!c.zoom && c.zoom[0] === n - k && c.zoom[1] === n - 1);
  return (
    <div role="group" aria-label="Period" className="inline-flex rounded-full border-2 border-ink/15 bg-white/80 p-0.5">
      {opts.map(([l, k]) => (
        <button key={l} type="button" aria-pressed={on(k)} disabled={k !== null && k >= n} onClick={() => c.setZoom(k === null ? null : [n - k, n - 1])} className={`rounded-full px-2.5 py-1 font-mono text-xs font-semibold disabled:opacity-40 ${on(k) ? "bg-ink text-white" : "hover:bg-ink/5"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}
const zoomNote = (c: Ctx) =>
  c.zoom ? (
    <>
      Showing {shortDate(c.r.dates[c.zoom[0]])} to {shortDate(c.r.dates[c.zoom[1]])}.{" "}
      <button type="button" className="font-semibold text-ink underline" onClick={() => c.setZoom(null)}>
        Reset zoom
      </button>
    </>
  ) : (
    "Drag across the chart to zoom into a period."
  );

/* ---------- Summary ---------- */
export function SummaryPanel({ c }: { c: Ctx }) {
  const { r, s, sum } = c;
  const best = sum.best;
  return (
    <>
      <section className="glass rounded-3xl bg-accent-soft/40 p-5 sm:p-7">
        <p className="eyebrow text-accent">Key finding · {c.d.name}</p>
        <h2 className="mt-2 max-w-4xl text-[clamp(1.6rem,3.6vw,2.6rem)] leading-[1.08] font-extrabold tracking-[-0.04em]">{sum.headline}</h2>
        <p className="mt-3 max-w-3xl text-lg text-muted">{sum.sub}</p>
        {c.d.sample && (
          <p className="mt-3 text-sm text-muted">
            This is a fictional sample so you can explore. <a href="#data" className="font-semibold text-ink underline">Use your own data</a>
          </p>
        )}
      </section>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11.5rem),1fr))]">
        <Tile lead label={`${s.kpiType === "revenue" ? "Revenue" : "Conversions"} driven by media`} value={pct(sum.mediaShare)} sub={`${fmtKpi(s, sum.media)} over ${r.n} weeks`} />
        <Tile label={s.kpiType === "revenue" ? "Return on media (ROAS)" : "Cost per conversion"} value={fmtRoi(s, sum.totalRoi)} sub={s.kpiType === "revenue" ? `Break-even ${sum.be.toFixed(2)}× at ${s.margin}% margin` : s.targetCpa ? `Target ${fmtMoney(s.currency, s.targetCpa, 2)}` : "Across all channels"} />
        <Tile label="Best channel" value={<span className="text-xl sm:text-2xl">{best.name}</span>} sub={`${fmtRoi(s, best.roi)} (90%: ${fmtRoi(s, best.ci.roi[0])} to ${fmtRoi(s, best.ci.roi[1])})`} />
        <Tile label="From a better split, per year" value={sum.upliftWeekly > 0 ? `+${fmtKpi(s, sum.upliftWeekly * 52)}` : "≈0"} sub={`Same budget · 90%: ${fmtKpi(s, sum.upliftRange[0] * 52)} to ${fmtKpi(s, sum.upliftRange[1] * 52)}`} />
        <Tile label="Holdout accuracy" value={`${sum.accuracy.toFixed(1)}%`} sub={r.holdout ? `Last ${r.holdout.weeks} weeks predicted blind` : "In-sample (too few weeks to hold out)"} />
      </div>
      <div className="grid gap-6 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby="ml-ins">
          <h3 id="ml-ins" className="font-display text-lg font-bold">
            What the model sees
          </h3>
          <ul className="mt-3 list-square space-y-2 pl-5 text-sm leading-relaxed">
            {sum.insights.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
        <Scorecard c={c} />
      </div>
      <ChartCard
        id="weekly"
        title={c.view.weekly === "mix" ? "Media mix by week" : c.view.weekly === "baseline" ? "What drove each week" : "Media contribution by week"}
        sub={c.view.weekly === "mix" ? "Each channel's share of media-driven results" : `Weekly ${s.kpiType}, split by source`}
        controls={
          <>
            <label className="sr-only" htmlFor="ml-basis">
              Chart view
            </label>
            <select id="ml-basis" value={c.view.weekly} onChange={(e) => c.setView({ weekly: e.target.value as WeeklyView })} className="rounded-full border-2 border-ink/15 bg-white px-3 py-1 font-display text-xs font-semibold">
              <option value="media">Media only</option>
              <option value="baseline">With baseline</option>
              <option value="mix">Channel mix %</option>
            </select>
            <label className="inline-flex cursor-pointer items-center gap-1.5 font-display text-xs font-semibold">
              <input type="checkbox" checked={c.view.smooth} onChange={(e) => c.setView({ smooth: e.target.checked })} className="size-4 accent-[var(--accent)]" />
              Smooth
            </label>
            <ZoomControls c={c} />
          </>
        }
        legend={<Legend items={[...(c.view.weekly === "baseline" ? [{ label: "Actual", color: INK, dash: false }, { label: "Baseline", color: TRACK }] : []), ...r.channels.map((ch, i) => ({ label: ch.name, color: seriesColor(i) }))]} />}
        note={<>{c.view.smooth && "4-week average. "}{zoomNote(c)}</>}
        render={(w, h) => <WeeklyChart r={r} s={s} view={c.view.weekly} smooth={c.view.smooth} zoom={c.zoom} setZoom={c.setZoom} w={w} h={h} />}
      />
    </>
  );
}

function Scorecard({ c }: { c: Ctx }) {
  const { r, s, sum } = c;
  return (
    <section className="glass min-w-0 rounded-3xl p-5 sm:p-6" aria-labelledby="ml-score">
      <h3 id="ml-score" className="font-display text-lg font-bold">
        Channel scorecard
      </h3>
      <div className="relative mt-3 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink">
              <th scope="col" className="py-2 pr-3 font-display font-semibold">Channel</th>
              <th scope="col" className="py-2 pr-3 text-right font-display font-semibold">Spend</th>
              <th scope="col" className="py-2 pr-3 text-right font-display font-semibold">{roiLabel(s)}</th>
              <th scope="col" className="py-2 pr-3 text-right font-display font-semibold">Next {s.currency}1</th>
              <th scope="col" className="py-2 font-display font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {r.channels.map((ch, i) => (
              <tr key={ch.name} className="border-b border-ink/10 align-top">
                <th scope="row" className="py-2.5 pr-3 font-semibold">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: seriesColor(i) }} />
                    {ch.name}
                  </span>
                </th>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                  {fmtMoney(s.currency, ch.totalSpend)}
                  <span className="block text-xs text-muted">{pct(ch.spendShare)} of media</span>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                  {fmtRoi(s, ch.roi)}
                  <span className="block text-xs text-muted">
                    {fmtRoi(s, ch.ci.roi[0])}–{fmtRoi(s, ch.ci.roi[1])}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{s.kpiType === "revenue" ? `${s.currency}${ch.mroi.toFixed(2)}` : `${(ch.mroi * 1000).toFixed(1)}/${s.currency}1k`}</td>
                <td className="py-2.5">
                  <ActionPill action={sum.actions[i]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        Ranges are 90% intervals. &ldquo;Next {s.currency}1&rdquo; is what one more unit of weekly spend returns at today&apos;s level; actions compare it with break-even ({s.kpiType === "revenue" ? `${sum.be.toFixed(2)}× at a ${s.margin}% margin` : s.targetCpa ? `a ${fmtMoney(s.currency, s.targetCpa, 2)} target cost per conversion` : "the average across channels"}).
      </p>
    </section>
  );
}

/* ---------- Channel ROI ---------- */
export function RoiPanel({ c }: { c: Ctx }) {
  const { r, s, sum } = c;
  return (
    <>
      <PanelHead title="Channel ROI" intro={`What each channel returned over ${r.n} weeks, with 90% ranges. The dashed red line is break-even: below it, a channel didn't pay for itself${s.kpiType === "revenue" ? ` at a ${s.margin}% gross margin` : ""}.`} />
      <ChartCard
        id="roi"
        title={c.view.roi === "bars" ? `${roiLabel(s)} by channel` : "Return against share of spend"}
        sub={c.view.roi === "bubble" ? "Bubble size is total contribution" : undefined}
        controls={<Seg label="Chart style" value={c.view.roi} options={[["bars", "Bars"], ["bubble", "Bubble"]]} onChange={(v) => c.setView({ roi: v })} />}
        legend={<Legend items={[{ label: s.kpiType === "revenue" ? `Break-even ${sum.be.toFixed(2)}×` : "Break-even", color: STATUS.crit, dash: true }, ...(c.view.roi === "bars" ? [{ label: "90% range", color: INK, dash: false }] : [])]} />}
        render={(w, h) => <RoiChart r={r} s={s} sum={sum} style={c.view.roi} w={w} h={h} />}
      />
      <div className="relative overflow-x-auto rounded-3xl glass p-5 sm:p-6">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink">
              {["Channel", "Spend", "Contribution", roiLabel(s), "90% range", "Next " + s.currency + "1", "Action"].map((h, i) => (
                <th key={h} scope="col" className={`py-2 pr-3 font-display font-semibold ${i > 0 && i < 6 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.channels.map((ch, i) => (
              <tr key={ch.name} className="border-b border-ink/10">
                <th scope="row" className="py-2.5 pr-3 font-semibold">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="size-2.5 rounded-sm" style={{ background: seriesColor(i) }} />
                    {ch.name}
                  </span>
                </th>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{fmtMoney(s.currency, ch.totalSpend)}</td>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                  {fmtKpi(s, ch.totalContrib)} <span className="text-xs text-muted">({pct(ch.contribShare)})</span>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono font-semibold tabular-nums">{fmtRoi(s, ch.roi)}</td>
                <td className="py-2.5 pr-3 text-right font-mono text-muted tabular-nums">
                  {fmtRoi(s, ch.ci.roi[0])} to {fmtRoi(s, ch.ci.roi[1])}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{s.kpiType === "revenue" ? `${s.currency}${ch.mroi.toFixed(2)}` : `${(ch.mroi * 1000).toFixed(1)}/${s.currency}1k`}</td>
                <td className="py-2.5">
                  <ActionPill action={sum.actions[i]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- Response curves ---------- */
export function CurvesPanel({ c }: { c: Ctx }) {
  const { r, s, sum } = c;
  const [show, setShow] = useState(() => r.channels.map(() => true));
  const shown = show.length === r.channels.length ? show : r.channels.map(() => true);
  return (
    <>
      <PanelHead title="Response curves" intro={`How weekly ${s.kpiType} responds to steady weekly spend in each channel, after carryover. The flatter the curve at today's spend (black dot), the less the next ${s.currency}1 brings. Shaded bands are 90% ranges; the dashed red line is break-even on average.`} />
      <div role="group" aria-label="Channels shown" className="flex flex-wrap gap-2">
        {r.channels.map((ch, i) => (
          <button key={ch.name} type="button" aria-pressed={shown[i]} onClick={() => setShow(shown.map((v, j) => (j === i ? !v : v)))} className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 font-display text-sm font-semibold transition-colors ${shown[i] ? "border-ink bg-white" : "border-ink/15 bg-white/50 text-muted"}`}>
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: shown[i] ? seriesColor(i) : TRACK_STRONG }} />
            {ch.name}
          </button>
        ))}
      </div>
      <ChartCard id="curves" title="Weekly spend → weekly results" legend={<Legend items={[{ label: "Today's spend", color: INK }, { label: "90% range", color: seriesColor(0), band: true }, { label: "Break-even", color: STATUS.crit, dash: true }]} />} render={(w, h) => <CurveGrid r={r} s={s} sum={sum} show={shown} w={w} h={h} />} />
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]">
        {r.channels.map((ch, i) => (
          <div key={ch.name} className="glass rounded-2xl p-4 text-sm">
            <p className="flex items-center gap-2 font-display font-semibold">
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: seriesColor(i) }} />
              {ch.name}
            </p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted">Carryover</dt>
              <dd className="font-mono">{ch.params.theta === 0 ? "none" : `${Math.round(ch.params.theta * 100)}% a week (half-life ${(Math.log(0.5) / Math.log(ch.params.theta)).toFixed(1)} wk)`}</dd>
              <dt className="text-muted">Half-saturation</dt>
              <dd className="font-mono">{fmtMoney(s.currency, ch.params.k)} a week</dd>
              <dt className="text-muted">Curve shape</dt>
              <dd className="font-mono">{ch.params.s === 1 ? "Diminishing from the start" : "S-shaped: slow start"}</dd>
              <dt className="text-muted">Today</dt>
              <dd className="font-mono">{fmtMoney(s.currency, ch.current)} a week</dd>
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Model accuracy ---------- */
export function FitPanel({ c }: { c: Ctx }) {
  const { r, s } = c;
  const ho = r.holdout;
  const grade = (m: number) => (m <= 5 ? { t: "Good", color: STATUS.good, icon: "✓" } : m <= 10 ? { t: "Fair", color: STATUS.warn, icon: "!" } : { t: "Weak", color: STATUS.crit, icon: "×" });
  const g = grade(ho ? ho.mape : r.mape);
  return (
    <>
      <PanelHead title="Model accuracy" intro="How closely the model tracks reality. The fairest test is the held-out period: those weeks were left out of fitting and predicted blind." />
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11.5rem),1fr))]">
        <Tile
          lead
          label="Holdout accuracy"
          value={ho ? `${(100 - ho.mape).toFixed(1)}%` : "—"}
          sub={
            <span className="inline-flex items-center gap-1.5">
              <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: g.color }}>
                <span aria-hidden>{g.icon}</span> {g.t}
              </span>
              {ho ? `average error ${ho.mape.toFixed(1)}% over ${ho.weeks} weeks` : "too few weeks to hold any out"}
            </span>
          }
        />
        <Tile label="Fit on all weeks (R²)" value={r.r2.toFixed(3)} sub="1.000 is a perfect fit" />
        <Tile label="Average weekly error" value={`${r.mape.toFixed(1)}%`} sub="In-sample (MAPE)" />
        <Tile label="Holdout R²" value={ho ? ho.r2.toFixed(2) : "—"} sub="Can be low over a short, flat period" />
      </div>
      <ChartCard
        id="fit"
        title={c.view.fit === "time" ? "Actual and predicted, by week" : "Actual against predicted"}
        controls={
          <>
            <Seg label="Chart style" value={c.view.fit} options={[["time", "Over time"], ["scatter", "Actual vs predicted"]]} onChange={(v) => c.setView({ fit: v })} />
            <ZoomControls c={c} />
          </>
        }
        legend={<Legend items={[{ label: "Actual", color: INK }, { label: "Model", color: seriesColor(0) }, ...(ho ? [{ label: "Blind forecast (held out)", color: seriesColor(1), dash: c.view.fit === "time" }] : [])]} />}
        note={c.view.fit === "scatter" ? "Dots on the dashed line are perfect predictions." : zoomNote(c)}
        render={(w, h) => <FitChart r={r} s={s} style={c.view.fit} zoom={c.zoom} w={w} h={h} />}
      />
    </>
  );
}

/* ---------- Methodology ---------- */
export function MethodPanel({ c }: { c: Ctx }) {
  const { r, s, d } = c;
  const truth = d.sample ? sampleTruthRoi(d) : null;
  const covered = truth ? r.channels.filter((ch) => truth[ch.name] >= ch.ci.roi[0] && truth[ch.name] <= ch.ci.roi[1]).length : 0;
  const F = ({ children }: { children: ReactNode }) => <code className="rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[0.8rem] text-accent-strong">{children}</code>;
  return (
    <>
      <PanelHead title="Methodology" intro="How the model works, what it assumes and where it can go wrong." />
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
        {[
          ["The model", <>Weekly {s.kpiType} is explained as baseline (intercept, trend, a 52-week seasonal cycle and any control columns) plus one term per channel: <F>effect × saturation(carryover(spend))</F>. Media effects can&apos;t be negative.</>],
          ["Carryover (adstock)", <>Part of each week&apos;s spend keeps working the next week: <F>a(t) = (1−θ)·spend(t) + θ·a(t−1)</F>. θ is chosen per channel from 0 to 0.8. A steady spend gives the same steady level, so curves read in weekly spend.</>],
          ["Saturation", <>Each channel follows a Hill curve <F>x^S ÷ (x^S + K^S)</F>: K is the weekly spend at half the channel&apos;s maximum effect. S = 1 means diminishing returns from the first {s.currency}1; S = 2 is S-shaped and is only chosen when the fit clearly improves.</>],
          ["Fitting", <>Carryover, K and shape are searched per channel over a grid from four starting points; the rest is least squares with a tiny ridge penalty. It runs in your browser: {r.n} weeks took {(r.ms / 1000).toFixed(1)}s.</>],
          ["Uncertainty", <>Ranges come from {r.reps.length} bootstrap refits: the model&apos;s errors are reshuffled in 4-week blocks, and each refit re-searches carryover and saturation near the best fit. Ranges are the middle 90%.</>],
          ["Accuracy check", <>{r.holdout ? `The last ${r.holdout.weeks} weeks are hidden, the model is fitted on the rest, and those weeks are predicted blind.` : "With fewer than 30 weeks there is nothing to hold out, so accuracy is in-sample only."} Reported results then use every week.</>],
          ["Optimizer", <>Spend is added in small steps to whichever channel gains most from the next step, within your limits (default half to double today&apos;s spend, where the data has evidence). Results are weekly, at today&apos;s mix of everything else.</>],
          ["Limits", <>Correlation isn&apos;t causation: channels that always move together can&apos;t be told apart, and anything that drives sales and isn&apos;t in the data (competitors, PR, pricing) can leak into a channel. Validate big moves with a geo or holdout test.</>],
        ].map(([t, body]) => (
          <section key={String(t)} className="glass rounded-2xl p-5 text-sm leading-relaxed">
            <h3 className="font-display font-bold">{t}</h3>
            <p className="mt-2">{body}</p>
          </section>
        ))}
      </div>
      {truth && (
        <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby="ml-truth">
          <h3 id="ml-truth" className="font-display text-lg font-bold">
            How close it gets on the sample
          </h3>
          <p className="mt-1 text-sm text-muted">
            The sample was generated from known true values, so the estimates can be checked. {covered} of {r.channels.length} true values fall inside the 90% range. Misses show what to expect with real data: channels whose spend barely varies are the hardest to pin down.
          </p>
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink">
                  {["Channel", "True ROAS", "Estimated", "90% range", "Inside?", "True carryover", "Estimated"].map((h, i) => (
                    <th key={h + i} scope="col" className={`py-2 pr-3 font-display font-semibold ${i ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.channels.map((ch) => {
                  const t = truth[ch.name];
                  const inside = t >= ch.ci.roi[0] && t <= ch.ci.roi[1];
                  return (
                    <tr key={ch.name} className="border-b border-ink/10">
                      <th scope="row" className="py-2 pr-3 font-semibold">{ch.name}</th>
                      <td className="py-2 pr-3 text-right font-mono tabular-nums">{t.toFixed(2)}×</td>
                      <td className="py-2 pr-3 text-right font-mono tabular-nums">{ch.roi.toFixed(2)}×</td>
                      <td className="py-2 pr-3 text-right font-mono text-muted tabular-nums">
                        {ch.ci.roi[0].toFixed(2)}–{ch.ci.roi[1].toFixed(2)}
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold" style={{ color: inside ? STATUS.good : STATUS.warn }}>
                        <span aria-hidden>{inside ? "✓ " : "! "}</span>
                        {inside ? "Yes" : "No"}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono tabular-nums">{SAMPLE_TRUTH[ch.name].theta.toFixed(1)}</td>
                      <td className="py-2 pr-3 text-right font-mono tabular-nums">{ch.params.theta.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className="glass rounded-3xl p-5 text-sm leading-relaxed sm:p-6">
        <h3 className="font-display font-bold">Your data and privacy</h3>
        <ul className="mt-2 list-square space-y-1.5 pl-5 text-muted">
          <li>Files and pasted data are read in your browser and never sent anywhere. The model runs on your device.</li>
          <li>Settings, saved scenarios and chart styles are kept in this browser&apos;s storage (keys starting <F>mmm-</F>). Your data itself isn&apos;t stored: reload and the sample comes back.</li>
          <li>Best results: 52–104 weeks, a revenue or conversion KPI, spend for every paid channel, and controls for big promotions or price changes.</li>
        </ul>
      </section>
    </>
  );
}

export function PanelHead({ title, intro, children }: { title: string; intro: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-bold tracking-[-0.04em]">{title}</h2>
        <p className="mt-2 text-muted">{intro}</p>
      </div>
      {children}
    </div>
  );
}

export { btnSm };
