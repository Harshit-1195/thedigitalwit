import { NextResponse } from "next/server";
import Sentiment from "sentiment";
import googleTrends from "google-trends-api";
import { breakdown, cleanKeyword, gdeltDate, isoDate, label, mentionsKeyword, overview, parseSuggest, scoringText, stripHtml, titleKey, xmlAttr, xmlBlocks, xmlText } from "@/lib/context-signal/analyze";
import type { ContextResponse, ErrorResponse, NewsItem, RelatedTerm, SocialPost, Source, TrendPoint } from "@/lib/context-signal/types";

// google-trends-api needs Node APIs; it doesn't run on the Edge runtime.
export const runtime = "nodejs";

// Free, keyless sources only: GDELT, Google News RSS and Bing News RSS (news); Reddit RSS, Hacker News
// and Bluesky (social); Google Trends (search interest); Google search suggestions (related keywords).
const TIMEOUT_MS = 8000;
const UA = "thedigitalwit-contextual-signal/1.0 (+https://thedigitalwit.com)";
const DAY = 86_400_000;

// Rough lexicon score (AFINN). It reads words, not meaning, so sarcasm, slang and negation are handled poorly.
const scorer = new Sentiment();
const sentimentOf = (title: string, body?: string | null) => label(scorer.analyze(scoringText(title, body)).score);

/* ---------- cache and rate limit ----------
   Both live in this server instance's memory. On serverless hosting each instance has its own copy
   and they reset on cold starts, so they're best-effort. Shared storage (e.g. Upstash's free tier)
   is the upgrade path if that ever matters. */
const CACHE_TTL = 10 * 60_000;
const PARTIAL_TTL = 2 * 60_000;
const CACHE_MAX = 500;
const cache = new Map<string, { at: number; ttl: number; data: Omit<ContextResponse, "cached"> }>();
const RATE_MAX = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.delete(ip);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.delete(hits.keys().next().value as string);
  return recent.length > RATE_MAX;
}

/* ---------- fetching ---------- */
class SourceError extends Error {}

async function getJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "User-Agent": UA, Accept: "application/json", ...init.headers }, cache: "no-store" });
  if (!res.ok) throw Object.assign(new SourceError(`HTTP ${res.status}`), { status: res.status });
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SourceError("response was not JSON");
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const withTimeout = <T,>(p: Promise<T>) => Promise.race([p, sleep(TIMEOUT_MS).then(() => Promise.reject(new SourceError("timed out")))]);

// GDELT allows about one request every 5 seconds per client, so calls from this instance are spaced out.
let gdeltNext = 0;
async function gdeltSlot() {
  const wait = gdeltNext - Date.now();
  gdeltNext = Math.max(Date.now(), gdeltNext) + 5200;
  if (wait > 0) {
    if (wait > TIMEOUT_MS) throw new SourceError("GDELT queue is full");
    await sleep(wait);
  }
}

async function getText(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) throw Object.assign(new SourceError(`HTTP ${res.status}`), { status: res.status });
  return res.text();
}

/* ---------- news: GDELT, Google News RSS, Bing News RSS ---------- */
// After a failure GDELT is skipped for 2 minutes; the other news feeds cover for it and searches stay fast.
let gdeltPausedUntil = 0;

async function getGdelt(keyword: string): Promise<NewsItem[]> {
  if (Date.now() < gdeltPausedUntil) throw new SourceError("skipped after a recent failure");
  try {
    return await fetchGdelt(keyword);
  } catch (e) {
    gdeltPausedUntil = Date.now() + 120_000;
    throw e;
  }
}

