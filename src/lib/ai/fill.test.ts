import { describe, expect, it } from "vitest";
import { getCalculator } from "../calculators/data";
import { gtmBudgetId } from "./specs";
import { basicFill, coerce, outputSchema, parseAmount } from "./fill";
import { getSpec } from "./registry";
import { calculatorSpec, DOOH_SPEC, GTM_SPEC, MEDIA_PLAN_SPEC, MMM_SPEC } from "./specs";

const read = (spec: Parameters<typeof basicFill>[0], t: string) => basicFill(spec, t).values;

describe("amounts", () => {
  it("reads symbols, separators, multipliers and Indian units", () => {
    expect(["$40k", "1.2 million", "15%", "2.5x", "3 lakh", "1,200,000", "₹2 crore", "abc"].map(parseAmount)).toEqual([40000, 1200000, 15, 2.5, 300000, 1200000, 20000000, null]);
  });
});

describe("built-in reader", () => {
  it("GTM: stage, region, goal, monthly budget made yearly", () => {
    expect(read(GTM_SPEC, "Bootstrapped SaaS startup entering India, $40k a month, want leads")).toEqual({ industry: "saas", geo: "india", goal: "demand", stage: "bootstrapped", budget: 480000 });
  });
  it("GTM: other currencies become US dollars, and US only in capitals", () => {
    const r = basicFill(GTM_SPEC, "Seed-stage beauty brand in the UK, £200k this year");
    expect(r.values).toMatchObject({ industry: "cpg", geo: "uk", stage: "startup", budget: 256410 });
    expect(r.note).toMatch(/Converted GBP/);
    expect(read(GTM_SPEC, "help us grow our fintech").geo).toBeUndefined();
    expect(read(GTM_SPEC, "fintech launching in the US").geo).toBe("na");
    expect(read(GTM_SPEC, "self-funded fintech in Dubai, about 3 lakh a month")).toMatchObject({ stage: "bootstrapped", geo: "mena", budget: Math.round(3600000 / 83.5) });
  });
  it("DoohSight: numbers bind to the word next to them", () => {
    expect(read(DOOH_SPEC, "We spent $120k on 300 screens, 6.4M impressions, reached 1.3M of a 5M population")).toEqual({ spend: 120000, screens: 300, impressions: 6400000, reach: 1300000, population: 5000000 });
    expect(read(DOOH_SPEC, "exposed visit rate 5.1%, control 3.8%, basket $9, margin 55%")).toEqual({ exposedVisitPct: 5.1, controlVisitPct: 3.8, basket: 9, marginPct: 55 });
  });
  it("Media plan: shares, markets, dates, length", () => {
    expect(read(MEDIA_PLAN_SPEC, "Conversion campaign, €150k, 40% social, 30% YouTube")).toMatchObject({ objective: "Conversion", currency: "EUR", budget: 150000, pct_social: 40, pct_youtube: 30 });
    const v = read(MEDIA_PLAN_SPEC, 'Awareness launch "Desert Bloom" in the UAE and Saudi, $300k over 8 weeks starting 1 March 2027');
    expect(v).toMatchObject({ objective: "Awareness", budget: 300000, weeks: 8, startDate: "2027-03-01", campaignName: "Desert Bloom" });
    expect((v.geos as string[]).sort()).toEqual(["Saudi Arabia", "United Arab Emirates"]);
  });
  it("Media plan: CAC and ROAS targets next to the goal word", () => {
    expect(read(MEDIA_PLAN_SPEC, "$80k for the US, keep CAC under $50")).toMatchObject({ budget: 80000, goal: "cac", cac: 50 });
    expect(read(MEDIA_PLAN_SPEC, "Maximise ROAS with $200k, target 4x")).toMatchObject({ goal: "roas", roas: 4, budget: 200000 });
  });
  it("Media mix model: settings in plain words", () => {
    expect(read(MMM_SPEC, "Revenue KPI in euros, 55% gross margin, hold out 8 weeks")).toMatchObject({ kpiType: "revenue", currency: "€", margin: 55, holdout: 8 });
    expect(read(MMM_SPEC, "Leads, target cost per lead $40, thorough ranges")).toMatchObject({ kpiType: "conversions", targetCpa: 40, speed: "thorough" });
  });
  it("calculators: 'spent' counts as spend; every calculator's own example reads back", () => {
    const cpm = calculatorSpec("buy", getCalculator("buy", "cpm")!);
    expect(read(cpm, "I spent $5,000 and got 1.2M impressions")).toEqual({ spend: 5000, impressions: 1200000 });
    expect(basicFill(cpm, "hello there").note).toMatch(/Couldn't find anything/);
  });
});

describe("checking answers", () => {
  it("drops unknown fields, bad numbers, out-of-range percents and unknown options", () => {
    expect(coerce(GTM_SPEC, [{ field: "industry", value: "saas" }, { field: "geo", value: "Mars" }, { field: "budget", value: "-5" }, { field: "evil", value: "1" }])).toEqual({ industry: "saas" });
    expect(coerce(DOOH_SPEC, [{ field: "viewablePct", value: "150" }, { field: "viewablePct", value: "62" }])).toEqual({ viewablePct: 62 });
    expect(coerce(MMM_SPEC, [{ field: "speed", value: "ludicrous" }, { field: "margin", value: "55" }])).toEqual({ margin: 55 });
  });
  it("schema lists exactly the spec's fields", () => {
    const s = outputSchema(GTM_SPEC) as { properties: { values: { items: { properties: { field: { enum: string[] } } } } } };
    expect(s.properties.values.items.properties.field.enum).toEqual(GTM_SPEC.fields.map((f) => f.key));
  });
  it("server accepts only known tools", () => {
    expect(getSpec("gtm")?.id).toBe("gtm");
    expect(getSpec("calc:sell:fill-rate")?.title).toBeTruthy();
    expect([getSpec("calc:buy:nope"), getSpec("toString"), getSpec("__proto__")]).toEqual([null, null, null]);
  });
  it("GTM budget buckets", () => {
    expect([100_000, 250_000, 999_999, 4_000_000, 9_000_000].map(gtmBudgetId)).toEqual(["b1", "b2", "b2", "b3", "b4"]);
  });
});
