// DoohSight data in: where each input comes from, and turning uploaded files into inputs.
// Pure functions only; the page reads the files and shows the review before anything is applied.

import type { Inputs, Layer } from "./doohsight";

export type NumKey = Exclude<keyof Inputs, "campaign">;
export type Group = Layer | "trust";

/** How an input can be filled without typing it. */
export type Auto = "file" | "market" | "both" | "manual";

export type FieldInfo = { label: string; group: Group; from: string; auto: Auto; aliases?: string[] };

/** Every numeric input: its label, who provides the number, and whether DoohSight can fill it. */
export const FIELDS: Record<NumKey, FieldInfo> = {
  spend: { label: "Media spend", group: "delivery", from: "Your IO or the DSP/SSP invoice", auto: "file", aliases: ["cost", "mediacost", "budget", "totalspend", "spendusd", "netspend"] },
  screens: { label: "Screens", group: "delivery", from: "Media owner or SSP proof-of-play report", auto: "file", aliases: ["frames", "displays", "screencount", "faces", "panels"] },
  plays: { label: "Ad plays delivered", group: "delivery", from: "Proof-of-play report", auto: "file", aliases: ["spots", "adplays", "spotsdelivered", "playcount", "playsdelivered"] },
  impressions: { label: "Audience impressions", group: "delivery", from: "Proof-of-play report with audience data (Geopath, Route, Outsmart or the media owner)", auto: "file", aliases: ["imps", "contacts", "impacts", "audience"] },
  reach: { label: "Unique reach", group: "delivery", from: "Audience measurement provider or the media owner's post-campaign report", auto: "manual", aliases: ["uniqueaudience", "uniques"] },
  population: { label: "Target market population", group: "delivery", from: "Census figures", auto: "market", aliases: ["marketpopulation", "universe", "targetpopulation"] },
  categorySpend: { label: "Category OOH spend in market", group: "delivery", from: "Ad spend tracker (Nielsen Ad Intel, Pathmatics) or an OOH trade body", auto: "manual", aliases: ["categoryspend", "categoryoohspend"] },
  marketSharePct: { label: "Your market share", group: "delivery", from: "Your sales data or a retail panel (NielsenIQ, Circana)", auto: "manual", aliases: ["marketshare", "share"] },
  benchmarkCpm: { label: "Benchmark CPM", group: "delivery", from: "Your past campaigns or your agency's rate card", auto: "manual", aliases: ["cpmbenchmark", "targetcpm"] },
  viewablePct: { label: "Viewable (likely to see)", group: "attention", from: "Attention vendor (Lumen, Adelaide, Quividi) or the media owner's camera audience data", auto: "manual", aliases: ["viewable", "viewability", "likelytosee", "lts"] },
  attentivePct: { label: "Attentive", group: "attention", from: "Attention vendor", auto: "manual", aliases: ["attentive", "attention", "attentionrate"] },
  attentiveSec: { label: "Attentive seconds per view", group: "attention", from: "Attention vendor", auto: "manual", aliases: ["attentiveseconds", "dwell", "dwelltime", "attentiontime"] },
  matchedDevices: { label: "Matched devices in the panel", group: "location", from: "Location data partner footfall study (Placer.ai, Unacast, Azira)", auto: "file", aliases: ["devices", "panelsize"] },
  exposedVisitPct: { label: "Exposed visit rate", group: "location", from: "Location data partner footfall study", auto: "file", aliases: ["exposedvisitrate"] },
  controlVisitPct: { label: "Control visit rate", group: "location", from: "Location data partner footfall study", auto: "file", aliases: ["controlvisitrate"] },
  repeatVisits: { label: "Visits per new visitor (90 days)", group: "location", from: "Location data partner footfall study", auto: "file", aliases: ["repeatvisits", "visitspervisitor"] },
  basket: { label: "Average basket", group: "location", from: "Your POS or finance data", auto: "manual", aliases: ["averagebasket", "aov", "averageordervalue", "basketsize"] },
  weeks: { label: "Campaign weeks", group: "cross", from: "Campaign dates", auto: "both", aliases: ["flightweeks", "duration"] },
  searchBase: { label: "Branded searches / week, before", group: "cross", from: "Google Ads or Search Console", auto: "both", aliases: ["searchbefore", "brandedsearchbefore"] },
  searchCampaign: { label: "Branded searches / week, during", group: "cross", from: "Google Ads or Search Console", auto: "both", aliases: ["searchduring", "brandedsearchduring"] },
  sessionsBase: { label: "Web sessions / week, before", group: "cross", from: "Web analytics (GA4, Adobe)", auto: "file", aliases: ["sessionsbefore"] },
  sessionsCampaign: { label: "Web sessions / week, during", group: "cross", from: "Web analytics (GA4, Adobe)", auto: "file", aliases: ["sessionsduring"] },
  installsBase: { label: "App installs / week, before", group: "cross", from: "App Store Connect, Play Console or your MMP", auto: "file", aliases: ["installsbefore"] },
  installsCampaign: { label: "App installs / week, during", group: "cross", from: "App Store Connect, Play Console or your MMP", auto: "file", aliases: ["installsduring"] },
  onlineRevenue: { label: "Attributed online revenue", group: "business", from: "Ecommerce analytics, attributed to the flight", auto: "manual", aliases: ["onlinerevenue", "revenue", "ecommercerevenue"] },
  marginPct: { label: "Gross margin", group: "business", from: "Finance", auto: "manual", aliases: ["margin", "grossmarginpct"] },
  surveyN: { label: "Respondents per group", group: "brand", from: "Brand-lift survey vendor", auto: "file", aliases: ["respondents", "samplesize"] },
  awarenessExposed: { label: "Awareness, exposed", group: "brand", from: "Brand-lift survey vendor", auto: "file" },
  awarenessControl: { label: "Awareness, control", group: "brand", from: "Brand-lift survey vendor", auto: "file" },
  considerationExposed: { label: "Consideration, exposed", group: "brand", from: "Brand-lift survey vendor", auto: "file" },
  considerationControl: { label: "Consideration, control", group: "brand", from: "Brand-lift survey vendor", auto: "file" },
  intentExposed: { label: "Purchase intent, exposed", group: "brand", from: "Brand-lift survey vendor", auto: "file" },
  intentControl: { label: "Purchase intent, control", group: "brand", from: "Brand-lift survey vendor", auto: "file" },
  testN: { label: "Test group size", group: "increment", from: "Your geo or audience holdout test", auto: "file" },
  testConv: { label: "Test group conversions", group: "increment", from: "Your geo or audience holdout test", auto: "file" },
  controlN: { label: "Control group size", group: "increment", from: "Your geo or audience holdout test", auto: "file" },
  controlConv: { label: "Control group conversions", group: "increment", from: "Your geo or audience holdout test", auto: "file" },
  popMatchPct: { label: "Proof-of-play match", group: "trust", from: "Proof-of-play report: delivered ÷ booked plays", auto: "file", aliases: ["popmatch", "proofofplay", "deliveryrate"] },
  uptimePct: { label: "Screen uptime", group: "trust", from: "Proof-of-play report: screen-days with plays", auto: "file", aliases: ["uptime"] },
  ivtPct: { label: "Invalid traffic", group: "trust", from: "Verification vendor (IAS, DoubleVerify) or the SSP", auto: "manual", aliases: ["ivt", "invalidtraffic"] },
  safetyIncidents: { label: "Brand-safety incidents", group: "trust", from: "Media owner or verification vendor", auto: "manual", aliases: ["incidents", "brandsafety"] },
  verifiedPct: { label: "Independently verified", group: "trust", from: "Verification vendor", auto: "manual", aliases: ["verified", "verification"] },
  freshnessHours: { label: "Data freshness", group: "trust", from: "Hours between a play and its data reaching your report", auto: "manual", aliases: ["freshness", "latency", "datalatency"] },
};

