// Media mix model data layer: reading a CSV or pasted table, guessing what each column is, checking the data and
// turning it into a weekly Dataset. Runs in the browser; nothing is uploaded.

import { dayKey, parseCsv, toNumber } from "../doohsight-data";
import type { Dataset, FitResult } from "./engine";
import { sampleDataset } from "./sample";

export type Role = "date" | "kpi" | "spend" | "control" | "ignore";
export type Table = { name: string; headers: string[]; rows: string[][] };
export type Check = { level: "ok" | "warn" | "error"; text: string };

export const MIN_WEEKS = 26;
export const GOOD_WEEKS = 52;
export const MAX_BYTES = 20_000_000;

export function readTable(text: string, name: string): Table {
  const rows = parseCsv(text);
  const [headers = [], ...data] = rows;
  return { name, headers: headers.map((h, i) => h || `Column ${i + 1}`), rows: data };
}

const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const DATE_WORDS = /\b(date|week|wk|period|day|month|week start|week ending)\b/;
const KPI_WORDS = /\b(revenue|sales|turnover|gmv|conversions?|orders?|leads?|signups?|sign ups|installs?|kpi|bookings|transactions|units)\b/;
const SPEND_WORDS = /\b(spend|cost|costs|investment|budget|media|grp|grps)\b/;
const CONTROL_WORDS = /\b(price|promo|promotion|discount|holiday|sale|event|competitor|weather|temperature|distribution|stock|launch|covid|seasonal)\b/;

/** First guess at each column's role; the visitor can change any of them. */
export function guessRoles(t: Table): Role[] {
  const numeric = t.headers.map((_, i) => {
    const vals = t.rows.map((r) => r[i] ?? "").filter((v) => v !== "");
    return vals.length > 0 && vals.filter((v) => toNumber(v) !== null).length / vals.length > 0.9;
  });
  const dateLike = t.headers.map((_, i) => {
    const vals = t.rows.slice(0, 20).map((r) => r[i] ?? "").filter(Boolean);
    return vals.length > 0 && vals.every((v) => !/^\d+(\.\d+)?$/.test(v) && dayKey(v) !== null);
  });
  const roles: Role[] = t.headers.map(() => "ignore");
  let date = t.headers.findIndex((h, i) => dateLike[i] && DATE_WORDS.test(n(h)));
  if (date < 0) date = dateLike.indexOf(true);
  if (date >= 0) roles[date] = "date";
  let kpi = t.headers.findIndex((h, i) => roles[i] === "ignore" && numeric[i] && KPI_WORDS.test(n(h)) && !SPEND_WORDS.test(n(h)));
  t.headers.forEach((h, i) => {
    if (roles[i] !== "ignore" || !numeric[i] || i === kpi) return;
    if (SPEND_WORDS.test(n(h))) roles[i] = "spend";
    else if (CONTROL_WORDS.test(n(h))) roles[i] = "control";
  });
  // No named KPI: take the first numeric column that isn't spend or a control.
  if (kpi < 0) kpi = t.headers.findIndex((_, i) => roles[i] === "ignore" && numeric[i]);
  if (kpi >= 0) roles[kpi] = "kpi";
  return roles;
}

/** "tv_spend" → "TV", "Paid Search Cost" → "Paid Search". */
export function channelName(h: string) {
  const words = h.replace(/[_-]+/g, " ").replace(/\b(spend|cost|costs|investment|budget|usd|eur|gbp|\(.*?\))\b/gi, " ").replace(/\s+/g, " ").trim() || h;
  return words.length <= 3 ? words.toUpperCase() : words.replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bTv\b/, "TV").replace(/\bOoh\b/, "OOH").replace(/\bDooh\b/, "DOOH").replace(/\bCtv\b/, "CTV");
}

const DAY = 86_400_000;
const dayNum = (k: string) => Math.round(Date.parse(k + "T00:00:00Z") / DAY);
const isoOf = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);
/** Monday on or before the day. */
const mondayOf = (d: number) => d - ((new Date(d * DAY).getUTCDay() + 6) % 7);

