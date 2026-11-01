// CAC and ROAS for the Media Plan Generator (merged in from the retired Media Planning tool).
//
// Each channel delivers its assumed CAC or ROAS at an even split of the budget, with square-root diminishing
// returns beyond that (src/lib/planning/media-plan.ts). Assumptions and the CAC target are kept in US dollars
// and shown in the plan's currency.

import { evaluatePlan, suggestSplit, type Goal } from "../planning/media-plan";
import { toPercent } from "../gtm/build";
import { currencyRate } from "./format";
import type { Channel, ChannelKey } from "./types";

export type Perf = {
  goal: Goal;
  /** Target CAC in USD and target ROAS (×). */
  target: { cac: number; roas: number };
  /** Illustrative CAC (USD) and ROAS per channel at an even split. Editable. */
  assumptions: Record<ChannelKey, { cac: number; roas: number }>;
};

/** Illustrative placeholders, not industry data. */
export const DEFAULT_ASSUMPTIONS: Perf["assumptions"] = {
  social: { cac: 60, roas: 3.0 },
  progDisplay: { cac: 90, roas: 1.8 },
  native: { cac: 80, roas: 2.0 },
  ctv: { cac: 140, roas: 1.4 },
  audio: { cac: 120, roas: 1.3 },
  dooh: { cac: 200, roas: 0.8 },
  youtube: { cac: 110, roas: 1.6 },
};
export const DEFAULT_PERF: Perf = { goal: "cac", target: { cac: 60, roas: 3 }, assumptions: DEFAULT_ASSUMPTIONS };

const planChannels = (perf: Perf, channels: Channel[], currency: string) => {
  const rate = currencyRate(currency);
  return channels.map((c) => ({ id: c.key, label: c.name, cac: (perf.assumptions[c.key]?.cac ?? 100) * rate, roas: perf.assumptions[c.key]?.roas ?? 1 }));
};

/** Customers or revenue per channel, the blended CAC or ROAS, and whether it meets the target. */
export function evaluatePerf(perf: Perf, channels: Channel[], budget: number, currency: string) {
  const target = perf.goal === "cac" ? perf.target.cac * currencyRate(currency) : perf.target.roas;
  const spends = channels.map((c) => (budget * c.pct) / 100);
  return { ...evaluatePlan(budget, planChannels(perf, channels, currency), spends, perf.goal, target), target };
}

/** Whole-number shares that put each extra unit of budget where it buys the most. */
export function optimalPct(perf: Perf, channels: Channel[], budget: number, currency: string, only?: ChannelKey[]) {
  const use = only?.length ? channels.filter((c) => only.includes(c.key)) : channels;
  const split = suggestSplit(Math.max(budget, 1000), planChannels(perf, use, currency), perf.goal);
  const pct = toPercent(split);
  return channels.map((c) => {
    const i = use.indexOf(c);
    return i < 0 ? 0 : pct[i];
  });
}
