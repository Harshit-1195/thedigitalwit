import { describe, expect, it } from "vitest";
import { SAMPLE } from "./doohsight";
import { diff, FIELDS, fieldFor, importText, LAYOUTS, NUM_KEYS, parseCsv, toCsv, toNumber, type Imported } from "./doohsight-data";
import { latestPopulation, splitTrend } from "./doohsight-market";

const ok = (text: string, name = "x.csv") => {
  const r = importText(text, name);
  if ("error" in r) throw new Error(r.error);
  return r as Imported;
};
const example = (kind: string) => LAYOUTS.find((l) => l.kind === kind)!.example;

describe("parsing", () => {
  it("reads quotes, semicolons, tabs and a BOM", () => {
    expect(parseCsv('﻿a,b\n"1,5","say ""hi"""\r\n')).toEqual([["a", "b"], ["1,5", 'say "hi"']]);
    expect(parseCsv("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCsv("a\tb\n1\t2\n\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("reads money, percentages and separators as numbers", () => {
    expect([toNumber("$1,234.50"), toNumber("62%"), toNumber("1 200"), toNumber("abc"), toNumber("")]).toEqual([1234.5, 62, 1200, null, null]);
  });
  it("knows every input by key and by label", () => {
    for (const k of NUM_KEYS) expect([fieldFor(k), fieldFor(FIELDS[k].label)]).toEqual([k, k]);
    expect(Object.keys(FIELDS).sort()).toEqual(Object.keys(SAMPLE).filter((k) => k !== "campaign").sort());
  });
});

describe("summary import", () => {
  it("round-trips the exported CSV exactly", () => {
    const r = ok(toCsv({ ...SAMPLE, campaign: 'Big, "bold" launch' }));
    expect(r.kind).toBe("summary");
    expect(r.values).toEqual({ ...SAMPLE, campaign: 'Big, "bold" launch' });
    expect(r.notes).toEqual([]);
  });
  it("reads the example with aliases and units", () => {
    const r = ok(example("summary"));
    expect(r.values).toMatchObject({ campaign: "Spring Launch", spend: 120000, viewablePct: 58, attentivePct: 35, marginPct: 55 });
  });
  it("reads a wide layout (field names across the top)", () => {
    expect(ok("Media spend,Screens,Unique reach\n90000,200,750000\n").values).toEqual({ spend: 90000, screens: 200, reach: 750000 });
  });
  it("reads DoohSight's own saved JSON", () => {
    expect(ok(JSON.stringify({ v: 2, inputs: { spend: 5, screens: 6 } }), "a.json").values).toEqual({ spend: 5, screens: 6 });
  });
  it("flags values that aren't numbers and names it doesn't know", () => {
    const r = ok("field,value\nspend,lots\nscreens,10\nmoon phase,3\n");
    expect(r.values).toEqual({ screens: 10 });
    expect(r.notes.join(" ")).toMatch(/Media spend.*lots/);
    expect(r.notes.join(" ")).toMatch(/moon phase/);
  });
});

describe("raw report import", () => {
  it("proof-of-play log: screens, plays, impressions, spend, match, uptime, weeks", () => {
    const r = ok(example("pop"));
    expect(r.kind).toBe("pop");
    // 973 plays of 1,080 booked; screen LDN-002 dark on one of 9 screen-days.
    expect(r.values).toEqual({ screens: 3, plays: 973, impressions: 7890, spend: 389.2, popMatchPct: 90.09, uptimePct: 88.89, weeks: 1 });
  });
  it("a row-per-play log counts rows as plays", () => {
    const r = ok("screen,timestamp\nA,2026-09-01 08:00\nA,2026-09-01 09:00\nB,2026-09-10 10:00\n");
    expect(r.values).toMatchObject({ screens: 2, plays: 3, weeks: 2 });
  });
  it("weekly channel data: before and during averages", () => {
    const r = ok(example("halo"));
    expect(r.kind).toBe("halo");
    expect(r.values).toEqual({ weeks: 3, searchBase: 11983, searchCampaign: 15600, sessionsBase: 39933, sessionsCampaign: 47000, installsBase: 2000, installsCampaign: 2600 });
  });
  it("exposed vs control rows: holdout, footfall and brand lift", () => {
    const r = ok(example("groups"));
    expect(r.kind).toBe("groups");
    expect(r.values).toEqual({
      testN: 5, testConv: 2, controlN: 5, controlConv: 1,
      matchedDevices: 10, exposedVisitPct: 60, controlVisitPct: 20, repeatVisits: 2,
      awarenessExposed: 80, awarenessControl: 40, considerationExposed: 60, considerationControl: 20, intentExposed: 20, intentControl: 20, surveyN: 5,
    });
  });
  it("uses the smaller group for respondents and says so", () => {
    const r = ok("group,aware\ntest,1\ntest,0\ntest,1\nholdout,0\nholdout,1\nother,1\n");
    expect(r.values).toMatchObject({ surveyN: 2, awarenessExposed: 66.67, awarenessControl: 50 });
    expect(r.notes.join(" ")).toMatch(/smaller/);
    expect(r.notes.join(" ")).toMatch(/1 rows ignored/);
  });
  it("explains files it can't read", () => {
    expect(importText("", "a.csv")).toEqual({ error: "The file is empty." });
    expect("error" in importText("x", "plan.xlsx") && importText("x", "plan.xlsx")).toMatchObject({ error: expect.stringMatching(/Save it as CSV/) });
    expect(importText("colour,size\nred,4\n", "a.csv")).toMatchObject({ error: expect.stringMatching(/colour, size/) });
  });
  it("diff lists only changed fields", () => {
    expect(diff(SAMPLE, { spend: SAMPLE.spend, screens: 1 })).toEqual([{ key: "screens", from: SAMPLE.screens, to: 1 }]);
  });
});

describe("market helpers", () => {
  const claim = (amount: string, year?: string, rank = "normal") => ({ rank, mainsnak: { datavalue: { value: { amount } } }, ...(year ? { qualifiers: { P585: [{ datavalue: { value: { time: `+${year}-00-00T00:00:00Z` } } }] } } : {}) });
  it("picks the preferred population, then the latest", () => {
    expect(latestPopulation([claim("+100", "2011"), claim("+120", "2021")])).toEqual({ population: 120, year: 2021 });
    expect(latestPopulation([claim("+100", "2011", "preferred"), claim("+120", "2021")])).toEqual({ population: 100, year: 2011 });
    expect(latestPopulation([claim("+90", "2023", "deprecated"), claim("+80")])).toEqual({ population: 80, year: null });
    expect(latestPopulation([])).toBeNull();
  });
  it("splits search interest at the flight dates", () => {
    const pts = ["2026-08-25", "2026-08-31", "2026-09-01", "2026-09-07", "2026-09-14"].map((date, i) => ({ date, value: [40, 50, 60, 70, 99][i] }));
    expect(splitTrend(pts, "2026-09-01", "2026-09-07")).toEqual({ before: 45, during: 65, beforeN: 2, duringN: 2, weeks: 1 });
  });
});
