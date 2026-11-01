// Media mix model engine: media mix modeling that runs in the browser. Pure functions plus one async fit.
//
// KPI_t = intercept + trend + seasonality (52-week Fourier) + controls + Σ_c β_c · hill(adstock_c(spend)_t)
// - Adstock: normalised geometric carryover, a_t = (1−θ)·x_t + θ·a_{t−1}; a steady weekly spend s gives a = s.
// - Saturation: Hill curve x^S / (x^S + K^S); β_c is the channel's weekly effect at full saturation.
// - θ, K and S are chosen per channel by coordinate search over a grid; the linear part is ridge regression
//   with media effects kept non-negative. An S-shaped curve (S = 2) must earn its extra flexibility: choices are
//   compared on n·ln(SSE) plus 2 per S-shaped channel (an AIC-style penalty), so plain diminishing returns win ties.
// - Uncertainty: moving-block bootstrap of residuals, refitting each draw with a local re-search of θ and K.
//   Ranges are the 5th to 95th percentiles of the draws.
// - Accuracy: the last `holdout` weeks are fitted blind and compared with actuals. Reported results use all weeks.

export type Dataset = {
  name: string;
  dates: string[];
  kpiName: string;
  kpi: number[];
  channels: { name: string; spend: number[] }[];
  controls: { name: string; values: number[] }[];
  sample?: boolean;
};

export type Speed = "quick" | "standard" | "thorough";
export type ModelSettings = { holdout: number; speed: Speed; seasonality: boolean; trend: boolean };
export const DEFAULT_MODEL: ModelSettings = { holdout: 13, speed: "standard", seasonality: true, trend: true };

export type Params = { theta: number; k: number; s: number; beta: number };
export type Rep = { ch: Params[] };

export const THETAS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
export const K_MULTS = [0.4, 0.7, 1, 1.5, 2.5, 4, 6];
export const SHAPES = [1, 2];
/** Ridge penalty as a share of each column's own variation: enough to keep the solve stable, too small to bias. */
const RIDGE = 1e-4;
const BLOCK = 4;
const REPS: Record<Speed, number> = { quick: 80, standard: 200, thorough: 400 };

/* ---------- transforms ---------- */
export function adstock(x: ArrayLike<number>, theta: number) {
  const out = new Float64Array(x.length);
  // Start from the first month's average so the first weeks aren't read as a cold start.
  let prev = 0;
  for (let i = 0; i < Math.min(4, x.length); i++) prev += x[i] / Math.min(4, x.length);
  for (let t = 0; t < x.length; t++) prev = out[t] = (1 - theta) * x[t] + theta * prev;
  return out;
}
export const hill = (x: number, k: number, s: number) => (x <= 0 ? 0 : s === 1 ? x / (x + k) : x ** s / (x ** s + k ** s));
/** Weekly incremental KPI from a steady weekly spend. */
export const respond = (p: Params, spend: number) => p.beta * hill(spend, p.k, p.s);
/** Extra KPI from one more unit of weekly spend. */
export const marginal = (p: Params, x: number) => {
  if (x <= 0) return p.s === 1 ? p.beta / p.k : 0;
  const xs = x ** p.s, ks = p.k ** p.s;
  return (p.beta * p.s * ks * x ** (p.s - 1)) / (xs + ks) ** 2;
};

/* ---------- linear algebra ---------- */
/** Solves (A) x = b for symmetric positive-definite A (p×p, row-major) by Cholesky. */
function cholSolve(A: Float64Array, b: Float64Array, p: number): Float64Array | null {
  const L = new Float64Array(p * p);
  for (let i = 0; i < p; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i * p + j];
      for (let k = 0; k < j; k++) s -= L[i * p + k] * L[j * p + k];
      if (i === j) {
        if (s <= 1e-12) return null;
        L[i * p + i] = Math.sqrt(s);
      } else L[i * p + j] = s / L[j * p + j];
    }
  }
  const y = new Float64Array(p);
  for (let i = 0; i < p; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i * p + k] * y[k];
    y[i] = s / L[i * p + i];
  }
  const x = new Float64Array(p);
  for (let i = p - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < p; k++) s -= L[k * p + i] * x[k];
    x[i] = s / L[i * p + i];
  }
  return x;
}

