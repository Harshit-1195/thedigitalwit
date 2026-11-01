import { describe, expect, it } from "vitest";
import { compute, LAYERS, normCdf, SAMPLE, statusOf, twoProportion, WEIGHTS } from "./doohsight";

describe("doohsight", () => {
  const r = compute(SAMPLE);

  it("weights sum to 100", () => {
    expect(LAYERS.reduce((s, l) => s + WEIGHTS[l], 0)).toBe(100);
  });

  it("computes delivery metrics for the sample", () => {
    expect(r.delivery.cpm).toBeCloseTo(19.05, 2);
    expect(r.delivery.frequency).toBeCloseTo(5.11, 2);
    expect(r.delivery.reachPct).toBeCloseTo(44.05, 2);
    expect(r.delivery.sovPct).toBe(20);
    expect(r.delivery.esov).toBe(5);
  });

  it("caps attentive impressions at viewable ones", () => {
    expect(r.attention.attentiveImps).toBe(3_591_000);
    expect(r.attention.costPerThousandSeconds).toBeCloseTo(31.33, 2);
    const over = compute({ ...SAMPLE, viewablePct: 20, attentivePct: 50 });
    expect(over.attention.attentiveImps).toBe(over.attention.viewableImps);
  });

  it("turns footfall lift into incremental visits and revenue", () => {
    expect(r.location.footfallLiftPct).toBeCloseTo(35.29, 2);
    expect(r.location.incVisitors).toBeCloseTo(22_200, 6);
    expect(r.location.incVisits).toBeCloseTo(48_840, 6);
    expect(r.location.costPerIncVisitor).toBeCloseTo(8.11, 2);
  });

  it("computes ROAS against break-even", () => {
    expect(r.business.incRevenue).toBeCloseTo(475_952, 6);
    expect(r.business.roas).toBeCloseTo(2.644, 3);
    expect(r.business.breakEven).toBeCloseTo(1.667, 3);
    expect(r.business.roiPct).toBeCloseTo(58.65, 2);
  });

  it("runs a two-proportion test", () => {
    expect(normCdf(1.96)).toBeCloseTo(0.975, 3);
    const t = twoProportion(0.046, 9000, 0.034, 6000);
    expect(t.z).toBeCloseTo(3.62, 1);
    expect(t.confidence).toBeGreaterThan(0.999);
    expect(r.increment.significant).toBe(true);
    expect(r.increment.ciLowPct).toBeGreaterThan(0);
  });

  it("flags brand-lift stages by significance", () => {
    expect(r.brand.stages.map((s) => s.liftPts)).toEqual([12, 7, 5]);
    expect(r.brand.stages.every((s) => s.confidence > 0.95)).toBe(true);
  });

  it("grades trust checks and caps the score on a critical one", () => {
    expect(statusOf(0.8, 1, 2, 4, false)).toBe("good");
    expect(statusOf(85, 90, 75, 50)).toBe("warning");
    expect(r.trust.score).toBe(90);
    const bad = compute({ ...SAMPLE, popMatchPct: 70 });
    expect(bad.trust.critical).toBe(true);
    expect(bad.score).toBeLessThanOrEqual(60);
    expect(bad.verdict.body).toMatch(/Trust tab/);
  });

  it("scores the sample in a sensible band and survives zero inputs", () => {
    expect(r.score).toBeGreaterThanOrEqual(65);
    expect(r.score).toBeLessThanOrEqual(90);
    const zero = compute(Object.fromEntries(Object.entries(SAMPLE).map(([k, v]) => [k, typeof v === "number" ? 0 : v])) as typeof SAMPLE);
    expect(Number.isFinite(zero.score)).toBe(true);
    expect(Object.values(zero.scores).every(Number.isFinite)).toBe(true);
  });
});
