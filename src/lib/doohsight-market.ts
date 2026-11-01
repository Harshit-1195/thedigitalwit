// DoohSight market data: pure helpers for the two lookups in /api/doohsight-market.
// Population comes from Wikidata (cities and countries); branded search from Google Trends.

export type PopClaim = {
  rank?: string;
  mainsnak?: { datavalue?: { value?: { amount?: string } } };
  qualifiers?: { P585?: { datavalue?: { value?: { time?: string } } }[] };
};

/** Wikidata lists several population figures per place. Use the preferred ones, then the most recent. */
export function latestPopulation(claims: PopClaim[] = []): { population: number; year: number | null } | null {
  const rows = claims
    .filter((c) => c.rank !== "deprecated")
    .map((c) => {
      const population = Number(c.mainsnak?.datavalue?.value?.amount);
      const time = c.qualifiers?.P585?.[0]?.datavalue?.value?.time;
      const year = time ? Number(/^[+-]?(\d{4})/.exec(time)?.[1]) || null : null;
      return { population, year, preferred: c.rank === "preferred" };
    })
    .filter((r) => Number.isFinite(r.population) && r.population > 0);
  if (!rows.length) return null;
  const pool = rows.some((r) => r.preferred) ? rows.filter((r) => r.preferred) : rows;
  const best = pool.reduce((a, b) => ((b.year ?? -1) > (a.year ?? -1) ? b : a));
  return { population: best.population, year: best.year };
}

export type TrendPoint = { date: string; value: number };

export const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s + "T00:00:00Z"));
const dayNum = (s: string) => Math.round(Date.parse(s + "T00:00:00Z") / 86_400_000);

/** Average search interest before the flight and during it, plus the flight length in weeks. */
export function splitTrend(points: TrendPoint[], start: string, end: string) {
  const s = dayNum(start), e = dayNum(end);
  const before = points.filter((p) => dayNum(p.date) < s).map((p) => p.value);
  const during = points.filter((p) => dayNum(p.date) >= s && dayNum(p.date) <= e).map((p) => p.value);
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);
  return { before: avg(before), during: avg(during), beforeN: before.length, duringN: during.length, weeks: Math.max(1, Math.ceil((e - s + 1) / 7)) };
}