/**
 * Ridge least squares on rows [0, m) with media columns (the last `nm`) held non-negative by dropping the most
 * negative one and refitting. Columns are arrays of length n. Returns coefficients and the sum of squared errors.
 */
export function fitLinear(cols: ArrayLike<number>[], y: ArrayLike<number>, m: number, nm: number) {
  const p = cols.length;
  let active = cols.map((_, i) => i);
  for (let guard = 0; guard <= nm; guard++) {
    const q = active.length;
    const A = new Float64Array(q * q), b = new Float64Array(q);
    for (let a = 0; a < q; a++) {
      const ca = cols[active[a]];
      for (let c = a; c < q; c++) {
        const cc = cols[active[c]];
        let s = 0;
        for (let t = 0; t < m; t++) s += ca[t] * cc[t];
        A[a * q + c] = A[c * q + a] = s;
      }
      let s = 0;
      for (let t = 0; t < m; t++) s += ca[t] * y[t];
      b[a] = s;
      if (active[a] !== 0) {
        let mu = 0, ss = 0;
        for (let t = 0; t < m; t++) mu += ca[t] / m;
        for (let t = 0; t < m; t++) ss += (ca[t] - mu) ** 2;
        A[a * q + a] += RIDGE * ss + 1e-9;
      }
    }
    const x = cholSolve(A, b, q);
    if (!x) return null;
    let worst = -1, worstV = 0;
    for (let a = 0; a < q; a++) if (active[a] >= p - nm && x[a] < worstV) (worst = a), (worstV = x[a]);
    if (worst < 0) {
      const coef = new Float64Array(p);
      active.forEach((c, a) => (coef[c] = x[a]));
      let sse = 0;
      for (let t = 0; t < m; t++) {
        let f = 0;
        for (let c = 0; c < p; c++) f += coef[c] * cols[c][t];
        sse += (y[t] - f) ** 2;
      }
      return { coef, sse };
    }
    active = active.filter((_, a) => a !== worst);
  }
  return null;
}

/* ---------- design ---------- */
const mean = (xs: ArrayLike<number>) => {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i];
  return xs.length ? s / xs.length : 0;
};
function standardise(x: ArrayLike<number>) {
  const m = mean(x);
  let v = 0;
  for (let i = 0; i < x.length; i++) v += (x[i] - m) ** 2;
  const sd = Math.sqrt(v / Math.max(1, x.length)) || 1;
  return Float64Array.from(x, (z) => (z - m) / sd);
}

/** Intercept, trend, seasonality and controls: the columns that don't depend on media parameters. */
export function baseColumns(d: Dataset, s: ModelSettings) {
  const n = d.kpi.length;
  const cols: Float64Array[] = [new Float64Array(n).fill(1)];
  const names = ["Intercept"];
  if (s.trend) cols.push(standardise(Array.from({ length: n }, (_, t) => t))), names.push("Trend");
  if (s.seasonality && n >= 52)
    for (const k of [1, 2]) {
      cols.push(Float64Array.from({ length: n }, (_, t) => Math.sin((2 * Math.PI * k * t) / 52.18)));
      cols.push(Float64Array.from({ length: n }, (_, t) => Math.cos((2 * Math.PI * k * t) / 52.18)));
      names.push(`Season ${k} sin`, `Season ${k} cos`);
    }
  for (const c of d.controls) cols.push(standardise(c.values)), names.push(c.name);
  return { cols, names };
}

/** Typical non-zero weekly spend: the scale K is searched around. */
const spendScale = (x: number[]) => mean(x.filter((v) => v > 0)) || 1;

type Search = { theta: number; kMult: number; s: number }[];

function mediaCol(spend: number[], theta: number, k: number, s: number, cache: Map<string, Float64Array>, ci: number) {
  const key = `${ci}|${theta}|${k}|${s}`;
  let col = cache.get(key);
  if (!col) {
    const a = adstock(spend, theta);
    col = Float64Array.from(a, (v) => hill(v, k, s));
    if (cache.size > 4000) cache.clear();
    cache.set(key, col);
  }
  return col;
}