export const NUM_KEYS = Object.keys(FIELDS) as NumKey[];

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

const ALIAS = new Map<string, NumKey>();
for (const k of NUM_KEYS) for (const a of [k, FIELDS[k].label, ...(FIELDS[k].aliases ?? [])]) ALIAS.set(norm(a), k);
export const fieldFor = (name: string) => ALIAS.get(norm(name));

/* ---------- parsing ---------- */

/** RFC 4180-style CSV. Detects comma, semicolon or tab from the first line; handles quotes and a BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = [",", ";", "\t"].map((d) => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') (cell += '"'), i++;
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delim) row.push(cell), (cell = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell), rows.push(row), (row = []), (cell = "");
    } else cell += ch;
  }
  if (cell !== "" || row.length) row.push(cell), rows.push(row);
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
}

/** "$1,234.50", "62%", "1 200" → number; anything else → null. */
export function toNumber(s: string | number | null | undefined): number | null {
  if (typeof s === "number") return Number.isFinite(s) ? s : null;
  if (s == null) return null;
  const t = String(s).replace(/[\s,$€£₹¥%]/g, "");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return null;
  return Number(t);
}

const TRUE = new Set(["1", "yes", "y", "true", "t", "x"]);
const truthy = (s: string) => TRUE.has(s.toLowerCase()) || (toNumber(s) ?? 0) > 0;

