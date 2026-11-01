// "Describe your case": turns a sentence into form values for any tool.
// A tool describes its fields once (AiSpec). Claude reads the sentence when the site has a key
// (api/ai-fill); otherwise, or if that fails, basicFill() reads it in the browser with simple rules.
// Both paths end in coerce(), so values are checked the same way whoever produced them.

export type Unit = "money" | "percent" | "multiple" | "count" | "seconds" | "hours" | "weeks";
export type Option = { value: string; label: string; aliases?: string[] };

export type AiField = {
  key: string;
  label: string;
  type: "number" | "choice" | "multi" | "text" | "date";
  unit?: Unit;
  options?: Option[];
  /** Extra words that name this field, for the built-in reader. */
  aliases?: string[];
  /** One line for Claude on how to fill it. */
  hint?: string;
  /** Takes a money amount nobody named, e.g. "$40k to spend" is the budget. */
  primary?: boolean;
  /** A yearly amount: "a month" is multiplied by 12, "a quarter" by 4. */
  annual?: boolean;
  /** Converted to US dollars when another currency is used (built-in reader only; rates in `rates`). */
  usd?: boolean;
};

export type AiSpec = { id: string; title: string; about: string; fields: AiField[]; examples: string[]; rates?: Record<string, number> };

export type FillValue = number | string | string[];
export type Filled = Record<string, FillValue>;
export type FillResult = { values: Filled; note: string; mode: "ai" | "basic" };
export type Pair = { field: string; value: string };

export const MAX_TEXT = 1500;

/* ---------- numbers ---------- */
const MULT: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, mn: 1e6, mm: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9, lakh: 1e5, lakhs: 1e5, lac: 1e5, crore: 1e7, crores: 1e7, cr: 1e7 };

/** "$40k", "1.2 million", "15%", "2.5x", "3 lakh", "1,200,000" → number. */
export function parseAmount(s: string): number | null {
  const m = /^\s*[-+]?[$€£₹¥]?\s*(\d[\d,]*(?:\.\d+)?|\.\d+)(?:\s*(k|thousand|m|mn|mm|million|b|bn|billion|lakhs?|lac|crores?|cr)\b)?/i.exec(s.replace(/^(usd|eur|gbp|inr|aed)\s*/i, ""));
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, "")) * (m[2] ? MULT[m[2].toLowerCase()] : 1);
  return Number.isFinite(n) ? (s.trim().startsWith("-") ? -n : n) : null;
}

type Num = { at: number; end: number; value: number; kind: "money" | "percent" | "multiple" | "plain"; big: boolean; currency?: string; per: number };
const SYMBOL: Record<string, string> = { $: "USD", "€": "EUR", "£": "GBP", "₹": "INR", "¥": "JPY", usd: "USD", dollar: "USD", dollars: "USD", eur: "EUR", euro: "EUR", euros: "EUR", gbp: "GBP", pound: "GBP", pounds: "GBP", inr: "INR", rupee: "INR", rupees: "INR" };
const PER_RE = /^\s*(?:a|per|\/|each|every)?\s*(month|mo|quarter|week|year|yr|annum)\b|^\s*(monthly|quarterly|weekly|annually|yearly)\b/;
const PER: Record<string, number> = { month: 12, mo: 12, monthly: 12, quarter: 4, quarterly: 4, week: 52, weekly: 52, year: 1, yr: 1, annum: 1, annually: 1, yearly: 1 };
const NUM_RE = /([$€£₹¥])?\s?(\d[\d,]*(?:\.\d+)?|\.\d+)(?:\s?(k|thousand|m|mn|mm|million|bn|billion|lakhs?|lac|crores?|cr)\b)?\s?(%|percent\b|x\b|times\b|usd\b|dollars?\b|eur\b|euros?\b|gbp\b|pounds?\b|inr\b|rupees?\b)?/gi;