/** Builds the weekly dataset from a table and roles, with checks in plain language. */
export function buildDataset(t: Table, roles: Role[]): { dataset: Dataset | null; checks: Check[] } {
  const checks: Check[] = [];
  const err = (text: string) => checks.push({ level: "error", text });
  const warn = (text: string) => checks.push({ level: "warn", text });
  const ok = (text: string) => checks.push({ level: "ok", text });
  const di = roles.indexOf("date"), ki = roles.indexOf("kpi");
  const si = roles.flatMap((r, i) => (r === "spend" ? [i] : []));
  const ci = roles.flatMap((r, i) => (r === "control" ? [i] : []));
  if (di < 0) err("Choose which column holds the date (one row per week).");
  if (ki < 0) err("Choose the KPI column: revenue, sales or conversions.");
  if (!si.length) err("Mark at least one column as channel spend.");
  if (roles.filter((r) => r === "date").length > 1 || roles.filter((r) => r === "kpi").length > 1) err("Only one date column and one KPI column can be used.");
  if (si.length > 12) err(`${si.length} spend columns: the model handles up to 12 channels. Combine small ones (for example all display into one).`);
  if (checks.some((c) => c.level === "error")) return { dataset: null, checks };

  // Parse rows, skipping ones without a readable date.
  type Row = { day: number; kpi: number; spend: number[]; controls: number[] };
  const parsed: Row[] = [];
  let badDates = 0, blanks = 0, negatives = 0;
  for (const r of t.rows) {
    const k = dayKey(r[di] ?? "");
    if (!k) {
      badDates++;
      continue;
    }
    const num = (i: number) => {
      const v = toNumber(r[i] ?? "");
      if (v === null) blanks++;
      return v ?? 0;
    };
    const spend = si.map((i) => {
      const v = num(i);
      if (v < 0) negatives++;
      return Math.max(0, v);
    });
    parsed.push({ day: dayNum(k), kpi: num(ki), spend, controls: ci.map(num) });
  }
  if (badDates) warn(`${badDates} ${badDates === 1 ? "row was" : "rows were"} skipped because the date couldn't be read. Use YYYY-MM-DD.`);
  if (parsed.length < 2) {
    err(`Only ${parsed.length} ${parsed.length === 1 ? "row has" : "rows have"} a readable date. The model needs at least ${MIN_WEEKS} weeks; ${GOOD_WEEKS} or more is better.`);
    return { dataset: null, checks };
  }
  parsed.sort((a, b) => a.day - b.day);

  // Daily rows become weeks: sums for KPI and spend, averages for controls.
  const gaps = parsed.slice(1).map((r, i) => r.day - parsed[i].day).sort((a, b) => a - b);
  const gap = gaps[Math.floor(gaps.length / 2)] ?? 7;
  let weeks: Row[] = parsed;
  if (gap <= 2) {
    const byWeek = new Map<number, Row & { count: number }>();
    for (const r of parsed) {
      const w = mondayOf(r.day);
      const cur = byWeek.get(w) ?? { day: w, kpi: 0, spend: si.map(() => 0), controls: ci.map(() => 0), count: 0 };
      cur.kpi += r.kpi;
      r.spend.forEach((v, j) => (cur.spend[j] += v));
      r.controls.forEach((v, j) => (cur.controls[j] += v));
      cur.count++;
      byWeek.set(w, cur);
    }
    weeks = [...byWeek.values()].sort((a, b) => a.day - b.day).map((w) => ({ ...w, controls: w.controls.map((v) => v / w.count) }));
    const partial = [...byWeek.values()].filter((w) => w.count < 7).length;
    ok(`Daily data: added up into ${weeks.length} weeks (Monday to Sunday).`);
    if (partial) warn(`${partial} ${partial === 1 ? "week has" : "weeks have"} fewer than 7 days, usually the first and last. Trim them if their totals look low.`);
  } else if (gap >= 25) {
    err("This looks like monthly data. The model needs weekly rows to see carryover; export the data by week.");
    return { dataset: null, checks };
  }
  // Duplicate dates
  const dupes = weeks.length - new Set(weeks.map((w) => w.day)).size;
  if (dupes) warn(`${dupes} duplicate ${dupes === 1 ? "date" : "dates"}: each date should appear once. Only the first is kept.`);
  weeks = weeks.filter((w, i) => i === 0 || w.day !== weeks[i - 1].day);
  const missing = weeks.slice(1).reduce((acc, w, i) => acc + Math.max(0, Math.round((w.day - weeks[i].day) / 7) - 1), 0);
  if (missing) warn(`${missing} ${missing === 1 ? "week is" : "weeks are"} missing between the first and last date. The model treats the rows as consecutive weeks.`);

  const W = weeks.length;
  if (W < MIN_WEEKS) {
    err(`Only ${W} ${W === 1 ? "week" : "weeks"} of data. The model needs at least ${MIN_WEEKS} weeks to separate channels from each other; ${GOOD_WEEKS}–104 is best.`);
    return { dataset: null, checks };
  }
  if (W < GOOD_WEEKS) warn(`${W} weeks: enough to run, but under a year means seasonality can't be modeled and ranges will be wide.`);
  else ok(`${W} weeks of data (${isoOf(weeks[0].day)} to ${isoOf(weeks[W - 1].day)}).`);
  if (blanks) warn(`${blanks} empty or non-numeric ${blanks === 1 ? "cell was" : "cells were"} read as 0.`);
  if (negatives) warn(`${negatives} negative spend ${negatives === 1 ? "value was" : "values were"} set to 0.`);

  const kpi = weeks.map((w) => w.kpi);
  if (kpi.every((v) => v === kpi[0])) err("The KPI is the same every week, so there is nothing to explain.");
  if (kpi.filter((v) => v <= 0).length > W * 0.1) warn("More than 10% of weeks have a KPI of zero or less. Check the KPI column.");

  const channels = si.map((col, j) => ({ name: channelName(t.headers[col]), spend: weeks.map((w) => w.spend[j]) }));
  const seen = new Map<string, number>();
  for (const c of channels) {
    const k = c.name.toLowerCase();
    seen.set(k, (seen.get(k) ?? 0) + 1);
    if (seen.get(k)! > 1) c.name = `${c.name} ${seen.get(k)}`;
  }
  for (const c of channels) {
    const active = c.spend.filter((v) => v > 0).length;
    if (!active) err(`${c.name} has no spend at all. Remove it or set it to Ignore.`);
    else if (active < W * 0.2) warn(`${c.name} spends in only ${active} of ${W} weeks. Its result will be uncertain.`);
    const m = c.spend.reduce((a, b) => a + b, 0) / W;
    const sd = Math.sqrt(c.spend.reduce((a, b) => a + (b - m) ** 2, 0) / W);
    if (active && sd < m * 0.05) warn(`${c.name} spends almost the same every week. The model needs ups and downs to measure it.`);
  }
  // Channels that always move together can't be told apart.
  for (let a = 0; a < channels.length; a++)
    for (let b = a + 1; b < channels.length; b++) {
      const r = corr(channels[a].spend, channels[b].spend);
      if (r > 0.9) warn(`${channels[a].name} and ${channels[b].name} move together (correlation ${r.toFixed(2)}), so their split is uncertain. Consider combining them.`);
    }
  const controls = ci.map((col, j) => ({ name: t.headers[col], values: weeks.map((w) => w.controls[j]) })).filter((c) => !c.values.every((v) => v === c.values[0]));
  if (controls.length < ci.length) warn("A control column with the same value every week was left out.");
  if (!checks.some((c) => c.level === "error")) ok(`${channels.length} ${channels.length === 1 ? "channel" : "channels"}${controls.length ? ` and ${controls.length} ${controls.length === 1 ? "control" : "controls"}` : ""} ready to model.`);
  if (checks.some((c) => c.level === "error")) return { dataset: null, checks };

  return {
    dataset: { name: t.name.replace(/\.(csv|tsv|txt)$/i, "") || "Your data", dates: weeks.map((w) => isoOf(w.day)), kpiName: t.headers[ki], kpi, channels, controls },
    checks,
  };
}