/** Coordinate search from several starting points; the best score wins. Greedy search alone can get stuck. */
function multiStart(d: Dataset, base: Float64Array[], y: ArrayLike<number>, m: number, cache: Map<string, Float64Array>) {
  const starts: Search[] = [
    d.channels.map(() => ({ theta: 0.3, kMult: 1, s: 1 })),
    d.channels.map(() => ({ theta: 0.3, kMult: 1, s: 2 })),
    d.channels.map(() => ({ theta: 0.1, kMult: 2.5, s: 1 })),
    d.channels.map(() => ({ theta: 0.6, kMult: 1.5, s: 2 })),
  ];
  return starts.map((st) => searchFit(d, base, y, m, st, 4, null, cache)).reduce((a, b) => (b.score < a.score ? b : a));
}

/** Coordinate search over θ, K and S per channel, then the linear fit. `local` limits each step to neighbours. */
function searchFit(d: Dataset, base: Float64Array[], y: ArrayLike<number>, m: number, start: Search, passes: number, local: number | null, cache: Map<string, Float64Array>) {
  const scales = d.channels.map((c) => spendScale(c.spend));
  const cur = start.map((x) => ({ ...x }));
  const cols = (st: Search) => [...base, ...d.channels.map((c, i) => mediaCol(c.spend, st[i].theta, st[i].kMult * scales[i], st[i].s, cache, i))];
  const score = (sse: number, st: Search) => m * Math.log(Math.max(sse, 1e-12) / m) + 2 * st.filter((x) => x.s !== 1).length;
  let best = fitLinear(cols(cur), y, m, d.channels.length);
  let bestScore = best ? score(best.sse, cur) : Infinity;
  for (let pass = 0; pass < passes; pass++) {
    let improved = false;
    for (let c = 0; c < d.channels.length; c++) {
      const ti = THETAS.indexOf(cur[c].theta), ki = K_MULTS.indexOf(cur[c].kMult);
      const thetas = local === null ? THETAS : THETAS.slice(Math.max(0, ti - local), ti + local + 1);
      const ks = local === null ? K_MULTS : K_MULTS.slice(Math.max(0, ki - local), ki + local + 1);
      const shapes = SHAPES;
      for (const theta of thetas)
        for (const kMult of ks)
          for (const s of shapes) {
            if (theta === cur[c].theta && kMult === cur[c].kMult && s === cur[c].s) continue;
            const trial = cur.map((x, i) => (i === c ? { theta, kMult, s } : x));
            const f = fitLinear(cols(trial), y, m, d.channels.length);
            const sc = f ? score(f.sse, trial) : Infinity;
            if (f && sc < bestScore - 1e-9) {
              best = f;
              bestScore = sc;
              cur[c] = { theta, kMult, s };
              improved = true;
            }
          }
    }
    if (!improved) break;
  }
  if (!best) throw new Error("The model could not be fitted. Check that spend and the KPI vary over time.");
  const nb = base.length;
  const params: Params[] = d.channels.map((_, i) => ({ theta: cur[i].theta, k: cur[i].kMult * scales[i], s: cur[i].s, beta: best!.coef[nb + i] }));
  return { search: cur, coef: best.coef, sse: best.sse, score: bestScore, params, cols: cols(cur) };
}

/* ---------- results ---------- */
export type ChannelResult = {
  name: string;
  params: Params;
  spend: number[];
  contrib: number[];
  totalSpend: number;
  totalContrib: number;
  /** KPI per unit of spend (ROAS for revenue, conversions per unit for conversions). */
  roi: number;
  /** Extra KPI from one more unit of weekly spend at today's level. */
  mroi: number;
  /** Average weekly spend over the last 52 weeks (or all weeks if fewer): today's level. */
  current: number;
  spendShare: number;
  contribShare: number;
  ci: { contrib: [number, number]; roi: [number, number]; mroi: [number, number] };
  /** The lower end of its range is zero: the data can't separate its effect from noise. */
  noLift: boolean;
};

export type FitResult = {
  n: number;
  dates: string[];
  actual: number[];
  predicted: number[];
  baseline: number[];
  channels: ChannelResult[];
  r2: number;
  mape: number;
  holdout: { weeks: number; from: number; predicted: number[]; mape: number; r2: number } | null;
  reps: Rep[];
  recent: number;
  baselineWeekly: number;
  settings: ModelSettings;
  ms: number;
};