function numbersIn(text: string): Num[] {
  const out: Num[] = [];
  for (const m of text.matchAll(NUM_RE)) {
    const at = m.index!;
    // Skip parts of dates (2026-09-01) and words with digits.
    if (/[-/]\d/.test(text.slice(at + m[0].length, at + m[0].length + 2)) || /[\d/-]$/.test(text.slice(0, at)) && !m[1]) continue;
    const value = Number(m[2].replace(/,/g, "")) * (m[3] ? MULT[m[3].toLowerCase()] : 1);
    const tail = (m[4] ?? "").toLowerCase();
    const kind = tail === "%" || tail === "percent" ? "percent" : tail === "x" || tail === "times" ? "multiple" : m[1] || tail ? "money" : "plain";
    const mult = (m[3] ?? "").toLowerCase();
    const currency = SYMBOL[(m[1] ?? "").toLowerCase()] ?? SYMBOL[tail] ?? (/^(lakhs?|lac|crores?|cr)$/.test(mult) ? "INR" : undefined);
    const end = at + m[0].trimEnd().length;
    const p = PER_RE.exec(text.slice(end, end + 20));
    out.push({ at, end, value, kind, big: !!mult, currency, per: p ? PER[p[1] ?? p[2]] : 1 });
  }
  return out;
}

/* ---------- matching words ---------- */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = (w: string) => new RegExp(`(^|[^a-z0-9])${esc(w.toLowerCase())}(?=$|[^a-z0-9])`, "g");
/** Positions where a phrase appears as whole words. */
function find(text: string, phrase: string) {
  const out: { at: number; end: number }[] = [];
  if (!phrase.trim()) return out;
  // Symbols such as "€" have no word edges; match them anywhere.
  if (!/[a-z0-9]/i.test(phrase)) {
    for (let i = text.indexOf(phrase); i >= 0; i = text.indexOf(phrase, i + 1)) out.push({ at: i, end: i + phrase.length });
    return out;
  }
  for (const m of text.matchAll(wordRe(phrase))) out.push({ at: m.index! + m[1].length, end: m.index! + m[0].length });
  return out;
}

function findExact(text: string, word: string) {
  return [...text.matchAll(new RegExp(`(^|[^A-Za-z0-9])${esc(word)}(?=$|[^A-Za-z0-9])`, "g"))].map((m) => ({ at: m.index! + m[1].length, end: m.index! + m[0].length }));
}

/** Names a field goes by: its label, the short form in brackets, the key and any aliases. */
function namesOf(f: AiField) {
  const base = f.label.toLowerCase();
  const names = new Set([base, base.replace(/\s*\(.*?\)\s*/g, " ").trim(), ...(f.aliases ?? []).map((a) => a.toLowerCase())]);
  const bracket = /\(([^)]+)\)/.exec(f.label)?.[1];
  if (bracket) names.add(bracket.toLowerCase());
  const short = /^([A-Za-z]{2,6})\s*\(/.exec(f.label)?.[1];
  if (short) names.add(short.toLowerCase());
  if (/^[a-z]+$/i.test(f.key) && f.key.length > 2) names.add(f.key.toLowerCase());
  for (const n of [...names]) if (/\bspend\b/.test(n)) names.add(n.replace(/\bspend\b/, "spent"));
  return [...names].filter((n) => n.length > 1);
}
// An alias written "=US" only matches that exact case, so "US" counts but "us" (the pronoun) doesn't.
const optionNames = (o: Option) => [o.label, o.value, ...(o.aliases ?? [])].map((s) => (s.startsWith("=") ? s : s.toLowerCase()));

const fits = (f: AiField, n: Num) =>
  f.unit === "percent" ? n.kind === "percent" || n.kind === "plain" : f.unit === "multiple" ? n.kind !== "percent" : f.unit === "money" ? n.kind !== "percent" && n.kind !== "multiple" : n.kind === "plain" || (n.kind === "money" && !f.unit);

/* ---------- dates ---------- */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DATE_RE = /\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi;
const pad = (n: number) => String(n).padStart(2, "0");
function datesIn(text: string) {
  const out: { at: number; end: number; iso: string }[] = [];
  for (const m of text.matchAll(DATE_RE)) {
    const iso = m[1] ? `${m[1]}-${m[2]}-${m[3]}` : m[4] ? `${m[6]}-${pad(MONTHS.indexOf(m[5].slice(0, 3).toLowerCase()) + 1)}-${pad(+m[4])}` : `${m[9]}-${pad(MONTHS.indexOf(m[7].slice(0, 3).toLowerCase()) + 1)}-${pad(+m[8])}`;
    if (isDay(iso)) out.push({ at: m.index!, end: m.index! + m[0].length, iso });
  }
  return out;
}
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;

