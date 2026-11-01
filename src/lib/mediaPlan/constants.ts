import type { Channel, ChannelKey, Currency, Objective } from "./types";

export const DEFAULT_CHANNELS: Channel[] = [
  { key: "social", name: "Social", color: "#FF6B5B", cpm: 8, funnel: "Mid", freq: 4, pct: 20, start: 0, end: 100 },
  { key: "progDisplay", name: "Programmatic Display", color: "#35C7E0", cpm: 4, funnel: "Lower", freq: 6, pct: 15, start: 20, end: 100 },
  { key: "native", name: "Native", color: "#2DD4BF", cpm: 6, funnel: "Mid", freq: 4, pct: 10, start: 10, end: 100 },
  { key: "ctv", name: "CTV", color: "#FFB020", cpm: 35, funnel: "Upper", freq: 3, pct: 20, start: 0, end: 80 },
  { key: "audio", name: "Audio", color: "#A78BFA", cpm: 15, funnel: "Upper", freq: 4, pct: 10, start: 0, end: 70 },
  { key: "dooh", name: "DOOH", color: "#F472B6", cpm: 12, funnel: "Upper", freq: 5, pct: 10, start: 0, end: 60 },
  { key: "youtube", name: "YouTube", color: "#FF5B54", cpm: 18, funnel: "Upper/Mid", freq: 3, pct: 15, start: 0, end: 90 },
];

export const OBJECTIVES: Objective[] = ["Full-funnel", "Awareness", "Consideration", "Conversion"];

export const ALLOCATION_PROFILES: Record<Objective, Record<ChannelKey, number>> = {
  Awareness: { social: 15, progDisplay: 5, native: 5, ctv: 25, audio: 15, dooh: 15, youtube: 20 },
  Consideration: { social: 20, progDisplay: 10, native: 15, ctv: 15, audio: 12, dooh: 10, youtube: 18 },
  Conversion: { social: 20, progDisplay: 30, native: 20, ctv: 5, audio: 5, dooh: 10, youtube: 10 },
  "Full-funnel": { social: 20, progDisplay: 15, native: 10, ctv: 20, audio: 10, dooh: 10, youtube: 15 },
};

/** Illustrative units per 1 USD. Not a live feed. */
export const CURRENCIES: Currency[] = [
  { code: "USD", label: "US Dollar", rate: 1 },
  { code: "EUR", label: "Euro", rate: 0.92 },
  { code: "GBP", label: "British Pound", rate: 0.78 },
  { code: "AED", label: "UAE Dirham", rate: 3.67 },
  { code: "SAR", label: "Saudi Riyal", rate: 3.75 },
  { code: "QAR", label: "Qatari Riyal", rate: 3.64 },
  { code: "KWD", label: "Kuwaiti Dinar", rate: 0.307 },
  { code: "ILS", label: "Israeli Shekel", rate: 3.7 },
  { code: "TRY", label: "Turkish Lira", rate: 32.5 },
  { code: "EGP", label: "Egyptian Pound", rate: 48.5 },
  { code: "INR", label: "Indian Rupee", rate: 83.5 },
  { code: "JPY", label: "Japanese Yen", rate: 149 },
  { code: "CNY", label: "Chinese Yuan", rate: 7.2 },
  { code: "KRW", label: "South Korean Won", rate: 1330 },
  { code: "IDR", label: "Indonesian Rupiah", rate: 15600 },
  { code: "SGD", label: "Singapore Dollar", rate: 1.34 },
  { code: "AUD", label: "Australian Dollar", rate: 1.52 },
  { code: "NZD", label: "New Zealand Dollar", rate: 1.65 },
  { code: "CAD", label: "Canadian Dollar", rate: 1.36 },
  { code: "MXN", label: "Mexican Peso", rate: 18.5 },
  { code: "BRL", label: "Brazilian Real", rate: 5.4 },
  { code: "ARS", label: "Argentine Peso", rate: 910 },
  { code: "CLP", label: "Chilean Peso", rate: 930 },
  { code: "COP", label: "Colombian Peso", rate: 3900 },
  { code: "CHF", label: "Swiss Franc", rate: 0.88 },
  { code: "SEK", label: "Swedish Krona", rate: 10.4 },
  { code: "NOK", label: "Norwegian Krone", rate: 10.6 },
  { code: "PLN", label: "Polish Zloty", rate: 3.95 },
  { code: "ZAR", label: "South African Rand", rate: 18.3 },
  { code: "NGN", label: "Nigerian Naira", rate: 1550 },
  { code: "KES", label: "Kenyan Shilling", rate: 129 },
];

export const GEOS: Record<string, string[]> = {
  "North America": ["United States", "Canada"],
  Europe: ["United Kingdom", "Germany", "France", "Spain", "Italy", "Netherlands", "Sweden", "Switzerland", "Poland", "Norway"],
  MENA: ["United Arab Emirates", "Saudi Arabia", "Egypt", "Qatar", "Kuwait", "Israel", "Turkey"],
  APAC: ["India", "Japan", "Singapore", "Australia", "China", "South Korea", "Indonesia", "New Zealand"],
  LATAM: ["Brazil", "Mexico", "Argentina", "Chile", "Colombia"],
  Africa: ["South Africa", "Nigeria", "Kenya"],
};

export const DEFAULT_GEOS = ["United States", "United Kingdom", "United Arab Emirates"];
export const UPPER_FUNNEL_KEYS: ChannelKey[] = ["ctv", "audio", "dooh", "youtube"];
export const VIDEO_ATTENTION_KEYS: ChannelKey[] = ["ctv", "youtube", "social"];
export const ACTIVATION_FLOOR_USD = 2000;
