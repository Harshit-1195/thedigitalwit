import { describe, expect, it } from "vitest";
import { workedExample } from "./copy";
import { BUY_CALCULATORS, BUY_CATEGORIES, COUNTS, getCalculator, SELL_CALCULATORS, SIDES, type Side } from "./data";
import { solve } from "./solver";
import { RELATION_ARITY } from "./types";

describe("buyside-calculators.json", () => {
  it("has 63 calculators across all 13 verticals", () => {
    expect(BUY_CALCULATORS).toHaveLength(63);
    expect(new Set(BUY_CALCULATORS.map((c) => c.cat)).size).toBe(13);
    expect(BUY_CATEGORIES).toHaveLength(13);
  });

  it("covers all five relation types", () => {
    expect(new Set(BUY_CALCULATORS.map((c) => c.relation))).toEqual(
      new Set(["RATIO2", "ROI2", "INVERSE1", "PRODUCT2_SCALED", "PRODUCT3"]),
    );
  });

  it("builds the CPM worked example from the defaults", () => {
    expect(workedExample(getCalculator("buy", "cpm")!)).toBe(
      "If spend is $5,000 and impressions is 1,200,000, then CPM = $4.17.",
    );
  });
});

describe("sellside-calculators.json", () => {
  it("has exactly the 12 calculators named in the spec", () => {
    expect(SELL_CALCULATORS.map((c) => c.name)).toEqual([
      "RPM",
      "Seller eCPM",
      "Publisher ARPU",
      "Revenue per Available Ad Slot",
      "Fill Rate",
      "Viewable Fill Rate",
      "Ad Load",
      "Header Bidding Win Rate",
      "Header Bidding CPM Uplift",
      "Publisher Take-Home Rate",
      "PG Realization Rate",
      "Direct Revenue Mix",
    ]);
  });

  it("builds the RPM worked example from the defaults", () => {
    expect(workedExample(getCalculator("sell", "rpm")!)).toBe(
      "If ad revenue is $2,400 and pageviews is 600,000, then RPM = $4.00.",
    );
  });
});

it("Home counts come from the data", () => {
  expect(COUNTS).toEqual({ buySide: 63, sellSide: 12, total: 75, buyVerticals: 13 });
});

for (const side of ["buy", "sell"] as Side[]) {
  const { calculators, categories } = SIDES[side];

  describe(`${side}-side integrity`, () => {
    it("uses unique, URL-safe ids and known category codes", () => {
      const codes = new Set(categories.map((c) => c.code));
      expect(new Set(calculators.map((c) => c.id)).size).toBe(calculators.length);
      for (const c of calculators) {
        expect(c.id).toMatch(/^[a-z0-9-]+$/);
        expect(codes.has(c.cat), `${c.id} cat ${c.cat}`).toBe(true);
      }
      for (const cat of categories) expect(calculators.some((c) => c.cat === cat.code), cat.code).toBe(true);
    });

    // Every calculator, every direction: hide one default, solve it back.
    for (const c of calculators) {
      it(`${c.id} (${c.relation}) solves every var from the others`, () => {
        expect(c.vars).toHaveLength(RELATION_ARITY[c.relation]);
        const defaults = c.vars.map((v) => v.d);
        c.vars.forEach((v, i) => {
          const got = solve(c, defaults.map((d, j) => (j === i ? null : d)), i);
          expect(got, `${c.id}.${v.key}`).not.toBeNull();
          expect(Math.abs(got! - v.d) / Math.abs(v.d)).toBeLessThan(1e-6);
        });
        expect(workedExample(c)).toBeTruthy();
      });
    }
  });
}
