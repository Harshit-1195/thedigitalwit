import { calculatorHref, getCategory, oneLiner, SIDES, type Side } from "./calculators/data";
import type { SearchEntry } from "./search";
import { ALL_PAGES } from "./site";

/** Built on the server: all 75 calculators plus every page. */
export function buildSearchIndex(): SearchEntry[] {
  const calcs = (["buy", "sell"] as Side[]).flatMap((side) =>
    SIDES[side].calculators.map<SearchEntry>((c) => ({
      group: side === "buy" ? "Buy-Side" : "Sell-Side",
      title: c.name,
      desc: oneLiner(c),
      href: calculatorHref(side, c.id),
      tags: `${getCategory(side, c.cat).label} ${c.vars.map((v) => v.label).join(" ")}`,
    })),
  );
  const pages = ALL_PAGES.map<SearchEntry>((p) => ({ group: "Pages", title: p.label, desc: p.blurb, href: p.href }));
  return [...calcs, ...pages];
}
