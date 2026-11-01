import { formatWithUnit } from "./format";
import { solve } from "./solver";
import type { CalcVar, Calculator } from "./types";

/** "Spend" -> "spend", but leaves acronyms like "CPM" or "D7 retention" alone. */
export function lower(label: string): string {
  return /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const fmtVar = (v: CalcVar, n: number, mode: "result" | "input") => formatWithUnit(n, v.unit, mode);

/**
 * "If spend is $5,000 and impressions is 1,200,000, then CPM = $4.17."
 * Computed live from the defaults with the same solver the panel uses.
 */
export function workedExample(calc: Calculator): string | null {
  const last = calc.vars.length - 1;
  const result = solve(calc, calc.vars.map((v) => v.d), last);
  if (result === null) return null;
  const givens = calc.vars.slice(0, last).map((v) => `${lower(v.label)} is ${fmtVar(v, v.d, "input")}`);
  const out = calc.vars[last];
  return `If ${list(givens)}, then ${out.label} = ${fmtVar(out, result, "result")}.`;
}

/** One planning paragraph for the calculator's relation type, naming its metric. */
export function tacticalGuide(calc: Calculator): string {
  const [a, b, c] = calc.vars;
  const out = calc.vars[calc.vars.length - 1];
  const A = lower(a.label);
  const B = b ? lower(b.label) : "";
  const X = out.label;

  switch (calc.relation) {
    case "RATIO2":
      return `${X} links ${A} and ${B} in a fixed ratio, so any two pin down the third. Planning backwards is where it earns its keep: enter the ${A} you have and the ${X} you are targeting, and the solver tells you the ${B} you must secure. Or lock ${B} and ${X} from a benchmark to see the ${A} that plan implies before you commit.`;
    case "ROI2":
      return `${X} compares ${A} with ${B}. Set a target ${X} and a known ${B} to find the ${A} you need to clear the bar, or enter the ${A} you expect with the ${X} you require to find the most you can afford to spend. A target of 0% gives your exact break-even point.`;
    case "INVERSE1":
      return `${X} and ${A} move in opposite directions: improve one and the other falls. Enter your ${A} to see the ${X} you must beat, or start from a ${X} a platform is reporting and solve for the ${A} you would need for it to be profitable.`;
    case "PRODUCT2_SCALED":
      return `${X} scales with both ${A} and ${B}. Use it forwards to forecast ${X} from a plan, or backwards: fix the ${X} you need and the ${B} you can realistically achieve, and the solver returns the ${A} required. Swap them to find the ${B} you must hit on a fixed ${A}.`;
    case "PRODUCT3":
      return `${X} is the product of ${A}, ${B} and ${lower(c.label)}, so a gap in one must be made up by the others. Fill any three to solve the fourth: set a ${X} goal and two levers you trust, and see exactly how far the remaining lever has to move.`;
  }
}

/** Short "what this field means for solving" line for the variable breakdown. */
export function variableHint(calc: Calculator, index: number): string {
  const needed = calc.vars.length - 1;
  const others = needed === 1 ? "the other field" : `the other ${needed} fields`;
  const v = calc.vars[index];
  return `Enter ${lower(v.label)} directly, or leave it blank and let the solver calculate it from ${others}.`;
}