const EXPOSED = new Set(["exposed", "test", "treatment", "treated", "exposedgroup", "testgroup", "1", "true", "yes"]);
const CONTROL = new Set(["control", "holdout", "unexposed", "controlgroup", "baseline", "0", "false", "no"]);
const BEFORE = new Set(["before", "pre", "precampaign", "baseline", "prior", "base"]);
const DURING = new Set(["during", "campaign", "flight", "live", "in", "incampaign", "inflight"]);

/** Column index whose header matches one of the names, or -1. */
function col(headers: string[], names: string[]) {
  const h = headers.map(norm);
  for (const n of names) {
    const i = h.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

const COLS = {
  screen: ["screen", "screenid", "frame", "frameid", "display", "displayid", "player", "playerid", "venueid", "siteid", "faceid", "panelid"],
  plays: ["plays", "spots", "playcount", "adplays", "spotcount", "count"],
  impressions: ["impressions", "imps", "audience", "audienceimpressions", "contacts", "impacts"],
  spend: ["spend", "cost", "mediacost", "netspend"],
  booked: ["booked", "bookedplays", "scheduled", "scheduledplays", "planned", "plannedplays", "ordered"],
  date: ["date", "day", "timestamp", "playedat", "datetime", "time", "week", "weekstart", "weekof"],
  group: ["group", "cell", "arm", "variant", "testcontrol", "exposure", "exposed", "condition"],
  phase: ["phase", "period", "flight", "campaignperiod", "window"],
  search: ["brandedsearches", "brandedsearch", "searches", "search", "searchvolume"],
  sessions: ["sessions", "websessions", "visitsweb", "users"],
  installs: ["installs", "appinstalls", "downloads"],
  converted: ["converted", "conversion", "conversions", "purchased", "purchase", "converter", "outcome"],
  visited: ["visited", "storevisit", "storevisits", "visit", "visits", "footfall"],
  aware: ["aware", "awareness", "aided", "aidedawareness"],
  consider: ["consider", "consideration", "considering"],
  intent: ["intent", "purchaseintent", "wouldbuy", "intendtobuy"],
};

/** Day key (YYYY-MM-DD) for a date cell, or null. ISO dates are read as written; others through Date.parse. */
export function dayKey(s: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return iso[0];
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const dayNum = (k: string) => Math.round(Date.parse(k + "T00:00:00Z") / 86_400_000);

export type ImportKind = "summary" | "pop" | "halo" | "groups";
export type Imported = { kind: ImportKind; title: string; values: Partial<Inputs>; notes: string[] };

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const pctOf = (a: number, b: number) => (b ? round((a / b) * 100) : 0);

/** One value per input: rows of "field,value" (any header), or a header row of field names over one row of values. */
function importSummary(rows: string[][]): Imported | null {
  const values: Partial<Inputs> = {};
  const notes: string[] = [];
  const set = (name: string, raw: string) => {
    if (/^campaign(name)?$/.test(norm(name))) {
      if (raw) values.campaign = raw;
      return true;
    }
    const k = fieldFor(name);
    if (!k) return false;
    const n = toNumber(raw);
    if (n === null || n < 0) notes.push(`"${FIELDS[k].label}" skipped: "${raw}" isn't a number`);
    else values[k] = n;
    return true;
  };
  // Long: first column names the field.
  if (rows.some((r) => r.length >= 2 && fieldFor(r[0]) && toNumber(r[1]) !== null)) {
    const unknown: string[] = [];
    rows.forEach((r, i) => {
      if (r.length < 2) return;
      if (!set(r[0], r[1]) && i > 0) unknown.push(r[0]);
    });
    if (unknown.length) notes.push(`Not recognised, so ignored: ${unknown.slice(0, 6).join(", ")}${unknown.length > 6 ? ` and ${unknown.length - 6} more` : ""}`);
    return Object.keys(values).length ? { kind: "summary", title: "Summary figures", values, notes } : null;
  }
  // Wide: header row of field names, values in the next row.
  if (rows.length >= 2 && rows[0].filter((h) => fieldFor(h)).length >= 2) {
    rows[0].forEach((h, i) => set(h, rows[1][i] ?? ""));
    if (rows.length > 2) notes.push(`Read the first data row only; ${rows.length - 2} more ignored`);
    return { kind: "summary", title: "Summary figures", values, notes };
  }
  return null;
}

/** Proof-of-play log: a row per play, or per screen and day. */
function importPop(h: string[], data: string[][]): Imported | null {
  const c = Object.fromEntries((["screen", "plays", "impressions", "spend", "booked", "date"] as const).map((k) => [k, col(h, COLS[k])])) as Record<"screen" | "plays" | "impressions" | "spend" | "booked" | "date", number>;
  if (c.screen < 0 || (c.plays < 0 && c.date < 0)) return null;
  const screens = new Set<string>();
  const screenDays = new Set<string>();
  const days = new Set<string>();
  let plays = 0, imps = 0, spend = 0, booked = 0, bad = 0;
  for (const r of data) {
    const id = r[c.screen];
    if (!id) continue;
    const p = c.plays >= 0 ? toNumber(r[c.plays]) : 1;
    if (p === null) {
      bad++;
      continue;
    }
    screens.add(id);
    plays += p;
    if (c.impressions >= 0) imps += toNumber(r[c.impressions]) ?? 0;
    if (c.spend >= 0) spend += toNumber(r[c.spend]) ?? 0;
    if (c.booked >= 0) booked += toNumber(r[c.booked]) ?? 0;
    const d = c.date >= 0 ? dayKey(r[c.date]) : null;
    if (d) {
      days.add(d);
      if (p > 0) screenDays.add(`${id}|${d}`);
    }
  }
  if (!screens.size) return null;
  const values: Partial<Inputs> = { screens: screens.size, plays };
  const notes: string[] = [`${screens.size.toLocaleString("en-US")} screens, ${data.length.toLocaleString("en-US")} rows`];
  if (c.impressions >= 0) values.impressions = Math.round(imps);
  if (c.spend >= 0) values.spend = round(spend);
  if (c.booked >= 0 && booked > 0) values.popMatchPct = Math.min(100, pctOf(plays, booked));
  if (days.size) {
    const nums = [...days].map(dayNum);
    const span = Math.max(...nums) - Math.min(...nums) + 1;
    values.uptimePct = pctOf(screenDays.size, screens.size * span);
    values.weeks = Math.max(1, Math.ceil(span / 7));
    notes.push(`${span} days of plays, so ${values.weeks} campaign weeks; uptime is screen-days with at least one play`);
  }
  if (c.booked < 0) notes.push("No booked-plays column, so proof-of-play match wasn't calculated");
  if (bad) notes.push(`${bad} rows skipped: plays wasn't a number`);
  return { kind: "pop", title: "Proof-of-play log", values, notes };
}

/** Weekly channel numbers tagged before or during the flight. */
function importHalo(h: string[], data: string[][]): Imported | null {
  const phase = col(h, COLS.phase);
  const metrics = (["search", "sessions", "installs"] as const).map((k) => [k, col(h, COLS[k])] as const).filter(([, i]) => i >= 0);
  if (phase < 0 || !metrics.length) return null;
  const sums = { before: {} as Record<string, number>, during: {} as Record<string, number> };
  const n = { before: 0, during: 0 };
  let other = 0;
  for (const r of data) {
    const p = norm(r[phase] ?? "");
    const at = BEFORE.has(p) ? "before" : DURING.has(p) ? "during" : null;
    if (!at) {
      other++;
      continue;
    }
    n[at]++;
    for (const [k, i] of metrics) sums[at][k] = (sums[at][k] ?? 0) + (toNumber(r[i]) ?? 0);
  }
  if (!n.before || !n.during) return null;
  const avg = (at: "before" | "during", k: string) => Math.round((sums[at][k] ?? 0) / n[at]);
  const values: Partial<Inputs> = { weeks: n.during };
  const keys = { search: ["searchBase", "searchCampaign"], sessions: ["sessionsBase", "sessionsCampaign"], installs: ["installsBase", "installsCampaign"] } as const;
  for (const [k] of metrics) {
    values[keys[k][0]] = avg("before", k);
    values[keys[k][1]] = avg("during", k);
  }
  const notes = [`Weekly averages of ${n.before} weeks before and ${n.during} weeks during`];
  if (other) notes.push(`${other} rows ignored: phase wasn't "before" or "during"`);
  return { kind: "halo", title: "Weekly channel data", values, notes };
}

/** One row per person or device, tagged exposed or control, with yes/no outcomes. */
function importGroups(h: string[], data: string[][]): Imported | null {
  const g = col(h, COLS.group);
  const o = Object.fromEntries((["converted", "visited", "aware", "consider", "intent"] as const).map((k) => [k, col(h, COLS[k])])) as Record<"converted" | "visited" | "aware" | "consider" | "intent", number>;
  if (g < 0 || Object.values(o).every((i) => i < 0)) return null;
  const rows = { exposed: [] as string[][], control: [] as string[][] };
  let other = 0;
  for (const r of data) {
    const v = norm(r[g] ?? "");
    if (EXPOSED.has(v)) rows.exposed.push(r);
    else if (CONTROL.has(v)) rows.control.push(r);
    else other++;
  }
  const E = rows.exposed.length, C = rows.control.length;
  if (!E || !C) return null;
  const count = (rs: string[][], i: number) => rs.filter((r) => truthy(r[i] ?? "")).length;
  const values: Partial<Inputs> = {};
  const notes = [`${E.toLocaleString("en-US")} exposed and ${C.toLocaleString("en-US")} control rows`];
  const parts: string[] = [];
  if (o.converted >= 0) {
    Object.assign(values, { testN: E, testConv: count(rows.exposed, o.converted), controlN: C, controlConv: count(rows.control, o.converted) });
    parts.push("holdout test");
  }
  if (o.visited >= 0) {
    const visitors = rows.exposed.filter((r) => truthy(r[o.visited] ?? ""));
    Object.assign(values, { matchedDevices: E + C, exposedVisitPct: pctOf(visitors.length, E), controlVisitPct: pctOf(count(rows.control, o.visited), C) });
    const counts = visitors.map((r) => toNumber(r[o.visited]) ?? 1);
    if (counts.some((x) => x > 1)) values.repeatVisits = round(counts.reduce((s, x) => s + x, 0) / counts.length);
    parts.push("footfall");
  }
  const brand = [["aware", "awarenessExposed", "awarenessControl"], ["consider", "considerationExposed", "considerationControl"], ["intent", "intentExposed", "intentControl"]] as const;
  if (brand.some(([k]) => o[k] >= 0)) {
    for (const [k, ex, ct] of brand) if (o[k] >= 0) Object.assign(values, { [ex]: pctOf(count(rows.exposed, o[k]), E), [ct]: pctOf(count(rows.control, o[k]), C) });
    values.surveyN = Math.min(E, C);
    if (E !== C) notes.push(`Groups differ in size; respondents per group uses the smaller (${Math.min(E, C).toLocaleString("en-US")}), the cautious choice`);
    parts.push("brand survey");
  }
  if (other) notes.push(`${other} rows ignored: group wasn't exposed/test or control/holdout`);
  return { kind: "groups", title: `Exposed vs control: ${parts.join(", ")}`, values, notes };
}

/** Read one file's text. Returns what it found, or a plain-language reason it couldn't. */
export function importText(text: string, fileName = ""): Imported | { error: string } {
  if (/\.(xlsx?|numbers|ods)$/i.test(fileName)) return { error: "Spreadsheet files can't be read directly. Save it as CSV (File → Save as → CSV) and upload that." };
  const t = text.trim();
  if (!t) return { error: "The file is empty." };
  if (t.startsWith("{")) {
    try {
      const obj = JSON.parse(t) as Record<string, unknown>;
      const src = obj && typeof obj.inputs === "object" && obj.inputs ? (obj.inputs as Record<string, unknown>) : obj;
      const res = importSummary(Object.entries(src).map(([k, v]) => [k, String(v)]));
      return res ?? { error: "No DoohSight inputs found in this JSON." };
    } catch {
      return { error: "This looks like JSON but couldn't be read." };
    }
  }
  const rows = parseCsv(t);
  if (!rows.length) return { error: "No rows found." };
  const [h, ...data] = rows;
  const found = importGroups(h, data) ?? importHalo(h, data) ?? importPop(h, data) ?? importSummary(rows);
  return (
    found ?? {
      error: `Couldn't tell what this file is. Columns found: ${h.slice(0, 8).join(", ")}. Use the summary template, or one of the column layouts listed below.`,
    }
  );
}

/** The current inputs as a CSV that imports back: also the template. */
export function toCsv(inputs: Inputs) {
  const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = ["field,value,label,where it comes from", `campaign,${q(inputs.campaign)},Campaign name,`];
  for (const k of NUM_KEYS) lines.push([k, String(inputs[k]), q(FIELDS[k].label), q(FIELDS[k].from)].join(","));
  return lines.join("\n") + "\n";
}

/** Fields an import would change, with before and after. */
export function diff(current: Inputs, values: Partial<Inputs>) {
  return (Object.keys(values) as (keyof Inputs)[]).filter((k) => values[k] !== current[k]).map((k) => ({ key: k, from: current[k], to: values[k] as number | string }));
}


/** The four layouts DoohSight reads, each with a small example file people can download and copy. */
export const LAYOUTS: { kind: ImportKind; title: string; from: string; columns: string; fills: string; file: string; example: string }[] = [
  {
    kind: "summary",
    title: "Summary figures",
    from: "Any report, or typed into the template",
    columns: "field, value (one row per input, names as in the template)",
    fills: "Any input",
    file: "doohsight-summary-example.csv",
    example: "field,value\ncampaign,Spring Launch\nspend,$120000\nscreens,300\nimpressions,6400000\nreach,1300000\nviewable,58%\nattentive,35%\nmargin,55%\n",
  },
  {
    kind: "pop",
    title: "Proof-of-play log",
    from: "Media owner or SSP",
    columns: "screen_id, date, plays · optional: impressions, spend, booked_plays",
    fills: "Screens, plays, impressions, spend, proof-of-play match, screen uptime, campaign weeks",
    file: "doohsight-proof-of-play-example.csv",
    example: [
      "screen_id,date,plays,impressions,spend,booked_plays",
      "LDN-001,2026-09-01,120,940,48.00,120",
      "LDN-001,2026-09-02,118,910,47.20,120",
      "LDN-001,2026-09-03,120,960,48.00,120",
      "LDN-002,2026-09-01,96,700,38.40,100",
      "LDN-002,2026-09-02,0,0,0,100",
      "LDN-002,2026-09-03,100,760,40.00,100",
      "LDN-003,2026-09-01,140,1210,56.00,140",
      "LDN-003,2026-09-02,140,1180,56.00,140",
      "LDN-003,2026-09-03,139,1230,55.60,140",
    ].join("\n") + "\n",
  },
  {
    kind: "halo",
    title: "Weekly channel data",
    from: "Google Ads or Search Console, GA4, your app store console or MMP",
    columns: "week, phase (before or during) · any of: branded_searches, sessions, installs",
    fills: "Branded search, web sessions and app installs before and during, campaign weeks",
    file: "doohsight-weekly-example.csv",
    example: [
      "week,phase,branded_searches,sessions,installs",
      "2026-08-04,before,11800,39500,1950",
      "2026-08-11,before,12100,40200,2010",
      "2026-08-18,before,12050,40100,2040",
      "2026-09-01,during,15200,46100,2550",
      "2026-09-08,during,15900,47600,2620",
      "2026-09-15,during,15700,47300,2630",
    ].join("\n") + "\n",
  },
  {
    kind: "groups",
    title: "Exposed vs control, one row per person or device",
    from: "Holdout test, location data partner or brand-lift survey vendor",
    columns: "group (exposed or control) · any of: converted, visited or visits, aware, consider, intent (yes/no or 1/0)",
    fills: "Incrementality test, footfall visit rates and repeat visits, brand-lift percentages and respondents",
    file: "doohsight-exposed-control-example.csv",
    example: [
      "id,group,converted,visits,aware,consider,intent",
      "1,exposed,1,2,yes,yes,yes",
      "2,exposed,0,0,yes,no,no",
      "3,exposed,1,3,yes,yes,no",
      "4,exposed,0,1,no,no,no",
      "5,exposed,0,0,yes,yes,no",
      "6,control,0,0,no,no,no",
      "7,control,1,1,yes,yes,yes",
      "8,control,0,0,no,no,no",
      "9,control,0,0,yes,no,no",
      "10,control,0,0,no,no,no",
    ].join("\n") + "\n",
  },
];
