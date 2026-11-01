// What each tool's "Describe your case" box can fill. The server accepts only these ids (registry.ts),
// so the AI endpoint can't be used for anything but filling these forms.

import { FIELDS as DOOH_FIELDS, NUM_KEYS as DOOH_KEYS } from "../doohsight-data";
import type { Side } from "../calculators/data";
import type { Calculator } from "../calculators/types";
import { GEOS as GTM_GEOS, GOALS, INDUSTRIES, STAGES } from "../gtm/data";
import { CURRENCIES, DEFAULT_CHANNELS, GEOS as MP_GEOS, OBJECTIVES } from "../mediaPlan/constants";
import type { AiField, AiSpec, Unit } from "./fill";

/* ---------- GTM Generator ---------- */
const INDUSTRY_WORDS: Record<string, string[]> = {
  saas: ["saas", "b2b software", "software", "b2b", "platform"],
  cpg: ["cpg", "fmcg", "consumer goods", "packaged goods", "food", "beverage", "beverages", "snacks", "cosmetics", "beauty"],
  retail: ["retail", "ecommerce", "e-commerce", "d2c", "dtc", "online store", "shop", "fashion", "apparel"],
  finance: ["fintech", "finance", "financial", "bank", "banking", "insurance", "insurtech", "lending", "payments"],
  health: ["health", "healthcare", "pharma", "pharmaceutical", "medical", "medtech", "wellness", "clinic"],
  auto: ["automotive", "auto", "car", "cars", "ev", "electric vehicle", "dealership"],
  travel: ["travel", "hotel", "hotels", "airline", "tourism", "hospitality", "booking"],
  telecom: ["telecom", "telco", "mobile operator", "broadband", "isp", "connectivity"],
  gaming: ["gaming", "game", "games", "esports", "entertainment", "streaming"],
  education: ["education", "edtech", "e-learning", "elearning", "courses", "university", "school", "learning"],
};
const GEO_WORDS: Record<string, string[]> = {
  na: ["north america", "=US", "usa", "u.s.", "united states", "america", "american", "canada", "canadian", "new york", "california"],
  latam: ["latin america", "latam", "brazil", "mexico", "argentina", "chile", "colombia", "peru"],
  uk: ["uk", "u.k.", "united kingdom", "britain", "england", "london", "ireland", "scotland"],
  eu: ["europe", "eu", "germany", "france", "spain", "italy", "netherlands", "nordics", "sweden", "poland", "dach", "benelux"],
  mena: ["middle east", "gcc", "mena", "uae", "dubai", "abu dhabi", "saudi", "saudi arabia", "ksa", "qatar", "kuwait", "bahrain", "oman"],
  india: ["india", "indian", "mumbai", "delhi", "bangalore", "bengaluru"],
  sea: ["southeast asia", "south east asia", "sea", "singapore", "indonesia", "malaysia", "thailand", "vietnam", "philippines"],
  china: ["china", "chinese", "greater china", "hong kong", "taiwan", "shanghai", "beijing"],
  jk: ["japan", "japanese", "korea", "south korea", "korean", "tokyo", "seoul"],
};
const GOAL_WORDS: Record<string, string[]> = {
  awareness: ["awareness", "brand awareness", "brand", "visibility", "reach", "launch buzz"],
  demand: ["leads", "lead gen", "lead generation", "demand gen", "demand generation", "pipeline", "sales", "signups", "sign-ups", "customers", "acquisition"],
  expansion: ["expansion", "expand", "expanding", "new market", "market entry", "go international", "international expansion"],
  retention: ["retention", "churn", "loyalty", "repeat purchase", "upsell", "renewals", "existing customers"],
};
const STAGE_WORDS: Record<string, string[]> = {
  bootstrapped: ["bootstrapped", "bootstrap", "self-funded", "self funded", "no funding", "unfunded", "standalone", "stand-alone", "stand alone", "indie", "small business", "solo founder"],
  startup: ["startup", "start-up", "seed", "pre-seed", "series a", "early stage", "early-stage"],
  growth: ["growth stage", "scale-up", "scaleup", "series b", "series c", "series d", "scaling"],
  enterprise: ["enterprise", "corporate", "established", "large company", "multinational", "fortune 500", "public company"],
};

