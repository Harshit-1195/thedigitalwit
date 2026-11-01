import type { Calculator } from "./types";

/** A field value: a finite number, or null when blank/invalid. */
export type Value = number | null;

const ok = (n: Value): n is number => n !== null && Number.isFinite(n);

/** Returns n if it is a usable result, otherwise null ("waiting"). */
const finite = (n: number): Value => (Number.isFinite(n) ? n : null);

/** Safe division: null when the denominator is zero or anything is unusable. */
function div(a: Value, b: Value): Value {
  if (!ok(a) || !ok(b) || b === 0) return null;
  return finite(a / b);
}

/**
 * Solves var `target` of `calc` from the other values. The value at `target`
 * is ignored. Returns null whenever the result can't be computed, so the UI
 * shows "waiting" instead of NaN or Infinity.
 */
export function solve(calc: Calculator, values: Value[], target: number): Value {
  const k = calc.k ?? 1;
  const others = values.filter((_, i) => i !== target);
  if (!others.every(ok)) return null;

  switch (calc.relation) {
    case "RATIO2": {
      // X = (A / B) * k
      const [A, B, X] = values;
      if (target === 2) return mul(div(A, B), k);
      if (target === 1) return div(mul(A, k), X);
      return div(mul(X, B), k);
    }
    case "ROI2": {
      // X = ((A - B) / B) * 100
      const [A, B, X] = values;
      if (target === 2) return mul(div(sub(A, B), B), 100);
      if (target === 0) return mul(B, add(1, div(X, 100)));
      return div(A, add(1, div(X, 100)));
    }
    case "INVERSE1": {
      // X = k / A
      const [A, X] = values;
      return target === 1 ? div(k, A) : div(k, X);
    }
    case "PRODUCT2_SCALED":
    case "PRODUCT3":
      return solveProduct(calc, values, target);
  }
}

/**
 * X = (A·sA) × (B·sB) [× (C·sC)], where each factor's optional `scale`
 * defaults to 1. PRODUCT2_SCALED is the two-factor case with B scaled
 * (e.g. 0.01 for a percent); PRODUCT3 the three-factor case.
 */
function solveProduct(calc: Calculator, values: Value[], target: number): Value {
  const last = calc.vars.length - 1;
  const scaled = (i: number) => mul(values[i], calc.vars[i].scale ?? 1);
  const factors = calc.vars.slice(0, last).map((_, i) => i);

  if (target === last) {
    return factors.reduce<Value>((acc, i) => mul(acc, scaled(i)), 1);
  }
  const rest = factors.filter((i) => i !== target).reduce<Value>((acc, i) => mul(acc, scaled(i)), 1);
  return div(div(values[last], rest), calc.vars[target].scale ?? 1);
}

function mul(a: Value, b: Value): Value {
  return ok(a) && ok(b) ? finite(a * b) : null;
}
function add(a: Value, b: Value): Value {
  return ok(a) && ok(b) ? finite(a + b) : null;
}
function sub(a: Value, b: Value): Value {
  return ok(a) && ok(b) ? finite(a - b) : null;
}
