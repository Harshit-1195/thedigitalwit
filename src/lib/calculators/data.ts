import buyside from "@/data/buyside-calculators.json";
import sellside from "@/data/sellside-calculators.json";
import type { Calculator } from "./types";

export type Side = "buy" | "sell";

export type Category = {
  code: string;
  label: string;
  /** Anchor id on the hub page, e.g. /buy-side#display-programmatic */
  slug: string;
};

// Vertical codes used in the `cat` field, in hub display order.
export const BUY_CATEGORIES: Category[] = [
  { code: "UNI", label: "Universal", slug: "universal" },
  { code: "DSP", label: "Display/Programmatic", slug: "display-programmatic" },
  { code: "VID", label: "Video", slug: "video" },
  { code: "AUD", label: "Audio", slug: "audio" },
  { code: "CTV", label: "CTV", slug: "ctv" },
  { code: "NAT", label: "Native", slug: "native" },
  { code: "SOC", label: "Social", slug: "social" },
  { code: "APP", label: "App/Mobile", slug: "app-mobile" },
  { code: "ECM", label: "Ecommerce/Shopping", slug: "ecommerce-shopping" },
  { code: "DOOH", label: "DOOH", slug: "dooh" },
  { code: "CRY", label: "Crypto", slug: "crypto" },
  { code: "HLT", label: "Healthcare", slug: "healthcare" },
  { code: "GAM", label: "Gaming", slug: "gaming" },
];

// Sell-side groups (the spec names no verticals here, so these are thematic).
export const SELL_CATEGORIES: Category[] = [
  { code: "YLD", label: "Yield", slug: "yield" },
  { code: "FIL", label: "Fill & Inventory", slug: "fill-inventory" },
  { code: "HB", label: "Header Bidding", slug: "header-bidding" },
  { code: "DEAL", label: "Deals & Revenue Mix", slug: "deals-revenue-mix" },
];

export const BUY_CALCULATORS = buyside as Calculator[];
export const SELL_CALCULATORS = sellside as Calculator[];

export type SideMeta = { label: string; hub: string; calculators: Calculator[]; categories: Category[] };

export const SIDES: Record<Side, SideMeta> = {
  buy: { label: "Buy-Side", hub: "/buy-side", calculators: BUY_CALCULATORS, categories: BUY_CATEGORIES },
  sell: { label: "Sell-Side", hub: "/sell-side", calculators: SELL_CALCULATORS, categories: SELL_CATEGORIES },
};

/** Real totals for Home and elsewhere, derived from the data files. */
export const COUNTS = {
  buySide: BUY_CALCULATORS.length,
  sellSide: SELL_CALCULATORS.length,
  total: BUY_CALCULATORS.length + SELL_CALCULATORS.length,
  buyVerticals: BUY_CATEGORIES.length,
};

export function getCalculator(side: Side, id: string): Calculator | undefined {
  return SIDES[side].calculators.find((c) => c.id === id);
}

export function getCategory(side: Side, code: string): Category {
  return SIDES[side].categories.find((c) => c.code === code) ?? { code, label: code, slug: code.toLowerCase() };
}

export function calculatorHref(side: Side, id: string) {
  return `/${side}-side/calculators/${id}`;
}

/** First sentence of `about`, used as the card's one-line description. */
export function oneLiner(calc: Calculator): string {
  const m = calc.about.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : calc.about).trim();
}