/** Annual budget bucket for the GTM tool. */
export const gtmBudgetId = (annual: number) => (annual < 250_000 ? "b1" : annual < 1_000_000 ? "b2" : annual < 5_000_000 ? "b3" : "b4");

const opts = <T extends { id: string; label: string }>(list: T[], words: Record<string, string[]>) => list.map((x) => ({ value: x.id, label: x.label, aliases: words[x.id] }));

const GTM: AiSpec = {
  id: "gtm",
  title: "GTM Strategy Generator",
  about: "Builds a go-to-market plan from an industry, target geography, goal, company stage, annual budget and an optional audience description.",
  fields: [
    { key: "industry", label: "Industry", type: "choice", options: opts(INDUSTRIES, INDUSTRY_WORDS) },
    { key: "geo", label: "Target geography", type: "choice", options: opts(GTM_GEOS, GEO_WORDS), hint: "Map a country or city to the region that contains it." },
    { key: "goal", label: "Primary goal", type: "choice", options: opts(GOALS, GOAL_WORDS), hint: "Leads, pipeline or sales mean demand; entering a new country means expansion." },
    { key: "stage", label: "Company stage", type: "choice", options: opts(STAGES, STAGE_WORDS), hint: "Self-funded or bootstrapped companies are bootstrapped, whatever their size." },
    { key: "budget", label: "Annual budget", type: "number", unit: "money", primary: true, annual: true, usd: true, aliases: ["budget", "spend", "annual budget", "marketing budget"], hint: "Per year in US dollars: multiply a monthly figure by 12 and a quarterly one by 4; convert other currencies at approximate current rates and say so in the note." },
    { key: "notes", label: "Audience notes", type: "text", aliases: ["audience", "targeting", "target"], hint: "Who they sell to, in a few words (e.g. 'mid-market ops leaders, price-sensitive'). Leave out if not stated." },
  ],
  examples: [
    "Bootstrapped SaaS startup entering India, $40k a month, want leads",
    "Enterprise bank expanding into the UAE with a $3M annual budget to build awareness",
    "Seed-stage beauty brand in the UK, £200k this year, targeting Gen Z shoppers",
  ],
  rates: Object.fromEntries(CURRENCIES.map((c) => [c.code, c.rate])),
};

/* ---------- DoohSight ---------- */
const unitFor = (k: string): Unit | undefined =>
  k.endsWith("Pct") ? "percent" : ["spend", "categorySpend", "benchmarkCpm", "basket", "onlineRevenue"].includes(k) ? "money" : k === "attentiveSec" ? "seconds" : k === "freshnessHours" ? "hours" : k === "weeks" ? "weeks" : undefined;

// Everyday words for the built-in reader, beyond the column names the importer knows.
const DOOH_EXTRA: Partial<Record<string, string[]>> = {
  reach: ["reached", "reaching", "people reached"],
  exposedVisitPct: ["exposed visit", "exposed"],
  controlVisitPct: ["control visit", "control visit rate", "control"],
  testN: ["test users", "test group", "in test"],
  testConv: ["test conversions"],
  controlN: ["control users", "control group", "in control"],
  controlConv: ["control conversions"],
  screens: ["screen", "boards", "billboards"],
  plays: ["played", "play"],
};

