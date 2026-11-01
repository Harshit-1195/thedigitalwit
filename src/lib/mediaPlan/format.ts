import { CURRENCIES } from "./constants";

export function fmtMoney(amount: number, code: string) {
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(n);
  } catch {
    return `${code} ${Math.round(n).toLocaleString("en-US")}`;
  }
}

export const fmtNum = (n: number) => Math.round(Number.isFinite(n) ? n : 0).toLocaleString("en-US");

export const currencyRate = (code: string) => CURRENCIES.find((c) => c.code === code)?.rate ?? 1;

export const toUSD = (amount: number, code: string) => amount / currencyRate(code);

const DAY = 86_400_000;

/** Days and whole weeks between two yyyy-mm-dd dates; at least 1 week. */
export function weeksBetween(startDate: string, endDate: string) {
  const a = Date.parse(startDate + "T00:00:00Z");
  const b = Date.parse(endDate + "T00:00:00Z");
  const days = Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, Math.round((b - a) / DAY)) : 0;
  return { days, weeks: Math.max(1, Math.round(days / 7)) };
}

/** yyyy-mm-dd for today plus n days, in local time. */
export function isoDaysFromNow(n: number, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDaysFromNow(n, new Date(y, m - 1, d));
}

export const fmtDate = (iso: string) => {
  const t = Date.parse(iso + "T00:00:00Z");
  return Number.isFinite(t) ? new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
};