/* ---------- coerce: one checked value per field, from Claude or the built-in reader ---------- */
function pickOption(f: AiField, v: string) {
  const t = v.trim().toLowerCase();
  return f.options?.find((o) => o.value.toLowerCase() === t || o.label.toLowerCase() === t || (o.aliases ?? []).some((a) => a.toLowerCase() === t))?.value;
}

export function coerce(spec: AiSpec, pairs: Pair[]): Filled {
  const out: Filled = {};
  for (const { field, value } of pairs) {
    const f = spec.fields.find((x) => x.key === field);
    if (!f || typeof value !== "string") continue;
    if (f.type === "number") {
      const n = parseAmount(value);
      if (n !== null && n >= 0 && !(f.unit === "percent" && n > 100)) out[f.key] = n;
    } else if (f.type === "choice") {
      const o = pickOption(f, value);
      if (o) out[f.key] = o;
    } else if (f.type === "multi") {
      const vals = value.split(/\s*[,;]\s*/).map((v) => pickOption(f, v)).filter((x): x is string => !!x);
      if (vals.length) out[f.key] = [...new Set([...((out[f.key] as string[]) ?? []), ...vals])];
    } else if (f.type === "date") {
      if (isDay(value.trim())) out[f.key] = value.trim();
    } else if (value.trim()) out[f.key] = value.trim().slice(0, 200);
  }
  return out;
}

/* ---------- the built-in reader ---------- */
export function basicFill(spec: AiSpec, input: string): FillResult {
  const converted: string[] = [];
  const amount = (f: AiField, n: Num) => {
    let v = n.value * (f.annual ? n.per : 1);
    if (f.usd && n.currency && n.currency !== "USD" && spec.rates?.[n.currency]) {
      v = Math.round(v / spec.rates[n.currency]);
      converted.push(n.currency);
    }
    return v;
  };
  const text = input.toLowerCase().slice(0, MAX_TEXT);
  const pairs: Pair[] = [];
  const nums = numbersIn(text);
  const used = new Set<Num>();
  const taken: { at: number; end: number }[] = [];
  const overlaps = (a: { at: number; end: number }) => taken.some((b) => a.at < b.end && b.at < a.end);
  // Dates first, so their digits aren't read as amounts.
  const dates = datesIn(text);
  for (const d of dates) for (const n of nums) if (n.at >= d.at && n.at < d.end) used.add(n);

  // Choices: the longest matching option name wins, so "north america" beats "america".
  for (const f of spec.fields.filter((x) => x.type === "choice" || x.type === "multi")) {
    const hits = f.options!
      .flatMap((o) => optionNames(o).flatMap((n) => (n.startsWith("=") ? findExact(input, n.slice(1)) : find(text, n)).map((h) => ({ ...h, o, len: n.length }))))
      .filter((h) => !overlaps(h))
      .sort((a, b) => b.len - a.len || a.at - b.at);
    if (!hits.length) continue;
    if (f.type === "choice") {
      pairs.push({ field: f.key, value: hits[0].o.value });
      taken.push(hits[0]);
    } else {
      const seen = new Set<string>();
      for (const h of hits) if (!overlaps(h) && !seen.has(h.o.value)) seen.add(h.o.value), taken.push(h), pairs.push({ field: f.key, value: h.o.value });
    }
  }

  // Numbers: the nearest unused amount to a field's name, after it ("budget of $40k") or just before ("40k budget").
  const numFields = spec.fields.filter((f) => f.type === "number");
  const cands: { f: AiField; n: Num; d: number }[] = [];
  for (const f of numFields)
    for (const name of namesOf(f))
      for (const h of find(text, name)) {
        for (const n of nums) {
          if (used.has(n) || !fits(f, n)) continue;
          const after = n.at >= h.end;
          const between = after ? text.slice(h.end, n.at) : text.slice(n.end, h.at);
          if (/[.;\n]/.test(between) || (/\band\b/.test(between) && between.length > 12)) continue;
          // "300 screens" binds tighter than "screens, 6.4M"; commas separate items in a list.
          const d = (after ? between.length + 1 : between.length) + (/,/.test(between) ? 15 : 0) + (f.unit === "percent" && n.kind !== "percent" ? 8 : 0);
          if (d <= 40) cands.push({ f, n, d: d - name.length / 100 });
        }
      }
  const done = new Set<string>();
  for (const c of cands.sort((a, b) => a.d - b.d)) {
    if (done.has(c.f.key) || used.has(c.n)) continue;
    done.add(c.f.key);
    used.add(c.n);
    pairs.push({ field: c.f.key, value: String(amount(c.f, c.n)) });
  }
  // A money amount no field claimed goes to the main money field ("$40k to spend", "3 lakh a month").
  const primary = numFields.find((f) => f.primary && !done.has(f.key));
  const spare = nums.find((n) => !used.has(n) && (n.kind === "money" || (n.kind === "plain" && n.big)));
  if (primary && spare) {
    used.add(spare);
    pairs.push({ field: primary.key, value: String(amount(primary, spare)) });
  }

  // Dates in order of the date fields; quoted text to the first text field.
  spec.fields.filter((f) => f.type === "date").forEach((f, i) => dates[i] && pairs.push({ field: f.key, value: dates[i].iso }));
  const quoted = /["“']([^"”']{2,80})["”']/.exec(input);
  const textField = spec.fields.find((f) => f.type === "text");
  if (quoted && textField) pairs.push({ field: textField.key, value: quoted[1] });

  const values = coerce(spec, pairs);
  const n = Object.keys(values).length;
  const fx = converted.length ? ` Converted ${[...new Set(converted)].join(", ")} to US dollars at the site's reference rates.` : "";
  return { values, mode: "basic", note: n ? `Read ${n} ${n === 1 ? "value" : "values"} from your description.${fx}` : "Couldn't find anything to fill in. Name each number, e.g. “budget $40k”." };
}

