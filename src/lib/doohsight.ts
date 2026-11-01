// DoohSight: DOOH / pDOOH campaign measurement. Pure functions only; the page
// (components/tools/DoohSight.tsx) owns inputs, persistence and rendering.

export type Inputs = {
  campaign: string;
  // Delivery & reach
  spend: number;
  screens: number;
  plays: number;
  impressions: number;
  reach: number;
  population: number;
  categorySpend: number;
  marketSharePct: number;
  benchmarkCpm: number;
  // Attention
  viewablePct: number;
  attentivePct: number;
  attentiveSec: number;
  // Location & footfall
  matchedDevices: number;
  exposedVisitPct: number;
  controlVisitPct: number;
  repeatVisits: number;
  basket: number;
  // Cross-channel halo (weekly averages)
  weeks: number;
  searchBase: number;
  searchCampaign: number;
  sessionsBase: number;
  sessionsCampaign: number;
  installsBase: number;
  installsCampaign: number;
  // Business outcomes
  onlineRevenue: number;
  marginPct: number;
  // Brand & funnel lift (survey, % of respondents)
  surveyN: number;
  awarenessExposed: number;
  awarenessControl: number;
  considerationExposed: number;
  considerationControl: number;
  intentExposed: number;
  intentControl: number;
  // Incrementality (geo or audience holdout)
  testN: number;
  testConv: number;
  controlN: number;
  controlConv: number;
  // Trust & delivery quality
  popMatchPct: number;
  uptimePct: number;
  ivtPct: number;
  safetyIncidents: number;
  verifiedPct: number;
  freshnessHours: number;
};

/** Fictional sample campaign shown at rest. */
export const SAMPLE: Inputs = {
  campaign: "Meridian Coffee Co. · Autumn Roast Launch",
  spend: 180_000,
  screens: 420,
  plays: 1_260_000,
  impressions: 9_450_000,
  reach: 1_850_000,
  population: 4_200_000,
  categorySpend: 900_000,
  marketSharePct: 15,
  benchmarkCpm: 25,
  viewablePct: 62,
  attentivePct: 38,
  attentiveSec: 1.6,
  matchedDevices: 120_000,
  exposedVisitPct: 4.6,
  controlVisitPct: 3.4,
  repeatVisits: 2.2,
  basket: 7.8,
  weeks: 6,
  searchBase: 12_000,
  searchCampaign: 15_600,
  sessionsBase: 40_000,
  sessionsCampaign: 47_000,
  installsBase: 2_000,
  installsCampaign: 2_600,
  onlineRevenue: 95_000,
  marginPct: 60,
  surveyN: 600,
  awarenessExposed: 46,
  awarenessControl: 34,
  considerationExposed: 31,
  considerationControl: 24,
  intentExposed: 22,
  intentControl: 17,
  testN: 9_000,
  testConv: 414,
  controlN: 6_000,
  controlConv: 204,
  popMatchPct: 97.5,
  uptimePct: 98.2,
  ivtPct: 0.8,
  safetyIncidents: 2,
  verifiedPct: 85,
  freshnessHours: 24,
};

export const LAYERS = ["delivery", "attention", "location", "cross", "business", "brand", "increment"] as const;
export type Layer = (typeof LAYERS)[number];

export const LAYER_LABEL: Record<Layer, string> = {
  delivery: "Delivery & reach",
  attention: "Attention",
  location: "Footfall",
  cross: "Cross-channel halo",
  business: "Business outcomes",
  brand: "Brand lift",
  increment: "Incrementality",
};

/** Share of the composite score. Sums to 100. */
export const WEIGHTS: Record<Layer, number> = { delivery: 10, attention: 15, location: 15, cross: 10, business: 25, brand: 10, increment: 15 };

/** Value that earns a layer full marks (see Methodology). */
export const FULL_MARKS = { reachPct: 50, attentivePct: 50, footfallLiftPct: 40, haloLiftPct: 40, brandLiftPct: 40, roasOverBreakEven: 2, confidenceFrom: 0.8, confidenceTo: 0.99 };

export type Status = "good" | "warning" | "serious" | "critical";
export const STATUS_POINTS: Record<Status, number> = { good: 100, warning: 70, serious: 40, critical: 0 };

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
const div = (a: number, b: number) => (b ? a / b : 0);

/** Standard normal CDF (Abramowitz & Stegun 7.1.26 via erf). */
export function normCdf(z: number) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** Two-proportion z-test. Rates are fractions; returns two-sided confidence and a 95% interval on the difference. */
export function twoProportion(p1: number, n1: number, p2: number, n2: number) {
  if (!n1 || !n2) return { z: 0, confidence: 0, ciLow: 0, ciHigh: 0 };
  const pooled = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
  const z = se ? (p1 - p2) / se : 0;
  const seDiff = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
  return { z, confidence: 2 * normCdf(Math.abs(z)) - 1, ciLow: p1 - p2 - 1.96 * seDiff, ciHigh: p1 - p2 + 1.96 * seDiff };
}

