import { describe, expect, it } from "vitest";
import { breakdown, cleanKeyword, gdeltDate, isoDate, label, lean, mentionsKeyword, overview, parseSuggest, scoringText, stripHtml, titleKey, xmlAttr, xmlBlocks, xmlText } from "./analyze";

describe("contextual signal helpers", () => {
  it("validates and cleans keywords", () => {
    expect(cleanKeyword("  binance ")).toBe("binance");
    expect(cleanKeyword("bin\u0000ance\n")).toBe("binance");
    expect(cleanKeyword("   ")).toBeNull();
    expect(cleanKeyword("x".repeat(81))).toBeNull();
    expect(cleanKeyword("x".repeat(80))).toHaveLength(80);
    expect(cleanKeyword(undefined)).toBeNull();
  });

  it("keeps the sentiment thresholds", () => {
    expect([2, 1, 0, -1, -2].map(label)).toEqual(["positive", "neutral", "neutral", "neutral", "negative"]);
    expect(scoringText("Title", "b".repeat(400))).toHaveLength(6 + 280);
    expect(scoringText("Title", null)).toBe("Title");
  });

  it("computes lean labels", () => {
    expect([55, 54, 46, 45].map(lean)).toEqual(["positive lean", "mixed", "mixed", "negative lean"]);
  });

  it("builds a breakdown that sums to 100", () => {
    const b = breakdown([{ sentiment: "positive" }, { sentiment: "positive" }, { sentiment: "negative" }]);
    expect(b).toEqual({ positive: 67, negative: 33, neutral: 0 });
    expect(breakdown([])).toEqual({ positive: 0, neutral: 0, negative: 0 });
  });

  it("computes the overview from scored items and the trend", () => {
    const trend = Array.from({ length: 14 }, (_, i) => ({ date: `d${i}`, value: i < 7 ? 40 : 60 }));
    const o = overview([{ sentiment: "positive" }, { sentiment: "positive" }, { sentiment: "negative" }, { sentiment: "neutral" }], 12, trend);
    expect(o).toEqual({ sentimentScore: 67, mentions: 12, mentionsDelta: 50, searchInterest: 60, trendDirection: "rising" });
    const flat = overview([], 0, null);
    expect(flat).toEqual({ sentimentScore: null, mentions: 0, mentionsDelta: null, searchInterest: null, trendDirection: null });
  });

  it("parses source formats", () => {
    expect(gdeltDate("20261026T050000Z")).toBe("2026-10-26T05:00:00Z");
    expect(gdeltDate("bad")).toBeNull();
    expect(stripHtml("<p>It&#x27;s <i>fast</i> &amp; cheap</p>")).toBe("It's fast & cheap");
  });
});

describe("relevance filter", () => {
  it("keeps posts that name every word of the keyword", () => {
    expect(mentionsKeyword("binance", "How Binance's hack went down")).toBe(true);
    expect(mentionsKeyword("binance", "The Marathon Is as Popular as Ever", null)).toBe(false);
    expect(mentionsKeyword("nike air", "Nike launches", "new Air Max")).toBe(true);
    expect(mentionsKeyword("nike air", "Nike launches")).toBe(false);
  });
});

describe("feed parsing", () => {
  const rss = `<rss><channel><item><title>Nike launches &#233;lan - WWD</title><link>https://news.google.com/a?x=1&amp;y=2</link><pubDate>Thu, 29 Oct 2026 00:32:58 GMT</pubDate><source url="https://wwd.com">WWD</source></item><item><title><![CDATA[Second & last]]></title></item></channel></rss>`;
  it("reads RSS items, text, attributes and dates", () => {
    const items = xmlBlocks(rss, "item");
    expect(items).toHaveLength(2);
    expect(xmlText(items[0], "title")).toBe("Nike launches élan - WWD");
    expect(xmlText(items[0], "link")).toBe("https://news.google.com/a?x=1&y=2");
    expect(xmlAttr(items[0], "source", "url")).toBe("https://wwd.com");
    expect(isoDate(xmlText(items[0], "pubDate"))).toBe("2026-10-29T00:32:58.000Z");
    expect(xmlText(items[1], "title")).toBe("Second & last");
    expect(xmlText(items[1], "link")).toBeNull();
  });
  it("reads Atom entries and namespaced tags", () => {
    const atom = `<feed><entry><title>Post</title><link href="https://www.reddit.com/r/x/1/" /><category term="Nike" label="r/Nike"/></entry></feed><News:Source>Hypebeast</News:Source>`;
    const e = xmlBlocks(atom, "entry")[0];
    expect(xmlAttr(e, "link", "href")).toBe("https://www.reddit.com/r/x/1/");
    expect(xmlAttr(e, "category", "label")).toBe("r/Nike");
    expect(xmlText(atom, "News:Source")).toBe("Hypebeast");
  });
  it("matches the same story across sources", () => {
    expect(titleKey("Nike's new shoe!")).toBe(titleKey("nike s new shoe"));
  });
});

describe("search suggestions", () => {
  it("drops the query itself and duplicates", () => {
    expect(parseSuggest(["nike", ["nike", "Nike shoes", "nike shoes", "nike uae"]], "Nike", 10)).toEqual(["Nike shoes", "nike uae"]);
    expect(parseSuggest(["nike vs", ["nike vs", "nike vs adidas", "nike vs puma"]], "nike vs", 1)).toEqual(["nike vs adidas"]);
    expect(parseSuggest({ bad: true }, "x", 5)).toEqual([]);
  });
});