/* ---------- describing a spec to Claude ---------- */
export function describeSpec(spec: AiSpec) {
  const lines = spec.fields.map((f) => {
    const unit = f.unit ? `, ${f.unit === "percent" ? "percent 0-100" : f.unit}` : "";
    const opts = f.options ? ` One of: ${f.options.map((o) => `"${o.value}" (${o.label})`).join(", ")}.` : "";
    const how = f.type === "multi" ? " Several allowed: one entry per value." : f.type === "date" ? " Format YYYY-MM-DD." : "";
    return `- ${f.key} (${f.type}${unit}): ${f.label}.${opts}${how}${f.hint ? ` ${f.hint}` : ""}`;
  });
  return `${spec.title}: ${spec.about}\n\nFields:\n${lines.join("\n")}`;
}

/** JSON schema for Claude's answer: field/value pairs plus a short note. */
export function outputSchema(spec: AiSpec) {
  return {
    type: "object",
    properties: {
      values: {
        type: "array",
        items: {
          type: "object",
          properties: { field: { type: "string", enum: spec.fields.map((f) => f.key) }, value: { type: "string" } },
          required: ["field", "value"],
          additionalProperties: false,
        },
      },
      note: { type: "string" },
    },
    required: ["values", "note"],
    additionalProperties: false,
  };
}

/** Plain label for a filled value, for the "understood" list. */
export function show(spec: AiSpec, key: string, v: FillValue): string {
  const f = spec.fields.find((x) => x.key === key)!;
  const opt = (x: string) => f.options?.find((o) => o.value === x)?.label ?? x;
  if (Array.isArray(v)) return v.map(opt).join(", ");
  if (typeof v === "string") return opt(v);
  const s = v.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return f.unit === "money" ? `${s}` : f.unit === "percent" ? `${s}%` : f.unit === "multiple" ? `${s}x` : s;
}
