import type { Value } from "./solver";

/** Accepts "1,200,000", "$5,000", "12.5%", "3x" and plain numbers. */
export function parseNumber(text: string): Value {
  const cleaned = text.replace(/[,\s$%]/g, "").replace(/x$/i, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Prefix/suffix for a unit. "$" leads; "%", "x" and words trail; "#" has none. */
export function affixes(unit: string): { prefix: string; suffix: string } {
  if (unit === "$") return { prefix: "$", suffix: "" };
  if (unit === "#" || unit === "") return { prefix: "", suffix: "" };
  if (unit === "%" || unit === "x") return { prefix: "", suffix: unit };
  return { prefix: "", suffix: ` ${unit}` };
}

const results = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inputs = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

/** Solved values: thousands separators and exactly 2 decimals. */
export function formatResult(n: number): string {
  return results.format(n);
}

/** Typed values once the field loses focus: separators, up to 4 decimals. */
export function formatInput(n: number): string {
  return inputs.format(n);
}

/** "$4.17", "2.50x", "12.00%", "1,200,000" for sentences and summaries. */
export function formatWithUnit(n: number, unit: string, mode: "result" | "input" = "result"): string {
  const { prefix, suffix } = affixes(unit);
  const body = mode === "result" ? formatResult(Math.abs(n)) : formatInput(Math.abs(n));
  return `${n < 0 ? "−" : ""}${prefix}${body}${suffix}`;
}