async function fetchGdelt(keyword: string): Promise<NewsItem[]> {
  const q = new URLSearchParams({ query: /\s/.test(keyword) ? `"${keyword}"` : keyword, mode: "artlist", format: "json", maxrecords: "25", timespan: "7d", sort: "datedesc" });
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?${q}`;
  let data: unknown;
  for (let attempt = 0; ; attempt++) {
    await gdeltSlot();
    try {
      data = await getJson(url);
      break;
    } catch (e) {
      const status = (e as { status?: number }).status ?? 0;
      // One retry for rate limiting and server errors only.
      if (attempt === 0 && (status === 429 || status >= 500)) continue;
      // GDELT answers some valid-but-unusable queries (too short, too common) with plain text.
      if (e instanceof SourceError && e.message === "response was not JSON") return [];
      throw e;
    }
  }
  return ((data as { articles?: Record<string, string>[] }).articles ?? [])
    .filter((a) => a.url && a.title)
    .map((a) => {
      const title = a.title.replace(/\s+([.,:;!?)])/g, "$1").replace(/\(\s+/g, "(");
      return { title, source: a.domain || new URL(a.url).hostname, time: gdeltDate(a.seendate), sentiment: sentimentOf(title), snippet: null, url: a.url };
    });
}

async function getGoogleNews(keyword: string): Promise<NewsItem[]> {
  const q = new URLSearchParams({ q: `${keyword} when:7d`, hl: "en-US", gl: "US", ceid: "US:en" });
  const xml = await getText(`https://news.google.com/rss/search?${q}`);
  return xmlBlocks(xml, "item")
    .map((it) => {
      const source = xmlText(it, "source") || "Google News";
      // Titles end in " - Publisher"; the publisher is shown separately.
      const raw = xmlText(it, "title") || "";
      const title = raw.endsWith(` - ${source}`) ? raw.slice(0, -(source.length + 3)) : raw;
      return { title, source, time: isoDate(xmlText(it, "pubDate")), sentiment: sentimentOf(title), snippet: null, url: xmlText(it, "link") || "" };
    })
    .filter((n) => n.title && n.url.startsWith("https://"));
}

async function getBingNews(keyword: string): Promise<NewsItem[]> {
  const q = new URLSearchParams({ q: keyword, format: "rss", mkt: "en-US", setlang: "en-US" });
  const xml = await getText(`https://www.bing.com/news/search?${q}`);
  return xmlBlocks(xml, "item")
    .map((it) => {
      const title = xmlText(it, "title") || "";
      const snippet = xmlText(it, "description");
      const link = xmlText(it, "link") || "";
      // Bing wraps links in a click tracker; the article address is its url parameter.
      let url = link;
      try {
        url = new URL(link).searchParams.get("url") || link;
      } catch {}
      return { title, source: xmlText(it, "News:Source") || "Bing News", time: isoDate(xmlText(it, "pubDate")), sentiment: sentimentOf(title, snippet), snippet: snippet || null, url };
    })
    .filter((n) => n.title && /^https?:\/\//.test(n.url));
}

/* ---------- social: Reddit (RSS), Hacker News, Bluesky ---------- */
async function getReddit(keyword: string): Promise<SocialPost[]> {
  // Reddit's JSON search often blocks anonymous server requests; its RSS feed is still open.
  const q = new URLSearchParams({ q: keyword, sort: "new", t: "week", type: "link", limit: "25" });
  const xml = await getText(`https://www.reddit.com/search.rss?${q}`);
  return xmlBlocks(xml, "entry")
    .map((e) => {
      const title = xmlText(e, "title") || "";
      const body = stripHtml(xmlText(e, "content") || "").replace(/\s*submitted by\s+\/u\/[\s\S]*$/i, "").trim() || null;
      return {
        platform: "Reddit" as const,
        title,
        text: body ? body.slice(0, 280) : null,
        time: isoDate(xmlText(e, "published") || xmlText(e, "updated")),
        score: null,
        sentiment: sentimentOf(title, body),
        url: xmlAttr(e, "link", "href") || "",
      };
    })
    .filter((p) => p.title && p.url.startsWith("https://www.reddit.com/r/"));
}

async function getHackerNews(keyword: string): Promise<SocialPost[]> {
  const q = new URLSearchParams({ query: keyword, tags: "story", hitsPerPage: "20", numericFilters: `created_at_i>${Math.floor((Date.now() - 30 * DAY) / 1000)}` });
  const data = (await getJson(`https://hn.algolia.com/api/v1/search_by_date?${q}`)) as { hits?: Record<string, unknown>[] };
  return (data.hits ?? [])
    .filter((h) => h.title)
    .map((h) => {
      const title = String(h.title);
      const body = typeof h.story_text === "string" && h.story_text ? stripHtml(h.story_text) : null;
      return {
        platform: "Hacker News" as const,
        title,
        text: body ? body.slice(0, 280) : null,
        time: typeof h.created_at === "string" ? h.created_at : null,
        score: Number(h.points) || 0,
        sentiment: sentimentOf(title, body),
        url: `https://news.ycombinator.com/item?id=${encodeURIComponent(String(h.objectID))}`,
      };
    });
}

async function getBluesky(keyword: string): Promise<SocialPost[]> {
  const q = new URLSearchParams({ q: keyword, sort: "latest", limit: "25", lang: "en" });
  const data = (await getJson(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?${q}`)) as {
    posts?: { uri: string; author: { handle: string }; record: { text?: string; createdAt?: string }; likeCount?: number }[];
  };
  return (data.posts ?? [])
    .filter((p) => p.record?.text)
    .map((p) => {
      const text = String(p.record.text).replace(/\s+/g, " ").trim();
      return {
        platform: "Bluesky" as const,
        title: text.length > 200 ? `${text.slice(0, 199)}…` : text,
        text: null,
        time: isoDate(p.record.createdAt ?? null),
        score: Number(p.likeCount) || 0,
        sentiment: sentimentOf(text.slice(0, 280)),
        url: `https://bsky.app/profile/${encodeURIComponent(p.author.handle)}/post/${encodeURIComponent(p.uri.split("/").pop() ?? "")}`,
      };
    });
}

