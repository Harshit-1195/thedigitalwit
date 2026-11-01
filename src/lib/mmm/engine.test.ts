import { describe, expect, it } from "vitest";
import { adstock, fitModel, forecast, hill, marginal, optimize, defaultBounds, respond } from "./engine";
import { sampleDataset, sampleTruthRoi, SAMPLE_TRUTH } from "./sample";

describe("transforms", () => {
  it("adstock keeps a steady spend steady and carries a burst over", () => {
    expect(Array.from(adstock([10, 10, 10, 10, 10], 0.5))).toEqual([10, 10, 10, 10, 10]);
    const a = adstock([0, 0, 0, 0, 100, 0, 0], 0.5);
    expect([a[4], a[5], a[6]]).toEqual([50, 25, 12.5]);
  });
  it("hill is half-saturated at K and the marginal matches a finite difference", () => {
    expect(hill(5, 5, 1)).toBe(0.5);
    expect(hill(5, 5, 2)).toBe(0.5);
    const p = { theta: 0, k: 1000, s: 2, beta: 500 };
    expect(marginal(p, 800)).toBeCloseTo((respond(p, 801) - respond(p, 799)) / 2, 4);
  });
});

describe("fit on the sample", async () => {
  const d = sampleDataset();
  const r = await fitModel(d, { holdout: 13, speed: "standard", seasonality: true, trend: true });
  const truth = sampleTruthRoi(d);
  it("is deterministic and the right shape", () => {
    expect(d.kpi).toHaveLength(104);
    expect(sampleDataset().kpi).toEqual(d.kpi);
    expect(r.channels.map((c) => c.name)).toEqual(Object.keys(SAMPLE_TRUTH));
  });
  it("fits well, in sample and on held-out weeks", () => {
    expect(r.r2).toBeGreaterThan(0.95);
    expect(r.holdout!.weeks).toBe(13);
    expect(r.holdout!.mape).toBeLessThan(5);
  });
  it("recovers the true ROI ranking and is close on the big channels", () => {
    const est = Object.fromEntries(r.channels.map((c) => [c.name, c.roi]));
    for (const name of ["TV", "Paid social", "Online video", "Retail media"]) expect(Math.abs(est[name] - truth[name]) / truth[name]).toBeLessThan(0.35);
    const order = (o: Record<string, number>) => Object.keys(o).sort((a, b) => o[b] - o[a]);
    expect(order(est)[0]).toBe(order(truth)[0]);
  });
  it("most true values fall inside the 90% ranges", () => {
    expect(r.channels.filter((c) => truth[c.name] >= c.ci.roi[0] && truth[c.name] <= c.ci.roi[1]).length).toBeGreaterThanOrEqual(4);
  });
  it("ranges contain the estimate and are ordered", () => {
    for (const c of r.channels) {
      expect(c.ci.roi[0]).toBeLessThanOrEqual(c.ci.roi[1]);
      expect(c.totalContrib).toBeGreaterThanOrEqual(0);
    }
  });
  it("baseline plus channels adds up to the prediction", () => {
    for (const t of [0, 50, 103]) expect(r.baseline[t] + r.channels.reduce((a, c) => a + c.contrib[t], 0)).toBeCloseTo(r.predicted[t], 6);
  });
  it("optimizer spends the budget within limits and never does worse than today", () => {
    const current = r.channels.map((c) => c.current);
    const total = current.reduce((a, b) => a + b, 0);
    const b = defaultBounds(r);
    b[0].locked = true;
    const o = optimize(r, total, b);
    expect(o.spend.reduce((a, x) => a + x, 0)).toBeCloseTo(total, 0);
    expect(o.spend[0]).toBe(current[0]);
    o.spend.forEach((s, i) => i && expect(s).toBeGreaterThanOrEqual(b[i].min - 1e-6) && expect(s).toBeLessThanOrEqual(b[i].max + 1e-6));
    expect(forecast(r, o.spend).value).toBeGreaterThanOrEqual(forecast(r, current).value - 1e-6);
  });
});
