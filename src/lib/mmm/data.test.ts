import { describe, expect, it } from "vitest";
import { buildDataset, channelName, guessRoles, readTable, templateCsv } from "./data";
import { sampleDataset } from "./sample";

describe("data layer", () => {
  it("the template reads back as the sample, with roles guessed", () => {
    const t = readTable(templateCsv(), "template.csv");
    const roles = guessRoles(t);
    expect(roles).toEqual(["date", "kpi", "spend", "spend", "spend", "spend", "spend", "spend", "control", "control"]);
    const { dataset, checks } = buildDataset(t, roles);
    const s = sampleDataset();
    expect(checks.filter((c) => c.level === "error")).toEqual([]);
    expect(dataset!.kpi).toEqual(s.kpi);
    expect(dataset!.channels.map((c) => c.name)).toEqual(["TV", "Paid Search", "Paid Social", "Online Video", "Display", "Retail Media"]);
    expect(dataset!.channels[0].spend).toEqual(s.channels[0].spend);
  });
  it("two or three pasted rows give a clear error, not a crash", () => {
    const t = readTable("date\trevenue\ttv_spend\n2026-01-05\t100\t10\n2026-01-12\t120\t0\n2026-01-19\t110\t5", "Pasted data");
    const { dataset, checks } = buildDataset(t, guessRoles(t));
    expect(dataset).toBeNull();
    expect(checks.find((c) => c.level === "error")!.text).toMatch(/Only 3 weeks of data.*at least 26 weeks/);
  });
  it("daily rows are added up into weeks", () => {
    const rows = Array.from({ length: 7 * 30 }, (_, i) => `${new Date(Date.UTC(2026, 0, 5) + i * 86400000).toISOString().slice(0, 10)},${100 + (i % 7) + (Math.floor(i / 7) % 5) * 10},${i % 3}`);
    const t = readTable(["day,sales,search cost", ...rows].join("\n"), "daily.csv");
    const { dataset, checks } = buildDataset(t, guessRoles(t));
    expect(dataset!.kpi).toHaveLength(30);
    expect(dataset!.kpi[0]).toBe(100 + 101 + 102 + 103 + 104 + 105 + 106);
    expect(checks.some((c) => /Daily data/.test(c.text))).toBe(true);
  });
  it("names channels from spend columns", () => {
    expect(["tv_spend", "Paid Search Cost", "meta_spend", "dooh_investment"].map(channelName)).toEqual(["TV", "Paid Search", "Meta", "DOOH"]);
  });
  it("missing roles are explained", () => {
    const t = readTable("a,b\n1,2\n", "x.csv");
    const { checks } = buildDataset(t, ["ignore", "ignore"]);
    expect(checks.map((c) => c.text).join(" ")).toMatch(/date.*KPI.*spend/s);
  });
});