async function getTrends(keyword: string): Promise<{ trend: TrendPoint[]; top: RelatedTerm[]; rising: RelatedTerm[] }> {
  const opts = { keyword, startTime: new Date(Date.now() - 90 * DAY) };
  const parse = (s: string) => {
    try {
      return JSON.parse(s) as Record<string, unknown>;
    } catch {
      throw new SourceError("Google Trends returned a non-JSON page (usually rate limiting)");
    }
  };
  const iot = parse(await withTimeout(googleTrends.interestOverTime(opts))) as { default?: { timelineData?: { formattedAxisTime: string; value: number[] }[] } };
  const trend = (iot.default?.timelineData ?? []).map((p) => ({ date: p.formattedAxisTime, value: Number(p.value?.[0]) || 0 }));
  let top: RelatedTerm[] = [];
  let rising: RelatedTerm[] = [];
  try {
    const rq = parse(await withTimeout(googleTrends.relatedQueries(opts))) as { default?: { rankedList?: { rankedKeyword: { query: string; value: number; formattedValue: string }[] }[] } };
    const lists = rq.default?.rankedList ?? [];
    const map = (l?: { rankedKeyword: { query: string; value: number; formattedValue: string }[] }) =>
      (l?.rankedKeyword ?? []).slice(0, 10).map((k) => ({ query: k.query, value: k.formattedValue === "Breakout" ? ("Breakout" as const) : Number(k.value) || 0 }));
    top = map(lists[0]);
    rising = map(lists[1]);
  } catch (e) {
    console.warn(`[context] trends-related failed: ${(e as Error).message}`);
  }
  return { trend, top, rising };
}

/* ---------- related keywords: Google search suggestions ---------- */
async function getSuggestions(keyword: string): Promise<{ suggestions: string[]; comparisons: string[] }> {
  const ask = (q: string) => getJson(`https://suggestqueries.google.com/complete/search?${new URLSearchParams({ client: "firefox", hl: "en", gl: "us", ie: "utf-8", oe: "utf-8", q })}`);
  const [plain, vs] = await Promise.allSettled([ask(keyword), ask(`${keyword} vs`)]);
  if (plain.status === "rejected" && vs.status === "rejected") throw plain.reason;
  return {
    suggestions: plain.status === "fulfilled" ? parseSuggest(plain.value, keyword, 10) : [],
    comparisons: vs.status === "fulfilled" ? parseSuggest(vs.value, `${keyword} vs`, 8).filter((s) => / vs\.? /i.test(s)) : [],
  };
}