const DOOH: AiSpec = {
  id: "doohsight",
  title: "DoohSight",
  about: "Measures a DOOH or programmatic DOOH campaign: delivery, attention, footfall, cross-channel halo, ROI, brand lift, incrementality and delivery quality.",
  fields: [
    { key: "campaign", label: "Campaign name", type: "text", hint: "Only if they name the campaign." },
    ...DOOH_KEYS.map(
      (k): AiField => ({
        key: k,
        label: DOOH_FIELDS[k].label,
        type: "number",
        unit: unitFor(k),
        aliases: [...(DOOH_FIELDS[k].aliases ?? []), ...(DOOH_EXTRA[k] ?? [])],
        primary: k === "spend",
        hint: k.endsWith("Base") || k.endsWith("Campaign") ? "Weekly average." : undefined,
      }),
    ),
  ],
  examples: [
    "We spent $120k on 300 screens, 6.4M impressions, reached 1.3M of a 5M population",
    "Footfall study: exposed visit rate 5.1%, control 3.8%, basket $9, margin 55%",
    "Holdout test: 10,000 test users with 480 conversions vs 8,000 control with 300",
  ],
};

/* ---------- Media Plan Generator ---------- */
const CHANNEL_WORDS: Record<string, string[]> = {
  social: ["social", "social media", "meta", "facebook", "instagram", "tiktok"],
  progDisplay: ["programmatic", "display", "programmatic display", "banners"],
  native: ["native"],
  ctv: ["ctv", "connected tv", "streaming tv", "ott"],
  audio: ["audio", "podcast", "podcasts", "spotify", "radio"],
  dooh: ["dooh", "digital out of home", "billboards", "out of home", "ooh"],
  youtube: ["youtube", "online video"],
};
const COUNTRY_WORDS: Record<string, string[]> = {
  "United States": ["=US", "usa", "u.s.", "america"],
  "United Kingdom": ["uk", "u.k.", "britain", "england"],
  "United Arab Emirates": ["uae", "dubai", "emirates"],
  "Saudi Arabia": ["saudi", "ksa"],
  "South Korea": ["korea"],
};
const CURRENCY_WORDS: Record<string, string[]> = { USD: ["$", "dollars", "usd"], EUR: ["€", "euros", "euro"], GBP: ["£", "pounds", "sterling"], INR: ["₹", "rupees", "inr", "lakh", "crore"], AED: ["dirhams", "aed"], JPY: ["yen"] };

const MEDIA_PLAN: AiSpec = {
  id: "media-plan",
  title: "Media Plan Generator",
  about: "Builds a seven-channel media plan from a campaign name, objective, budget, currency, flight dates, markets, channel percentages and a target CAC or ROAS.",
  fields: [
    { key: "campaignName", label: "Campaign name", type: "text", hint: "Only if they name it." },
    { key: "objective", label: "Objective", type: "choice", options: OBJECTIVES.map((o) => ({ value: o, label: o, aliases: { Awareness: ["awareness", "brand", "reach"], Consideration: ["consideration", "traffic", "engagement"], Conversion: ["conversion", "conversions", "sales", "performance", "leads"], "Full-funnel": ["full funnel", "full-funnel"] }[o] })) },
    { key: "budget", label: "Budget", type: "number", unit: "money", primary: true, aliases: ["budget", "spend", "total"] },
    { key: "currency", label: "Currency", type: "choice", options: CURRENCIES.map((c) => ({ value: c.code, label: c.label, aliases: CURRENCY_WORDS[c.code] })), hint: "From a currency symbol or name." },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date", hint: "If they give a length instead (e.g. 8 weeks), use weeks." },
    { key: "weeks", label: "Flight length in weeks", type: "number", unit: "weeks", aliases: ["weeks", "week flight", "week campaign"], hint: "Months × 4.3, rounded." },
    { key: "geos", label: "Markets", type: "multi", options: Object.values(MP_GEOS).flat().map((g) => ({ value: g, label: g, aliases: COUNTRY_WORDS[g] })) },
    { key: "goal", label: "Optimise for", type: "choice", options: [{ value: "cac", label: "Lowest CAC", aliases: ["cac", "cpa", "cost per acquisition", "cost per customer"] }, { value: "roas", label: "Highest ROAS", aliases: ["roas", "return on ad spend"] }] },
    { key: "cac", label: "Target CAC", type: "number", unit: "money", aliases: ["target cac", "cac", "cpa", "cost per acquisition"], hint: "In the plan's currency." },
    { key: "roas", label: "Target ROAS", type: "number", unit: "multiple", aliases: ["target roas", "roas", "target"] },
    ...DEFAULT_CHANNELS.map((c): AiField => ({ key: `pct_${c.key}`, label: `${c.name} share`, type: "number", unit: "percent", aliases: CHANNEL_WORDS[c.key], hint: "Share of budget, only if stated." })),
  ],
  examples: [
    "Awareness launch in the UAE and Saudi, $300k over 8 weeks starting 1 March 2027",
    "Conversion campaign, €150k, 40% social, 30% YouTube, rest programmatic",
    "Q3 retail push in the US and Canada, $1.2M, keep CAC under $50",
  ],
};

