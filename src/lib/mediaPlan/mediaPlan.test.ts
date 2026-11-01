import { describe, expect, it } from "vitest";
import { ALLOCATION_PROFILES, CURRENCIES, DEFAULT_CHANNELS, GEOS } from "./constants";
import { fmtMoney, toUSD, weeksBetween } from "./format";
import { computeGrade, gradeColor, letterFor } from "./grading";
import { channelBudget, impressions, pacing, pctToWeek, weekToPct } from "./plan";

describe("media plan constants", () => {
  it("has 7 default channels summing to 100", () => {
    expect(DEFAULT_CHANNELS).toHaveLength(7);
    expect(DEFAULT_CHANNELS.reduce((s, c) => s + c.pct, 0)).toBe(100);
  });
  it("has 4 allocation profiles, each summing to 100 over all 7 channels", () => {
    expect(Object.keys(ALLOCATION_PROFILES)).toHaveLength(4);
    for (const p of Object.values(ALLOCATION_PROFILES)) {
      expect(Object.keys(p)).toHaveLength(7);
      expect(Object.values(p).reduce((s, v) => s + v, 0)).toBe(100);
    }
  });
  it("lists every currency and market from the brief once", () => {
    expect(CURRENCIES).toHaveLength(31);
    expect(new Set(CURRENCIES.map((c) => c.code)).size).toBe(31);
    expect(Object.keys(GEOS)).toHaveLength(6);
    expect(Object.values(GEOS).flat()).toHaveLength(35);
  });
});

describe("format", () => {
  it("formats money with no decimals and converts to USD", () => {
    expect(fmtMoney(1234.6, "USD")).toBe("$1,235");
    expect(fmtMoney(5000, "XXX-bad")).toBe("XXX-bad 5,000");
    expect(toUSD(367, "AED")).toBeCloseTo(100, 6);
  });
  it("counts weeks with a minimum of 1", () => {
    expect(weeksBetween("2026-11-14", "2027-01-09")).toEqual({ days: 56, weeks: 8 });
    expect(weeksBetween("2026-11-14", "2026-11-15").weeks).toBe(1);
  });
});

describe("grading", () => {
  it("scores the default plan", () => {
    const g = computeGrade(DEFAULT_CHANNELS, 3, 8, 250_000, "USD");
    expect(g.breakdown).toHaveLength(6);
    expect(g.breakdown.map((f) => f.max)).toEqual([25, 20, 20, 15, 10, 10]);
    // upper = ctv 20 + audio 10 + dooh 10 + youtube 15 = 55
    expect(g.breakdown[1].note).toBe("55% upper / 45% lower");
    expect(g.breakdown[1].score).toBe(18);
    // video = ctv 20 + youtube 15 + social 20 = 55 -> 20 × (1 − 5/50) = 18
    expect(g.breakdown[2].score).toBe(18);
    expect(g.breakdown[3].score).toBe(9);
    expect(g.breakdown[4].score).toBe(10);
    expect(g.breakdown[5].score).toBe(10);
    expect(g.letter).toBe(letterFor(g.total));
  });
  it("gives zero diversification to a single channel and full marks to an even split", () => {
    const one = DEFAULT_CHANNELS.map((c, i) => ({ ...c, pct: i === 0 ? 100 : 0 }));
    expect(computeGrade(one, 5, 6, 100_000, "USD").breakdown[0].score).toBe(0);
    const even = DEFAULT_CHANNELS.map((c) => ({ ...c, pct: 100 / 7 }));
    expect(computeGrade(even, 5, 6, 100_000, "USD").breakdown[0].score).toBe(25);
  });
  it("applies the activation floor in USD", () => {
    const g = computeGrade(DEFAULT_CHANNELS, 5, 6, 15_000, "USD"); // 10% channels get $1,500
    expect(g.breakdown[5].score).toBeCloseTo((10 * 4) / 7, 1);
  });
  it("maps letters and colours", () => {
    expect([95, 85, 75, 65, 10].map(letterFor)).toEqual(["A", "B", "C", "D", "F"]);
    expect(gradeColor("A")).toBe("#4CD787");
  });
});

describe("plan", () => {
  it("estimates impressions from the USD budget", () => {
    const ctv = DEFAULT_CHANNELS.find((c) => c.key === "ctv")!;
    expect(channelBudget(250_000, ctv)).toBe(50_000);
    expect(impressions(250_000, "USD", ctv)).toBeCloseTo((50_000 / 35) * 1000, 6);
    expect(impressions(250_000 * 149, "JPY", ctv)).toBeCloseTo((50_000 / 35) * 1000, 3);
  });
  it("paces each channel across its own flight and keeps the total", () => {
    const rows = pacing(DEFAULT_CHANNELS, 100_000, 8);
    const total = rows.reduce((s, r) => s + DEFAULT_CHANNELS.reduce((t, c) => t + (r[c.key] as number), 0), 0);
    expect(total).toBeCloseTo(100_000, 6);
    // CTV starting at week 2 shows first spend in W3
    const ctvLate = DEFAULT_CHANNELS.map((c) => (c.key === "ctv" ? { ...c, start: weekToPct(2, 8) } : c));
    const r2 = pacing(ctvLate, 100_000, 8);
    expect(r2.findIndex((r) => (r.ctv as number) > 0)).toBe(2);
    expect(r2[2].week).toBe("W3");
  });
  it("converts weeks and percentages both ways", () => {
    expect(pctToWeek(25, 8)).toBe(2);
    expect(weekToPct(2, 8)).toBe(25);
    expect(pctToWeek(weekToPct(5, 12), 12)).toBe(5);
  });
});