/* ---------- handler ---------- */
const err = (status: number, error: string) => NextResponse.json<ErrorResponse>({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const keyword = cleanKeyword(new URL(request.url).searchParams.get("keyword"));
  if (!keyword) return err(400, "Enter a keyword between 1 and 80 characters.");

  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "local").trim();
  if (rateLimited(ip)) return err(429, "Too many searches in a minute. Wait a moment and try again.");

  const key = keyword.toLowerCase();
  const hit = cache.get(key);
  const headers = { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300" };
  if (hit && Date.now() - hit.at < hit.ttl) return NextResponse.json<ContextResponse>({ ...hit.data, cached: true }, { headers: hit.data.unavailable.length ? { "Cache-Control": "no-store" } : headers });

  const [gdelt, google, bing, reddit, hn, bsky, trends, suggest] = await Promise.allSettled([
    getGdelt(keyword),
    getGoogleNews(keyword),
    getBingNews(keyword),
    getReddit(keyword),
    getHackerNews(keyword),
    getBluesky(keyword),
    getTrends(keyword),
    getSuggestions(keyword),
  ]);
  const failed = (name: string, r: PromiseSettledResult<unknown>) => {
    if (r.status === "rejected") console.warn(`[context] ${name} failed: ${(r.reason as Error)?.message ?? "unknown error"}`);
    return r.status === "rejected";
  };
  const value = <T,>(r: PromiseSettledResult<T[]>) => (r.status === "fulfilled" ? r.value : []);
  const unavailable: Source[] = [];
  // A section is unavailable only when every one of its sources failed.
  if ([failed("gdelt", gdelt), failed("google-news", google), failed("bing-news", bing)].every(Boolean)) unavailable.push("news");
  if ([failed("reddit", reddit), failed("hackernews", hn), failed("bluesky", bsky)].every(Boolean)) unavailable.push("social");
  if (failed("trends", trends)) unavailable.push("trends");
  if (failed("suggestions", suggest)) unavailable.push("keywords");
  if (unavailable.length === 4) return err(502, "We couldn't reach any data source right now. Try again in a few minutes.");

  // Same story from several outlets or feeds: keep the first, newest first.
  const seen = new Set<string>();
  const newsItems = [...value(gdelt), ...value(google), ...value(bing)]
    .sort((a, b) => (b.time ?? "").localeCompare(a.time ?? ""))
    .filter((n) => {
      const k = titleKey(n.title);
      return k && !seen.has(k) && !!seen.add(k);
    })
    .slice(0, 15);
  // Searches return loose matches (comments, other fields), so keep posts that name the keyword.
  const posts = [...value(reddit), ...value(hn), ...value(bsky)]
    .filter((p) => mentionsKeyword(keyword, p.title, p.text, p.url))
    .sort((a, b) => (b.time ?? "").localeCompare(a.time ?? ""));
  const t = trends.status === "fulfilled" ? trends.value : null;

  const data: Omit<ContextResponse, "cached"> = {
    keyword,
    generatedAt: new Date().toISOString(),
    overview: overview([...newsItems, ...posts], posts.length, t?.trend ?? null),
    news: newsItems,
    social: { breakdown: breakdown(posts), posts: posts.slice(0, 12) },
    trend: t?.trend ?? [],
    related: { top: t?.top ?? [], rising: t?.rising ?? [] },
    keywords: suggest.status === "fulfilled" ? suggest.value : { suggestions: [], comparisons: [] },
    unavailable,
  };
  // Partial answers are kept briefly so a source that was down gets retried soon.
  cache.delete(key);
  cache.set(key, { at: Date.now(), ttl: unavailable.length ? PARTIAL_TTL : CACHE_TTL, data });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
  return NextResponse.json<ContextResponse>({ ...data, cached: false }, { headers: unavailable.length ? { "Cache-Control": "no-store" } : headers });
}
