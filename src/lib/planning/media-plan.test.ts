import { describe, expect, it } from "vitest";
import { evaluatePlan, suggestSplit, type PlanChannel } from "./media-plan";

const chans: PlanChannel[] = [
  { id: "a", label: "A", cac: 50, roas: 4 },
  { id: "b", label: "B", cac: 100, roas: 2 },
];
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("suggestSplit", () => {
  it("weights by (1/CAC)² and sums exactly to the budget", () => {
    const s = suggestSplit(10000, chans, "cac");
    expect(sum(s)).toBe(10000);
    expect(s[0] / s[1]).toBeCloseTo(4, 1); // (100/50)² = 4
  });
  it("weights by ROAS² for a ROAS goal", () => {
    const s = suggestSplit(10000, chans, "roas");
    expect(s[0] / s[1]).toBeCloseTo(4, 1);
  });
  it("handles empty or zero budgets", () => {
    expect(suggestSplit(0, chans, "cac")).toEqual([0, 0]);
    expect(suggestSplit(1000, [], "cac")).toEqual([]);
  });
});

describe("evaluatePlan", () => {
  it("reproduces benchmark CACs at an even split", () => {
    const r = evaluatePlan(10000, chans, [5000, 5000], "cac", 70);
    expect(r.rows[0].efficiency).toBeCloseTo(50);
    expect(r.rows[1].efficiency).toBeCloseTo(100);
    expect(r.blended).toBeCloseTo(10000 / (100 + 50));
  });
  it("the suggested split beats an even split", () => {
    const even = evaluatePlan(10000, chans, [5000, 5000], "cac", 60);
    const best = evaluatePlan(10000, chans, suggestSplit(10000, chans, "cac"), "cac", 60);
    expect(best.blended!).toBeLessThan(even.blended!);
    expect(best.blended!).toBeCloseTo(63.25, 2); // 10000 / (sqrt(8000*5000)/50 + sqrt(2000*5000)/100)
  });
  it("reports whether the target is met, in the right direction for each goal", () => {
    const cac = evaluatePlan(10000, chans, [5000, 5000], "cac", 60); // blended 66.7
    expect(cac.onTarget).toBe(false);
    expect(cac.gap).toBeCloseTo(0.111, 2);
    const roas = evaluatePlan(10000, chans, [5000, 5000], "roas", 2.5); // blended 3.0
    expect(roas.blended).toBeCloseTo(3);
    expect(roas.onTarget).toBe(true);
  });
  it("never returns NaN for zero spend", () => {
    const r = evaluatePlan(0, chans, [0, 0], "cac", 50);
    expect(r.blended).toBeNull();
    expect(r.rows.every((x) => Number.isFinite(x.efficiency))).toBe(true);
  });
});

