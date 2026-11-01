import { NextResponse } from "next/server";
import googleTrends from "google-trends-api";
import { isDay, latestPopulation, splitTrend, type PopClaim, type TrendPoint } from "@/lib/doohsight-market";

// google-trends-api needs Node APIs; it doesn't run on the Edge runtime.
export const runtime = "nodejs";

// Free, keyless sources only: Wikidata (population of a city or country) and Google Trends (branded search).
const TIMEOUT_MS = 8000;
const UA = "thedigitalwit-doohsight/1.0 (+https://thedigitalwit.com)";
const DAY = 86_400_000;

/* In-memory cache and rate limit, best-effort on serverless (see api/context for the same trade-off). */
const cache = new Map<string, { at: number; ttl: number; data: unknown }>();
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.delete(ip);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.delete(hits.keys().next().value as string);
  return recent.length > 20;
}
function cached<T>(key: string, ttl: number, make: () => Promise<T>) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < hit.ttl) return Promise.resolve(hit.data as T);
  return make().then((data) => {
    if (cache.size >= 500) cache.delete(cache.keys().next().value as string);
    cache.set(key, { at: Date.now(), ttl, data });
    return data;
  });
}

const err = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

async function getJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as unknown;
}

/* ---------- population: Wikidata search, then each match's population claims ---------- */
async function population(q: string) {
  const search = (await getJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=en&uselang=en&type=item&limit=7&format=json`)) as {
    search?: { id: string; label?: string; description?: string }[];
  };
  const found = await Promise.all(
    (search.search ?? []).map(async (m) => {
      try {
        const c = (await getJson(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${m.id}&property=P1082&format=json`)) as { claims?: { P1082?: PopClaim[] } };
        const p = latestPopulation(c.claims?.P1082);
        return p && { id: m.id, label: m.label ?? m.id, description: m.description ?? "", ...p };
      } catch {
        return null;
      }
    }),
  );
  return { matches: found.filter(Boolean).slice(0, 5) };
}

/* ---------- branded search: Google Trends interest before and during the flight ---------- */
async function search(term: string, start: string, end: string, beforeWeeks: number, geo: string) {
  const startTime = new Date(Date.parse(start + "T00:00:00Z") - beforeWeeks * 7 * DAY);
  const endTime = new Date(Date.parse(end + "T00:00:00Z") + DAY - 1);
  const raw = await Promise.race([
    googleTrends.interestOverTime({ keyword: term, startTime, endTime, ...(geo ? { geo } : {}) }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timed out")), TIMEOUT_MS)),
  ]);
  let json: { default?: { timelineData?: { time: string; value: number[] }[] } };
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Google Trends returned a non-JSON page (usually rate limiting)");
  }
  const points: TrendPoint[] = (json.default?.timelineData ?? []).map((p) => ({ date: new Date(Number(p.time) * 1000).toISOString().slice(0, 10), value: Number(p.value?.[0]) || 0 }));
  if (!points.length) throw new Error("no data");
  return { points, ...splitTrend(points, start, end) };
}

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (rateLimited(ip)) return err(429, "Too many lookups in a minute. Wait a moment and try again.");
  const u = new URL(request.url).searchParams;
  const type = u.get("type");
  try {
    if (type === "population") {
      const q = (u.get("q") ?? "").trim().slice(0, 80);
      if (q.length < 2) return err(400, "Type a city, region or country.");
      return NextResponse.json(await cached(`pop:${q.toLowerCase()}`, 24 * 3600_000, () => population(q)), { headers: { "Cache-Control": "public, s-maxage=86400" } });
    }
    if (type === "search") {
      const term = (u.get("term") ?? "").trim().slice(0, 100);
      const start = u.get("start") ?? "", end = u.get("end") ?? "";
      const before = Math.round(Number(u.get("before") ?? 8));
      const geo = (u.get("geo") ?? "").trim().toUpperCase();
      if (term.length < 2) return err(400, "Type your brand name.");
      if (!isDay(start) || !isDay(end)) return err(400, "Enter the flight's start and end dates.");
      if (end < start) return err(400, "The end date is before the start date.");
      if (Date.parse(end) - Date.parse(start) > 366 * DAY) return err(400, "Flights longer than a year aren't supported.");
      if (Date.parse(start) > Date.now()) return err(400, "The flight hasn't started yet, so there's no search data.");
      if (!(before >= 1 && before <= 26)) return err(400, "Weeks before must be between 1 and 26.");
      if (geo && !/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/.test(geo)) return err(400, "Country must be a two-letter code, like US or GB.");
      return NextResponse.json(await cached(`s:${term.toLowerCase()}|${start}|${end}|${before}|${geo}`, 30 * 60_000, () => search(term, start, end, before, geo)), { headers: { "Cache-Control": "public, s-maxage=1800" } });
    }
    return err(400, "Unknown lookup.");
  } catch (e) {
    console.warn(`[doohsight-market] ${type} failed: ${(e as Error).message}`);
    return err(502, type === "search" ? "Google Trends didn't answer. It limits how often it can be asked; try again in a few minutes." : "Wikidata didn't answer. Try again in a moment.");
  }
}
