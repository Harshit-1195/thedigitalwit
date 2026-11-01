import { describe, expect, it } from "vitest";
import { buildGeoBenchmark, buildPlan, toPercent, type Inputs } from "./build";
import { BUDGETS, CHANNEL_IDS, COLORS, GEOS, GOALS, INDUSTRIES, STAGES } from "./data";

const pick = <T extends { id: string }>(list: T[], id: string) => list.find((x) => x.id === id)!;
const inputs = (o: Partial<Record<"industry" | "geo" | "goal" | "stage" | "budget", string>> & { notes?: string } = {}): Inputs => ({
  industry: pick(INDUSTRIES, o.industry ?? "saas"),
  geo: pick(GEOS, o.geo ?? "na"),
  goal: pick(GOALS, o.goal ?? "demand"),
  stage: pick(STAGES, o.stage ?? "growth"),
  budget: pick(BUDGETS, o.budget ?? "b3"),
  notes: o.notes ?? "",
});

describe("GTM data", () => {
  it("has the counts the tool promises", () => {
    expect([INDUSTRIES.length, GEOS.length, GOALS.length, STAGES.length, BUDGETS.length]).toEqual([10, 9, 4, 4, 4]);
    expect(COLORS).toHaveLength(CHANNEL_IDS.length);
    for (const b of BUDGETS) expect(b.split.reduce((s, v) => s + v, 0)).toBe(100);
  });
  it("never states a market-size dollar figure", () => {
    const text = JSON.stringify([INDUSTRIES, GEOS, GOALS, STAGES]) + JSON.stringify(buildPlan(inputs()).narrative);
    expect(text).not.toMatch(/\$\s?\d+(\.\d+)?\s?(bn|billion|m|million|trillion)\b/i);
    expect(text).not.toMatch(/market (is )?worth/i);
  });
});

describe("GTM plan", () => {
  it("builds the default plan: mix sums to 100, five budget slices", () => {
    const p = buildPlan(inputs());
    expect(p.mix.reduce((s, c) => s + c.pct, 0)).toBe(100);
    expect(p.mix.length).toBeLessThanOrEqual(6);
    expect(p.budget).toHaveLength(5);
    expect(p.timeline.at(-1)!.end).toBe(26);
    expect(p.timeline[0].start).toBe(1);
    for (let i = 1; i < p.timeline.length; i++) expect(p.timeline[i].start).toBe(p.timeline[i - 1].end + 1);
  });

  it("CPG in Greater China: local stack, ease 1/5, entry and FX risks, in-market lead", () => {
    const base = buildPlan(inputs());
    const p = buildPlan(inputs({ industry: "cpg", geo: "china" }));
    expect(p.mix.map((c) => c.id)).not.toEqual(base.mix.map((c) => c.id));
    expect(p.mix.flatMap((c) => c.stack).some((t) => /Tmall|WeChat|Douyin/.test(t))).toBe(true);
    expect(p.narrative.positioning).toContain("is the consumer packaged goods choice");
    expect(p.scorecard.find((s) => s.label === "Ease of entry")!.score).toBe(1);
    expect(p.risks.some((r) => r.severity === "High" && /Entry friction/.test(r.risk))).toBe(true);
    expect(p.risks.some((r) => r.severity === "High" && /FX/.test(r.risk))).toBe(true);
    expect(p.compliance.some((c) => /PIPL/.test(c))).toBe(true);
    expect(p.governance.inMarket).toMatch(/in-market lead/);
  });

  it("goal-specific risks", () => {
    expect(buildPlan(inputs({ goal: "expansion" })).risks.some((r) => r.severity === "High" && /creative may not translate/i.test(r.risk))).toBe(true);
    expect(buildPlan(inputs({ goal: "retention" })).risks.some((r) => /CRM data hygiene/.test(r.risk))).toBe(true);
  });

  it("audience notes drive the ICP line and first pillar", () => {
    const p = buildPlan(inputs({ notes: "mid-market ops leaders, price-sensitive, mobile-first" }));
    expect(p.narrative.icp).toMatch(/^mid-market ops leaders in North America/);
    expect(p.narrative.pillars[0]).toBe("Built for mid-market ops leaders");
    expect(p.narrative.positioning).toMatch(/^For mid-market ops leaders in North America \(B2B SaaS\), \[your brand\] is the B2B SaaS choice with one clear promise: built for mid-market ops leaders\./);
  });

  it("bootstrapped: owned channels lead, cash-flow risk, budget fit like a startup", () => {
    const boot = buildPlan(inputs({ stage: "bootstrapped", budget: "b1" }));
    const ent = buildPlan(inputs({ stage: "enterprise", budget: "b1" }));
    const share = (p: typeof boot, id: string) => p.mix.find((c) => c.id === id)?.pct ?? 0;
    expect(share(boot, "content") + share(boot, "crm")).toBeGreaterThan(share(ent, "content") + share(ent, "crm"));
    expect(boot.mix.some((c) => c.id === "ctv")).toBe(false);
    expect(boot.risks[0]).toMatchObject({ severity: "High", risk: expect.stringMatching(/^Cash flow/) });
    expect(boot.risks.some((r) => /Founder bandwidth/.test(r.risk))).toBe(true);
    expect(boot.scorecard.find((s) => s.label === "Budget fit")!.score).toBe(buildPlan(inputs({ stage: "startup", budget: "b1" })).scorecard.find((s) => s.label === "Budget fit")!.score);
    expect(boot.governance.governance).toMatch(/revenue/);
  });

  it("geography benchmark: every market, ranked, selected inputs held constant", () => {
    const b = buildGeoBenchmark(inputs({ industry: "cpg" }));
    expect(b.map((g) => g.id).sort()).toEqual(GEOS.map((g) => g.id).sort());
    for (let i = 1; i < b.length; i++) expect(b[i - 1].overall).toBeGreaterThanOrEqual(b[i].overall);
    const china = b.find((g) => g.id === "china")!;
    expect(china).toMatchObject({ fx: "high", inMarketLead: true, localPlatforms: 6 });
    expect(china.scores.find((s) => s.label === "Ease of entry")!.score).toBe(1);
    expect(b.at(-1)!.id).toBe("china");
    expect(china.firstGate).toBeGreaterThan(b.find((g) => g.id === "na")!.firstGate);
    expect(JSON.stringify(b)).not.toMatch(/\$\s?\d+(\.\d+)?\s?(bn|billion|m|million|trillion)\b/i);
  });

  it("every combination produces a valid plan", () => {
    for (const industry of INDUSTRIES) for (const geo of GEOS) for (const goal of GOALS) for (const stage of STAGES) for (const budget of BUDGETS) {
      const p = buildPlan({ industry, geo, goal, stage, budget, notes: "" });
      expect(p.mix.reduce((s, c) => s + c.pct, 0)).toBe(100);
      expect(p.mix.length).toBeGreaterThan(0);
      expect(p.mix.length).toBeLessThanOrEqual(budget.maxChannels);
      expect(p.timeline.at(-1)!.end).toBe(26);
      expect(p.timeline.every((ph) => ph.end >= ph.start)).toBe(true);
      expect(p.scorecard.every((s) => s.score >= 1 && s.score <= 5)).toBe(true);
    }
  });

  it("rounds shares to exactly 100", () => {
    expect(toPercent([1, 1, 1])).toEqual([34, 33, 33]);
    expect(toPercent([3, 1])).toEqual([75, 25]);
    expect(toPercent([2, 2, 2, 1]).reduce((s, v) => s + v, 0)).toBe(100);
  });
});