export function statusOf(value: number, good: number, warning: number, serious: number, higherIsBetter = true): Status {
  if (higherIsBetter) return value >= good ? "good" : value >= warning ? "warning" : value >= serious ? "serious" : "critical";
  return value <= good ? "good" : value <= warning ? "warning" : value <= serious ? "serious" : "critical";
}

export function compute(i: Inputs) {
  // Delivery & reach
  const cpm = div(i.spend, i.impressions) * 1000;
  const frequency = div(i.impressions, i.reach);
  const reachPct = div(i.reach, i.population) * 100;
  const sovPct = div(i.spend, i.categorySpend) * 100;
  const esov = sovPct - i.marketSharePct;
  const delivery = {
    cpm,
    costPerPlay: div(i.spend, i.plays),
    playsPerScreen: div(i.plays, i.screens),
    frequency,
    reachPct,
    sovPct,
    esov,
    score: 100 * (0.5 * clamp01(reachPct / FULL_MARKS.reachPct) + 0.5 * clamp01(div(i.benchmarkCpm, cpm))),
  };

  // Attention: attentive impressions can't exceed viewable ones
  const viewableImps = (i.impressions * i.viewablePct) / 100;
  const attentiveImps = Math.min(viewableImps, (i.impressions * i.attentivePct) / 100);
  const attentiveSeconds = attentiveImps * i.attentiveSec;
  const attention = {
    viewableImps,
    attentiveImps,
    attentiveSeconds,
    costPerThousandSeconds: div(i.spend, attentiveSeconds) * 1000,
    attentiveCpm: div(i.spend, attentiveImps) * 1000,
    attentiveShare: div(attentiveImps, i.impressions) * 100,
    score: 100 * clamp01(div(attentiveImps, i.impressions) * 100 / FULL_MARKS.attentivePct),
  };

  // Location & footfall: lift applied to the unique audience
  const liftPts = i.exposedVisitPct - i.controlVisitPct;
  const footfallLiftPct = div(liftPts, i.controlVisitPct) * 100;
  const incVisitors = Math.max(0, (i.reach * liftPts) / 100);
  const incVisits = incVisitors * i.repeatVisits;
  const footfallRevenue = incVisits * i.basket;
  const location = {
    liftPts,
    footfallLiftPct,
    incVisitors,
    incVisits,
    footfallRevenue,
    costPerIncVisitor: div(i.spend, incVisitors),
    score: 100 * clamp01(footfallLiftPct / FULL_MARKS.footfallLiftPct),
  };

  // Cross-channel halo
  const halo = [
    { key: "search", label: "Branded search", base: i.searchBase, during: i.searchCampaign },
    { key: "sessions", label: "Web sessions", base: i.sessionsBase, during: i.sessionsCampaign },
    { key: "installs", label: "App installs", base: i.installsBase, during: i.installsCampaign },
  ].map((c) => ({ ...c, liftPct: div(c.during - c.base, c.base) * 100, incremental: (c.during - c.base) * i.weeks }));
  const haloAvg = halo.reduce((s, c) => s + c.liftPct, 0) / halo.length;
  const cross = { channels: halo, avgLiftPct: haloAvg, score: 100 * clamp01(haloAvg / FULL_MARKS.haloLiftPct) };

  // Business outcomes
  const incRevenue = footfallRevenue + i.onlineRevenue;
  const margin = i.marginPct / 100;
  const roas = div(incRevenue, i.spend);
  const breakEven = div(1, margin);
  const grossProfit = incRevenue * margin;
  const business = {
    incRevenue,
    roas,
    breakEven,
    grossProfit,
    roiPct: div(grossProfit - i.spend, i.spend) * 100,
    score: 100 * clamp01((div(roas, breakEven) - 0.5) / (FULL_MARKS.roasOverBreakEven - 0.5)),
  };

  // Brand & funnel lift
  const stages = [
    { key: "awareness", label: "Awareness", exposed: i.awarenessExposed, control: i.awarenessControl },
    { key: "consideration", label: "Consideration", exposed: i.considerationExposed, control: i.considerationControl },
    { key: "intent", label: "Purchase intent", exposed: i.intentExposed, control: i.intentControl },
  ].map((s) => {
    const t = twoProportion(s.exposed / 100, i.surveyN, s.control / 100, i.surveyN);
    return { ...s, liftPts: s.exposed - s.control, relLiftPct: div(s.exposed - s.control, s.control) * 100, confidence: t.confidence };
  });
  const brandAvg = stages.reduce((s, x) => s + x.relLiftPct, 0) / stages.length;
  const brand = { stages, avgRelLiftPct: brandAvg, score: 100 * clamp01(brandAvg / FULL_MARKS.brandLiftPct) };

  // Incrementality
  const p1 = div(i.testConv, i.testN);
  const p2 = div(i.controlConv, i.controlN);
  const t = twoProportion(p1, i.testN, p2, i.controlN);
  const increment = {
    testRate: p1 * 100,
    controlRate: p2 * 100,
    liftPct: div(p1 - p2, p2) * 100,
    ciLowPct: div(t.ciLow, p2) * 100,
    ciHighPct: div(t.ciHigh, p2) * 100,
    z: t.z,
    confidence: t.confidence,
    incConversions: Math.max(0, (p1 - p2) * i.testN),
    significant: t.confidence >= 0.95 && p1 > p2,
    score: p1 > p2 ? 100 * clamp01((t.confidence - FULL_MARKS.confidenceFrom) / (FULL_MARKS.confidenceTo - FULL_MARKS.confidenceFrom)) : 0,
  };

  // Trust & delivery quality
  const checks = [
    { key: "pop", label: "Proof-of-play match", value: `${i.popMatchPct}%`, rule: "95% or more of booked plays verified", status: statusOf(i.popMatchPct, 95, 90, 80) },
    { key: "uptime", label: "Screen uptime", value: `${i.uptimePct}%`, rule: "98% or more", status: statusOf(i.uptimePct, 98, 95, 90) },
    { key: "ivt", label: "Invalid traffic", value: `${i.ivtPct}%`, rule: "1% or less of impressions", status: statusOf(i.ivtPct, 1, 2, 4, false) },
    { key: "safety", label: "Brand-safety incidents", value: String(i.safetyIncidents), rule: "None in the flight", status: statusOf(i.safetyIncidents, 0, 2, 5, false) },
    { key: "verified", label: "Independently verified", value: `${i.verifiedPct}%`, rule: "90% or more of impressions", status: statusOf(i.verifiedPct, 90, 75, 50) },
    { key: "fresh", label: "Data freshness", value: `${i.freshnessHours} h`, rule: "24 hours or less", status: statusOf(i.freshnessHours, 24, 72, 168, false) },
  ];
  const trustScore = checks.reduce((s, c) => s + STATUS_POINTS[c.status], 0) / checks.length;
  const trust = { checks, score: trustScore, critical: checks.some((c) => c.status === "critical") };

  // Composite: weighted layers, capped when delivery quality can't be trusted
  const scores: Record<Layer, number> = {
    delivery: delivery.score,
    attention: attention.score,
    location: location.score,
    cross: cross.score,
    business: business.score,
    brand: brand.score,
    increment: increment.score,
  };
  const weighted = LAYERS.reduce((s, l) => s + (scores[l] * WEIGHTS[l]) / 100, 0);
  const cap = trust.critical ? 60 : trustScore < 70 ? 75 : 100;
  const score = Math.round(Math.min(weighted, cap));

  return { delivery, attention, location, cross, business, brand, increment, trust, scores, weighted, cap, score, verdict: verdictFor(score, scores, cap < 100) };
}

