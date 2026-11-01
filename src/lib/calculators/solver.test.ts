import { describe, expect, it } from "vitest";
import { getCalculator } from "./data";
import { solve, type Value } from "./solver";
import type { Calculator } from "./types";

const calc = (id: string) => {
  const c = getCalculator("buy", id);
  if (!c) throw new Error(`missing ${id}`);
  return c;
};
const blank = (values: Value[], target: number) => values.map((v, i) => (i === target ? null : v));

describe("RATIO2: X = (A / B) * k  (CPM, k = 1000)", () => {
  const cpm = calc("cpm"); // spend, impressions, cpm
  it("A,B -> X", () => expect(solve(cpm, [5000, 1_200_000, null], 2)).toBeCloseTo(4.1667, 4));
  it("A,X -> B = (A*k)/X", () => expect(solve(cpm, [5000, null, 4], 1)).toBeCloseTo(1_250_000));
  it("B,X -> A = (X*B)/k", () => expect(solve(cpm, [null, 1_200_000, 4], 0)).toBeCloseTo(4800));
  it("waits on zero denominators", () => {
    expect(solve(cpm, [5000, 0, null], 2)).toBeNull();
    expect(solve(cpm, [5000, null, 0], 1)).toBeNull();
    expect(solve({ ...cpm, k: 0 }, [null, 1000, 4], 0)).toBeNull();
  });
});

describe("ROI2: X = ((A - B) / B) * 100", () => {
  const roi = calc("roi"); // return, cost, roi
  it("A,B -> X", () => expect(solve(roi, [30000, 20000, null], 2)).toBeCloseTo(50));
  it("B,X -> A = B*(1 + X/100)", () => expect(solve(roi, [null, 20000, 50], 0)).toBeCloseTo(30000));
  it("A,X -> B = A/(1 + X/100)", () => expect(solve(roi, [30000, null, 50], 1)).toBeCloseTo(20000));
  it("handles losses", () => expect(solve(roi, [15000, 20000, null], 2)).toBeCloseTo(-25));
  it("waits on zero denominators", () => {
    expect(solve(roi, [30000, 0, null], 2)).toBeNull();
    expect(solve(roi, [30000, null, -100], 1)).toBeNull();
  });
});

describe("INVERSE1: X = k / A  (Break-even ROAS, k = 100)", () => {
  const be = calc("break-even-roas"); // margin, beroas
  it("A -> X", () => expect(solve(be, [40, null], 1)).toBeCloseTo(2.5));
  it("X -> A = k/X", () => expect(solve(be, [null, 2.5], 0)).toBeCloseTo(40));
  it("waits on zero", () => {
    expect(solve(be, [0, null], 1)).toBeNull();
    expect(solve(be, [null, 0], 0)).toBeNull();
  });
});

describe("PRODUCT2_SCALED: X = A * (B * scale)  (Working media, B scale 0.01)", () => {
  const wm = calc("working-media"); // gross, working %, media
  it("A,B -> X", () => expect(solve(wm, [50000, 72, null], 2)).toBeCloseTo(36000));
  it("A,X -> B = (X/A)/scale", () => expect(solve(wm, [50000, null, 36000], 1)).toBeCloseTo(72));
  it("B,X -> A = X/(B*scale)", () => expect(solve(wm, [null, 72, 36000], 0)).toBeCloseTo(50000));
  it("waits on zero", () => {
    expect(solve(wm, [0, null, 36000], 1)).toBeNull();
    expect(solve(wm, [null, 0, 36000], 0)).toBeNull();
  });
});

describe("PRODUCT3: X = A * B * C  (LTV)", () => {
  const ltv = calc("ltv"); // aov, purchases/yr, lifespan, ltv
  const full = [65, 4, 3, 780];
  it("solves LTV from AOV, frequency and lifespan", () => expect(solve(ltv, blank(full, 3), 3)).toBeCloseTo(780));
  it("solves AOV", () => expect(solve(ltv, blank(full, 0), 0)).toBeCloseTo(65));
  it("solves purchases per year", () => expect(solve(ltv, blank(full, 1), 1)).toBeCloseTo(4));
  it("solves customer lifespan", () => expect(solve(ltv, blank(full, 2), 2)).toBeCloseTo(3));
  it("needs three of four known", () => {
    expect(solve(ltv, [65, 4, null, null], 3)).toBeNull();
    expect(solve(ltv, [65, null, null, 780], 2)).toBeNull();
  });
  it("waits on zero divisors", () => expect(solve(ltv, [65, 0, null, 780], 2)).toBeNull());
  it("applies per-var scale (Revenue forecast, CVR scale 0.01)", () => {
    const rf = calc("revenue-forecast"); // sessions, cvr %, aov, revenue
    expect(solve(rf, [50000, 2.5, 70, null], 3)).toBeCloseTo(87500);
    expect(solve(rf, [50000, null, 70, 87500], 1)).toBeCloseTo(2.5);
  });
});

describe("guards", () => {
  const cpm = calc("cpm");
  it("never returns NaN or Infinity", () => {
    const huge: Calculator = { ...cpm, k: 1e308 };
    expect(solve(huge, [1e308, 1e-10, null], 2)).toBeNull();
    expect(solve(cpm, [Number.NaN, 10, null], 2)).toBeNull();
  });
});
