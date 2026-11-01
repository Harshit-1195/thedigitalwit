// Header search over all calculators and pages (PROJECT_SPEC.md §3, SEARCH).
// Pure functions so ranking can be unit-tested; the index is built on the
// server and handed to the client header as a small JSON prop.

export type SearchGroup = "Buy-Side" | "Sell-Side" | "Pages";
export const GROUP_ORDER: SearchGroup[] = ["Buy-Side", "Sell-Side", "Pages"];

export type SearchEntry = {
  group: SearchGroup;
  title: string;
  /** One-line description shown under the title. */
  desc: string;
  href: string;
  /** Extra matchable words that aren't displayed, e.g. the vertical name. */
  tags?: string;
};

export type SearchResults = { group: SearchGroup; entries: SearchEntry[] }[];

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ");

/**
 * Every word of the query must appear somewhere in the entry. Ranked by
 * where the words hit: title start > title word start > title > tags > desc.
 */
export function score(entry: SearchEntry, query: string): number {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const title = norm(entry.title);
  const titleWords = title.split(/\s+/);
  const tags = norm(entry.tags ?? "");
  const desc = norm(entry.desc);

  let total = 0;
  for (const w of words) {
    if (title.startsWith(w)) total += 100;
    else if (titleWords.some((t) => t.startsWith(w))) total += 60;
    else if (title.includes(w)) total += 40;
    else if (tags.includes(w)) total += 25;
    else if (desc.includes(w)) total += 10;
    else return 0;
  }
  return total;
}

export function search(index: SearchEntry[], query: string, perGroup = 5): SearchResults {
  const ranked = index
    .map((entry, i) => ({ entry, i, s: score(entry, query) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i);

  return GROUP_ORDER.map((group) => ({
    group,
    entries: ranked.filter((r) => r.entry.group === group).slice(0, perGroup).map((r) => r.entry),
  })).filter((g) => g.entries.length > 0);
}