export const quantile = (xs: number[], q: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
};
const range = (xs: number[]): [number, number] => [quantile(xs, 0.05), quantile(xs, 0.95)];

function r2Of(y: ArrayLike<number>, f: ArrayLike<number>, from = 0, to = y.length) {
  let m = 0;
  for (let t = from; t < to; t++) m += y[t] / (to - from);
  let ss = 0, sr = 0;
  for (let t = from; t < to; t++) (ss += (y[t] - m) ** 2), (sr += (y[t] - f[t]) ** 2);
  return ss ? 1 - sr / ss : 0;
}
function mapeOf(y: ArrayLike<number>, f: ArrayLike<number>, from = 0, to = y.length) {
  let s = 0, c = 0;
  for (let t = from; t < to; t++) if (Math.abs(y[t]) > 1e-9) (s += Math.abs((y[t] - f[t]) / y[t])), c++;
  return c ? (s / c) * 100 : 0;
}

/** Seeded random numbers, so the same data always gives the same ranges. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Progress = (fraction: number, label: string) => void;
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/** Fits the model. Yields to the browser regularly so progress can be drawn. */
export async function fitModel(d: Dataset, s: ModelSettings = DEFAULT_MODEL, onProgress: Progress = () => {}): Promise<FitResult> {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const n = d.kpi.length;
  const { cols: base } = baseColumns(d, s);
  const cache = new Map<string, Float64Array>();
  const nb = base.length;

  // 1. Holdout: fit the earlier weeks, predict the last ones blind.
  onProgress(0.03, "Checking accuracy on held-out weeks");
  await tick();
  let holdout: FitResult["holdout"] = null;
  const h = Math.min(s.holdout, Math.max(0, n - 26));
  if (h >= 4) {
    const m = n - h;
    const hf = multiStart(d, base, d.kpi, m, cache);
    const pred = Array.from({ length: n }, (_, t) => hf.cols.reduce((acc, c, i) => acc + hf.coef[i] * c[t], 0));
    holdout = { weeks: h, from: m, predicted: pred, mape: mapeOf(d.kpi, pred, m), r2: r2Of(d.kpi, pred, m) };
  }

  // 2. Final fit on every week.
  onProgress(0.15, "Fitting carryover and saturation");
  await tick();
  const fit = multiStart(d, base, d.kpi, n, cache);
  const predicted = Array.from({ length: n }, (_, t) => fit.cols.reduce((acc, c, i) => acc + fit.coef[i] * c[t], 0));
  const residual = d.kpi.map((y, t) => y - predicted[t]);

  // 3. Uncertainty: moving-block bootstrap of residuals.
  const R = REPS[s.speed];
  // Each draw re-searches carryover and saturation near the best fit; holding them fixed gives ranges that are too narrow.
  const local = s.speed === "thorough" ? 2 : 1;
  const rand = rng(n * 7919 + d.channels.length * 104729 + Math.round(Math.abs(d.kpi[0] ?? 0)));
  const reps: Rep[] = [];
  for (let r = 0; r < R; r++) {
    const ystar = new Float64Array(n);
    for (let t = 0; t < n; t += BLOCK) {
      const from = Math.floor(rand() * Math.max(1, n - BLOCK + 1));
      for (let j = 0; j < BLOCK && t + j < n; j++) ystar[t + j] = predicted[t + j] + residual[from + j];
    }
    reps.push({ ch: searchFit(d, base, ystar, n, fit.search, 1, local, cache).params });
    if (r % 10 === 9) {
      onProgress(0.2 + (0.78 * (r + 1)) / R, "Estimating uncertainty ranges");
      await tick();
    }
  }

  // 4. Summaries.
  const recent = Math.min(52, n);
  const totalSpendAll = d.channels.reduce((acc, c) => acc + c.spend.reduce((x, y) => x + y, 0), 0) || 1;
  const contribAll: number[][] = d.channels.map((_, i) => Array.from(fit.cols[nb + i], (v) => v * fit.coef[nb + i]));
  const mediaTotal = contribAll.reduce((acc, c) => acc + c.reduce((x, y) => x + y, 0), 0) || 1;
  const channels: ChannelResult[] = d.channels.map((c, i) => {
    const p = fit.params[i];
    const totalSpend = c.spend.reduce((x, y) => x + y, 0);
    const totalContrib = contribAll[i].reduce((x, y) => x + y, 0);
    const current = mean(c.spend.slice(n - recent));
    // Contribution in each draw: the same weekly transform scaled by that draw's β (θ and K refits change it a little).
    const repContrib = reps.map((r) => {
      const q = r.ch[i];
      const a = adstock(c.spend, q.theta);
      let sum = 0;
      for (let t = 0; t < n; t++) sum += q.beta * hill(a[t], q.k, q.s);
      return sum;
    });
    const cr = range(repContrib);
    return {
      name: c.name,
      params: p,
      spend: c.spend,
      contrib: contribAll[i],
      totalSpend,
      totalContrib,
      roi: totalSpend ? totalContrib / totalSpend : 0,
      mroi: marginal(p, current),
      current,
      spendShare: totalSpend / totalSpendAll,
      contribShare: totalContrib / mediaTotal,
      ci: { contrib: cr, roi: [totalSpend ? cr[0] / totalSpend : 0, totalSpend ? cr[1] / totalSpend : 0], mroi: range(reps.map((r) => marginal(r.ch[i], current))) },
      noLift: cr[0] <= Math.max(1e-9, 0.002 * Math.abs(mean(d.kpi)) * n),
    };
  });
  const baseline = predicted.map((v, t) => v - channels.reduce((acc, c) => acc + c.contrib[t], 0));
  onProgress(1, "Done");
  return {
    n,
    dates: d.dates,
    actual: d.kpi,
    predicted,
    baseline,
    channels,
    r2: r2Of(d.kpi, predicted),
    mape: mapeOf(d.kpi, predicted),
    holdout,
    reps,
    recent,
    baselineWeekly: mean(baseline.slice(n - recent)),
    settings: s,
    ms: (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0,
  };
}

/* ---------- planning ---------- */
/** Weekly media KPI for a set of weekly spends, with a 90% range across the bootstrap draws. */
export function forecast(r: FitResult, spends: number[]) {
  const value = r.channels.reduce((acc, c, i) => acc + respond(c.params, spends[i] ?? 0), 0);
  const draws = r.reps.map((rep) => rep.ch.reduce((acc, p, i) => acc + respond(p, spends[i] ?? 0), 0));
  return { value, range: range(draws), draws };
}

export type Bounds = { min: number; max: number; locked: boolean };
/** Default limits: half to double today's spend, as far as the data supports. */
export const defaultBounds = (r: FitResult): Bounds[] => r.channels.map((c) => ({ min: c.current * 0.5, max: c.current * 2, locked: false }));

/**
 * Splits a weekly budget to maximise the media KPI within each channel's limits. Greedy on the gain of each
 * step, which handles the flat start of S-shaped curves better than the slope at a point.
 */
export function optimize(r: FitResult, total: number, bounds: Bounds[]) {
  const ch = r.channels;
  const spend = ch.map((c, i) => (bounds[i].locked ? c.current : Math.min(bounds[i].min, bounds[i].max)));
  let left = total - spend.reduce((a, b) => a + b, 0);
  const feasible = left >= -1e-6;
  const step = Math.max(total / 2000, 1e-6);
  while (left > 1e-9) {
    const inc = Math.min(step, left);
    let best = -1, gain = -Infinity;
    for (let i = 0; i < ch.length; i++) {
      if (bounds[i].locked || spend[i] + inc > bounds[i].max + 1e-9) continue;
      const g = respond(ch[i].params, spend[i] + inc) - respond(ch[i].params, spend[i]);
      if (g > gain) (gain = g), (best = i);
    }
    if (best < 0) break;
    spend[best] += inc;
    left -= inc;
  }
  return { spend, unallocated: Math.max(0, left), feasible };
}

/** One row per week for export. */
export function resultRows(r: FitResult) {
  return r.dates.map((d, t) => ({ date: d, actual: r.actual[t], predicted: r.predicted[t], baseline: r.baseline[t], ...Object.fromEntries(r.channels.map((c) => [c.name, c.contrib[t]])) }));
}