/* ---------- Media Mix Model ---------- */
const MMM: AiSpec = {
  id: "mmm",
  title: "Media Mix Model",
  about: "Measures each channel's return from weekly spend and a KPI. The description sets how results are read: KPI type, currency, margin or target cost per conversion, weeks held out for testing and how much detail to put into uncertainty ranges.",
  fields: [
    { key: "kpiType", label: "KPI type", type: "choice", options: [{ value: "revenue", label: "Revenue", aliases: ["revenue", "sales", "turnover", "gmv", "roas"] }, { value: "conversions", label: "Conversions", aliases: ["conversions", "leads", "sign-ups", "signups", "orders", "installs", "cpa"] }] },
    { key: "currency", label: "Currency", type: "choice", options: [["$", "US dollar", ["$", "usd", "dollars"]], ["€", "Euro", ["€", "eur", "euros"]], ["£", "Pound", ["£", "gbp", "pounds"]], ["₹", "Rupee", ["₹", "inr", "rupees"]], ["¥", "Yen", ["¥", "jpy", "yen"]], ["AED ", "Dirham", ["aed", "dirhams"]]].map(([value, label, aliases]) => ({ value: value as string, label: label as string, aliases: aliases as string[] })) },
    { key: "margin", label: "Gross margin", type: "number", unit: "percent", aliases: ["margin", "gross margin"] },
    { key: "targetCpa", label: "Target cost per conversion", type: "number", unit: "money", aliases: ["target cpa", "cpa", "cost per conversion", "cost per lead"] },
    { key: "holdout", label: "Weeks held out for testing", type: "number", unit: "weeks", aliases: ["hold out", "holdout", "held out", "test weeks"] },
    { key: "speed", label: "Uncertainty detail", type: "choice", options: [{ value: "quick", label: "Quick", aliases: ["quick", "fast"] }, { value: "standard", label: "Standard" }, { value: "thorough", label: "Thorough", aliases: ["thorough", "detailed", "precise"] }] },
  ],
  examples: ["Revenue KPI in euros, 55% gross margin, hold out 8 weeks", "Leads, target cost per lead $40, thorough ranges"],
};

/* ---------- KPI calculators ---------- */
const CALC_UNIT: Record<string, Unit> = { $: "money", "%": "percent", x: "multiple" };

export function calculatorSpec(side: Side, calc: Calculator): AiSpec {
  return {
    id: `calc:${side}:${calc.id}`,
    title: calc.name,
    about: `${calc.about} Formula: ${calc.formulaDisplay}. Fill in the values the person gives; the calculator solves the one left out.`,
    fields: calc.vars.map((v) => ({ key: v.key, label: v.label, type: "number", unit: CALC_UNIT[v.unit] ?? (v.unit === "#" ? "count" : undefined), aliases: [v.key.toLowerCase()] })),
    examples: [calc.vars.slice(0, -1).map((v) => `${v.label.replace(/\s*\(.*?\)/, "").toLowerCase()} ${v.unit === "$" ? "$" : ""}${v.d.toLocaleString("en-US")}${v.unit === "%" ? "%" : v.unit === "x" ? "x" : ""}`).join(", ")],
  };
}

export const GTM_SPEC = GTM;
export const DOOH_SPEC = DOOH;
export const MEDIA_PLAN_SPEC = MEDIA_PLAN;
export const MMM_SPEC = MMM;
