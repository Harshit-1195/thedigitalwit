// Pure helpers for the Contextual Signal Generator: input checks, sentiment labels
// and the overview numbers. No network and no React, so they can be unit-tested.
import type { Overview, Sentiment, TrendPoint } from "./types";

export const MAX_KEYWORD = 80;

/** Strips control characters and trims. Returns null when the result is not 1–80 characters. */
export function cleanKeyword(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  // eslint-disable-next-line no-control-regex
  const k = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  return k.length >= 1 && k.length <= MAX_KEYWORD ? k : null;
}

/** Lexicon score -> label. Thresholds: above +1 positive, below -1 negative. */
export const label = (score: number): Sentiment => (score > 1 ? "positive" : score < -1 ? "negative" : "neutral");

/** Text to score: the title plus the first 280 characters of the body, when there is one. */
export const scoringText = (title: string, body?: string | null) => (body ? `${title} ${body.slice(0, 280)}` : title);

/** "positive lean" at 55 or above, "negative lean" at 45 or below, otherwise "mixed". */
export const lean = (score: number) => (score >= 55 ? "positive lean" : score <= 45 ? "negative lean" : "mixed");

export function breakdown(items: { sentiment: Sentiment }[]): Record<Sentiment, number> {
  const n = items.length;
  const count = (s: Sentiment) => items.filter((i) => i.sentiment === s).length;
  if (!n) return { positive: 0, neutral: 0, negative: 0 };
  const positive = Math.round((count("positive") / n) * 100);
  const negative = Math.round((count("negative") / n) * 100);
  return { positive, negative, neutral: Math.max(0, 100 - positive - negative) };
}

export function overview(scored: { sentiment: Sentiment }[], mentions: number, trend: TrendPoint[] | null): Overview {
  const pos = scored.filter((s) => s.sentiment === "positive").length;
  const neg = scored.filter((s) => s.sentiment === "negative").length;
  const sentimentScore = pos + neg ? Math.round((pos / (pos + neg)) * 100) : scored.length ? 50 : null;

  let mentionsDelta: number | null = null;
  let searchInterest: number | null = null;
  let trendDirection: Overview["trendDirection"] = null;
  if (trend && trend.length >= 2) {
    const avg = (xs: TrendPoint[]) => xs.reduce((s, p) => s + p.value, 0) / (xs.length || 1);
    const last = trend.slice(-7);
    const prev = trend.slice(-14, -7);
    searchInterest = Math.round(avg(last));
    if (prev.length) {
      const p = avg(prev);
      mentionsDelta = p ? Math.round(((avg(last) - p) / p) * 100) : avg(last) ? 100 : 0;
      trendDirection = mentionsDelta > 10 ? "rising" : mentionsDelta < -10 ? "falling" : "steady";
    }
  }
  return { sentimentScore, mentions, mentionsDelta, searchInterest, trendDirection };
}

/** Removes HTML tags and character references, collapsing whitespace. */
export const stripHtml = (s: string) => decodeXml(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

/** GDELT seendate "20261026T050000Z" -> ISO string. */
export function gdeltDate(s: unknown): string | null {
  const m = typeof s === "string" && s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
}

/** True when every word of the keyword appears in the text (case-insensitive). Filters loose search matches. */
export function mentionsKeyword(keyword: string, ...fields: (string | null | undefined)[]) {
  const hay = fields.filter(Boolean).join(" ").toLowerCase();
  return keyword
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

/* ---------- RSS / Atom ----------
   The feeds used here are small and regular, so a few patterns are enough; no XML library needed. */
const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Decodes CDATA, named and numeric character references. */
export function decodeXml(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : "";
      }
      return NAMED[e.toLowerCase()] ?? m;
    });
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The inner XML of every <item> (RSS) or <entry> (Atom). */
export const xmlBlocks = (xml: string, tag: "item" | "entry") => [...xml.matchAll(new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, "g"))].map((m) => m[0]);

/** Decoded text of the first <name> element in a block, or null. */
export function xmlText(block: string, name: string) {
  const m = block.match(new RegExp(`<${esc(name)}(?:\\s[^>]*)?>([\\s\\S]*?)</${esc(name)}>`));
  return m ? decodeXml(m[1]).trim() : null;
}

/** An attribute of the first <name> element in a block, or null. */
export function xmlAttr(block: string, name: string, attr: string) {
  const m = block.match(new RegExp(`<${esc(name)}\\s[^>]*?\\b${esc(attr)}="([^"]*)"`));
  return m ? decodeXml(m[1]) : null;
}

/** Any date string -> ISO, or null. */
export const isoDate = (s: string | null) => {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

/** Lower-cased title without punctuation, for spotting the same story from two sources. */
export const titleKey = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Google suggest answers ["query", ["s1", "s2", …], …]. Returns the suggestions minus the query itself, de-duplicated. */
export function parseSuggest(body: unknown, query: string, max: number) {
  const list = Array.isArray(body) && Array.isArray(body[1]) ? (body[1] as unknown[]) : [];
  const q = query.trim().toLowerCase();
  const seen = new Set<string>();
  return list
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter((s) => {
      const k = s.toLowerCase();
      return s && k !== q && !seen.has(k) && !!seen.add(k);
    })
    .slice(0, max);
}