function corr(a: number[], b: number[]) {
  const ma = a.reduce((x, y) => x + y, 0) / a.length, mb = b.reduce((x, y) => x + y, 0) / b.length;
  let sab = 0, sa = 0, sb = 0;
  for (let i = 0; i < a.length; i++) (sab += (a[i] - ma) * (b[i] - mb)), (sa += (a[i] - ma) ** 2), (sb += (b[i] - mb) ** 2);
  return sa && sb ? sab / Math.sqrt(sa * sb) : 0;
}

const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** The sample as a CSV in the layout the model reads: also the downloadable template. */
export function templateCsv() {
  const d = sampleDataset();
  const head = ["date", "revenue", ...d.channels.map((c) => `${slug(c.name)}_spend`), ...d.controls.map((c) => slug(c.name))];
  const lines = d.dates.map((date, t) => [date, d.kpi[t], ...d.channels.map((c) => c.spend[t]), ...d.controls.map((c) => c.values[t])].join(","));
  return [head.join(","), ...lines].join("\n") + "\n";
}

/** Weekly results for export: actual, predicted, baseline and each channel's contribution. */
export function resultsCsv(r: FitResult) {
  const head = ["date", "actual", "predicted", "baseline", ...r.channels.map((c) => `${c.name} contribution`)];
  const lines = r.dates.map((d, t) => [d, r.actual[t], r.predicted[t], r.baseline[t], ...r.channels.map((c) => c.contrib[t])].map((v) => (typeof v === "number" ? String(Math.round(v * 100) / 100) : v)).join(","));
  const summary = ["", "channel,spend,contribution,roi,roi_low_90,roi_high_90,marginal_roi", ...r.channels.map((c) => [q(c.name), c.totalSpend, c.totalContrib, c.roi, c.ci.roi[0], c.ci.roi[1], c.mroi].map((v) => (typeof v === "number" ? String(Math.round(v * 1000) / 1000) : v)).join(","))];
  return [head.map(q).join(","), ...lines, ...summary].join("\n") + "\n";
}
