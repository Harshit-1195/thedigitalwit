// Media mix model findings: break-even, an action per channel, the headline and plain-language insights. Pure functions.

import { defaultBounds, forecast, optimize, type ChannelResult, type FitResult, type ModelSettings } from "./engine";
import { DEFAULT_MODEL } from "./engine";

export type KpiType = "revenue" | "conversions";
export type Settings = {
  kpiType: KpiType;
  currency: string;
  /** Gross margin, 0-100: share of revenue kept after cost of goods. Revenue KPIs only. */
  margin: number;
  /** Most you'd pay for one conversion. Conversion KPIs only; 0 = compare channels with each other. */
  targetCpa: number;
  model: ModelSettings;
};
export const DEFAULT_SETTINGS: Settings = { kpiType: "revenue", currency: "$", margin: 40, targetCpa: 0, model: DEFAULT_MODEL };

export type Action = "scale" | "hold" | "trim" | "cut" | "none";
export const ACTION_LABEL: Record<Action, string> = { scale: "Scale up", hold: "Hold", trim: "Trim", cut: "Cut back", none: "No measurable lift" };

/** KPI per unit of spend at which a channel pays for itself. */
export function breakEven(r: FitResult, s: Settings) {
  if (s.kpiType === "revenue") return 100 / Math.max(1, Math.min(100, s.margin));
  if (s.targetCpa > 0) return 1 / s.targetCpa;
  const spend = r.channels.reduce((a, c) => a + c.totalSpend, 0);
  return spend ? r.channels.reduce((a, c) => a + c.totalContrib, 0) / spend : 0;
}

/** What to do with a channel, from the return on its next unit of spend against break-even. */
export function actionFor(c: ChannelResult, be: number): Action {
  if (c.noLift) return "none";
  const ratio = be ? c.mroi / be : 1;
  return ratio >= 1.3 ? "scale" : ratio >= 0.9 ? "hold" : ratio >= 0.6 ? "trim" : "cut";
}

export const fmtMoney = (cur: string, v: number, digits?: number) => {
  const a = Math.abs(v);
  const body = digits !== undefined ? a.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }) : a >= 1e9 ? `${(a / 1e9).toFixed(2)}B` : a >= 1e6 ? `${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M` : a >= 1e4 ? `${Math.round(a / 1e3)}k` : a >= 100 ? Math.round(a).toLocaleString("en-US") : a.toFixed(2);
  return `${v < 0 ? "−" : ""}${cur}${body}`;
};
export const fmtNum = (v: number) => {
  const a = Math.abs(v);
  const body = a >= 1e6 ? `${(a / 1e6).toFixed(2)}M` : a >= 1e4 ? `${Math.round(a / 1e3)}k` : a >= 100 ? Math.round(a).toLocaleString("en-US") : a.toFixed(1);
  return `${v < 0 ? "−" : ""}${body}`;
};
/** A KPI amount: money for revenue, a count for conversions. */
export const fmtKpi = (s: Settings, v: number) => (s.kpiType === "revenue" ? fmtMoney(s.currency, v) : fmtNum(v));
/** Return per unit of spend: "2.40×" ROAS, or cost per conversion. */
export const fmtRoi = (s: Settings, roi: number) => (s.kpiType === "revenue" ? `${roi.toFixed(2)}×` : roi > 0 ? `${fmtMoney(s.currency, 1 / roi, 2)} per conv.` : "—");
export const roiLabel = (s: Settings) => (s.kpiType === "revenue" ? "ROAS" : "Cost per conversion");

export function summarize(r: FitResult, s: Settings) {
  const be = breakEven(r, s);
  const actions = r.channels.map((c) => actionFor(c, be));
  const spend = r.channels.reduce((a, c) => a + c.totalSpend, 0);
  const media = r.channels.reduce((a, c) => a + c.totalContrib, 0);
  const kpi = r.actual.reduce((a, b) => a + b, 0);
  const measurable = r.channels.filter((c) => !c.noLift);
  const best = [...(measurable.length ? measurable : r.channels)].sort((a, b) => b.roi - a.roi)[0];
  const worst = [...r.channels].sort((a, b) => a.mroi - b.mroi)[0];

  // Same budget, default limits: what moving money between channels is worth over a year.
  const current = r.channels.map((c) => c.current);
  const total = current.reduce((a, b) => a + b, 0);
  const opt = optimize(r, total, defaultBounds(r));
  const base = forecast(r, current);
  const better = forecast(r, opt.spend);
  const upliftWeekly = better.value - base.value;
  const upliftRange = [0.05, 0.95].map((q) => {
    const d = better.draws.map((v, i) => v - base.draws[i]).sort((a, b) => a - b);
    return d[Math.round(q * (d.length - 1))] ?? 0;
  }) as [number, number];

  const accuracy = r.holdout ? Math.max(0, 100 - r.holdout.mape) : Math.max(0, 100 - r.mape);
  const per = s.kpiType === "revenue" ? `${s.currency}1` : `${s.currency}1`;
  const headline =
    s.kpiType === "revenue"
      ? `${best.name} returns ${s.currency}${best.roi.toFixed(2)} for every ${per} spent, the best of ${r.channels.length} channels.`
      : `${best.name} brings conversions at ${fmtMoney(s.currency, 1 / Math.max(best.roi, 1e-9), 2)} each, the cheapest of ${r.channels.length} channels.`;
  const sub =
    upliftWeekly > 0.002 * Math.abs(base.value + r.baselineWeekly)
      ? `Moving the same budget between channels could add about ${fmtKpi(s, upliftWeekly * 52)} a year.`
      : "The current split is already close to the best this model can find.";

  const insights: string[] = [];
  insights.push(`Media drives ${((media / Math.max(kpi, 1e-9)) * 100).toFixed(0)}% of ${r.n} weeks of ${s.kpiType === "revenue" ? "revenue" : "conversions"}; the rest is baseline demand, trend, season and controls.`);
  const scale = r.channels.filter((_, i) => actions[i] === "scale");
  if (scale.length) insights.push(`${list(scale.map((c) => c.name))} ${scale.length === 1 ? "still earns" : "still earn"} well above break-even on the next ${per}: room to grow.`);
  const cut = r.channels.filter((_, i) => actions[i] === "cut");
  if (cut.length) insights.push(`${list(cut.map((c) => c.name))} ${cut.length === 1 ? "is" : "are"} past ${cut.length === 1 ? "its" : "their"} efficient point: the next ${per} returns well under break-even.`);
  const none = r.channels.filter((c) => c.noLift);
  if (none.length) insights.push(`${list(none.map((c) => c.name))}: the data can't separate ${none.length === 1 ? "its" : "their"} effect from noise. Test with a holdout before cutting.`);
  if (worst && worst !== best && !cut.includes(worst) && !worst.noLift) insights.push(`${worst.name} has the lowest return on extra spend (${fmtRoi(s, worst.mroi)} at the margin).`);
  const wide = r.channels.filter((c) => c.roi > 0 && (c.ci.roi[1] - c.ci.roi[0]) / c.roi > 1);
  if (wide.length) insights.push(`Ranges are wide for ${list(wide.map((c) => c.name))}; more weeks or more varied spend would sharpen them.`);

  return { be, actions, spend, media, kpi, best, worst, opt, upliftWeekly, upliftRange, accuracy, headline, sub, insights, mediaShare: media / Math.max(kpi, 1e-9), totalRoi: spend ? media / spend : 0 };
}
export type Summary = ReturnType<typeof summarize>;

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
