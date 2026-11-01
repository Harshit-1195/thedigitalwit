// CAC/ROAS model behind the Media Plan Generator's performance targets.
//
// Each channel has square-root diminishing returns, calibrated so that at an
// even split (budget ÷ channels) it delivers its benchmark CAC or ROAS:
//   results_i(s) = sqrt(s × R) / CAC_i      (or × ROAS_i for revenue)
// Doubling a channel's spend therefore yields ~41% more results. Equalising
// marginal returns gives the suggested split in closed form:
//   share_i ∝ (1 / CAC_i)²   or   share_i ∝ ROAS_i²

export type Goal = "cac" | "roas";

export type PlanChannel = { id: string; label: string; cac: number; roas: number };

export type PlanRow = {
  id: string;
  label: string;
  spend: number;
  share: number;
  /** Customers (CAC goal) or revenue (ROAS goal). */
  results: number;
  /** The channel's effective CAC or ROAS at this spend. */
  efficiency: number;
};

export type PlanSummary = {
  rows: PlanRow[];
  totalSpend: number;
  totalResults: number;
  /** Blended CAC (spend ÷ customers) or blended ROAS (revenue ÷ spend). */
  blended: number | null;
  /** True when the blended figure meets the target (lower CAC / higher ROAS). */
  onTarget: boolean | null;
  /** Relative gap to target, e.g. 0.12 = 12% worse than target. Negative = better. */
  gap: number | null;
};

const weight = (c: PlanChannel, goal: Goal) => (goal === "cac" ? (c.cac > 0 ? 1 / c.cac : 0) : Math.max(0, c.roas)) ** 2;

/** Suggested spend per channel. Rounded to whole dollars; remainder goes to the largest. */
export function suggestSplit(budget: number, channels: PlanChannel[], goal: Goal): number[] {
  if (!(budget > 0) || channels.length === 0) return channels.map(() => 0);
  const w = channels.map((c) => weight(c, goal));
  const total = w.reduce((a, b) => a + b, 0);
  if (total === 0) return channels.map(() => Math.round(budget / channels.length));
  const raw = w.map((x) => (budget * x) / total);
  const rounded = raw.map(Math.floor);
  const rest = Math.round(budget) - rounded.reduce((a, b) => a + b, 0);
  rounded[raw.indexOf(Math.max(...raw))] += rest;
  return rounded;
}

/** Evaluates any split (suggested or hand-edited) against the target. */
export function evaluatePlan(budget: number, channels: PlanChannel[], spends: number[], goal: Goal, target: number): PlanSummary {
  const ref = channels.length ? budget / channels.length : 0;
  const totalSpend = spends.reduce((a, b) => a + b, 0);
  const rows = channels.map<PlanRow>((c, i) => {
    const spend = Math.max(0, spends[i] ?? 0);
    const base = Math.sqrt(spend * ref);
    const results = goal === "cac" ? (c.cac > 0 ? base / c.cac : 0) : base * Math.max(0, c.roas);
    const efficiency = goal === "cac" ? (results > 0 ? spend / results : 0) : spend > 0 ? results / spend : 0;
    return { id: c.id, label: c.label, spend, share: totalSpend > 0 ? spend / totalSpend : 0, results, efficiency };
  });
  const totalResults = rows.reduce((a, r) => a + r.results, 0);
  const blended = goal === "cac" ? (totalResults > 0 ? totalSpend / totalResults : null) : totalSpend > 0 ? totalResults / totalSpend : null;

  let onTarget: boolean | null = null;
  let gap: number | null = null;
  if (blended !== null && target > 0) {
    gap = goal === "cac" ? (blended - target) / target : (target - blended) / target;
    onTarget = gap <= 0;
  }
  return { rows, totalSpend, totalResults, blended, onTarget, gap };
}