export type Result = ReturnType<typeof compute>;

export function verdictFor(score: number, scores: Record<Layer, number>, capped: boolean) {
  const ranked = [...LAYERS].sort((a, b) => scores[b] - scores[a]);
  const best = LAYER_LABEL[ranked[0]].toLowerCase();
  const worst = LAYER_LABEL[ranked[ranked.length - 1]].toLowerCase();
  const tone: Status = score >= 80 ? "good" : score >= 65 ? "warning" : score >= 50 ? "serious" : "critical";
  const title = { good: "Strong, provable performance", warning: "Performing, with gaps to close", serious: "Mixed evidence", critical: "Not yet proven" }[tone];
  const body = capped
    ? `Delivery-quality problems cap the score. Fix the flagged checks on the Trust tab before reporting results; ${best} is currently the strongest layer.`
    : tone === "good"
      ? `The campaign shows measurable impact beyond impressions. Strongest layer: ${best}. Weakest: ${worst}, the place to look for more.`
      : tone === "warning"
        ? `Several layers show real impact, but ${worst} is holding the score back. ${best[0].toUpperCase() + best.slice(1)} is the strongest evidence so far.`
        : `Most layers don't yet show impact you could defend. Start with ${worst}; ${best} is the only layer near benchmark.`;
  return { tone, title, body };
}
