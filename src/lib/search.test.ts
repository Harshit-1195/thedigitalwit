import { describe, expect, it } from "vitest";
import { score, search } from "./search";
import { buildSearchIndex } from "./search-index";

const index = buildSearchIndex();
const titles = (q: string) => search(index, q).flatMap((g) => g.entries.map((e) => `${g.group}: ${e.title}`));

describe("search index", () => {
  it("covers all 75 calculators and every page", () => {
    expect(index.filter((e) => e.group === "Buy-Side")).toHaveLength(63);
    expect(index.filter((e) => e.group === "Sell-Side")).toHaveLength(12);
    const pages = index.filter((e) => e.group === "Pages").map((e) => e.href);
    for (const href of ["/", "/buy-side", "/sell-side", "/media-mix-model", "/gtm-generator", "/media-plan-generator", "/creative-studio", "/governance", "/login"]) {
      expect(pages).toContain(href);
    }
  });
});

describe("search", () => {
  it("returns nothing for an empty query", () => {
    expect(search(index, "   ")).toEqual([]);
  });

  it("puts title-prefix matches first", () => {
    expect(titles("cpm")[0]).toBe("Buy-Side: CPM (Cost per Mille)");
  });

  it("groups results in Buy-Side, Sell-Side, Pages order", () => {
    const groups = search(index, "rate").map((g) => g.group);
    const order = ["Buy-Side", "Sell-Side", "Pages"];
    expect(groups.slice(0, 2)).toEqual(["Buy-Side", "Sell-Side"]);
    expect([...groups].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(groups);
    expect(search(index, "media").map((g) => g.group)).toContain("Pages");
  });

  it("matches sell-side calculators and pages by name", () => {
    expect(titles("fill rate")).toContain("Sell-Side: Fill Rate");
    expect(titles("governance")).toContain("Pages: Governance");
    expect(titles("specs")).toContain("Pages: Creative Studio");
  });

  it("matches on description and vertical name", () => {
    expect(titles("household").some((t) => t.includes("Cost per Household"))).toBe(true);
    expect(titles("crypto")).toContain("Buy-Side: Cost per Wallet Connect");
  });

  it("requires every word to match", () => {
    expect(score({ group: "Pages", title: "Fill Rate", desc: "", href: "/" }, "fill zebra")).toBe(0);
  });

  it("caps results per group", () => {
    expect(search(index, "cost", 5).every((g) => g.entries.length <= 5)).toBe(true);
  });

  it("ignores punctuation and case", () => {
    expect(titles("E-COMMERCE")).toEqual(titles("e commerce"));
  });
});
