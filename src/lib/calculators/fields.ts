import { parseNumber } from "./format";
import { solve, type Value } from "./solver";
import type { Calculator } from "./types";

/**
 * Omni-directional field state (PROJECT_SPEC.md §4).
 * - raw[i]:   the text in field i as the user typed it.
 * - touch[i]: 0 = untouched; otherwise the clock value of its latest edit.
 * The target (solved) field is the one with the lowest touch; ties go to the
 * last-declared var, so a fresh calculator solves its named metric.
 */
export type FieldState = {
  raw: string[];
  touch: number[];
  clock: number;
};

export function initFields(calc: Calculator): FieldState {
  const n = calc.vars.length;
  return { raw: Array(n).fill(""), touch: Array(n).fill(0), clock: 0 };
}

export function pickTarget(touch: number[]): number {
  let target = touch.length - 1;
  for (let i = touch.length - 1; i >= 0; i--) {
    if (touch[i] < touch[target]) target = i;
  }
  return target;
}

export type Solved = {
  target: number;
  values: Value[];
  /** The target's computed value, or null while waiting for inputs. */
  result: Value;
};

export function evaluate(calc: Calculator, state: FieldState): Solved {
  const target = pickTarget(state.touch);
  const values = state.raw.map(parseNumber);
  const result = solve(calc, values, target);
  values[target] = result;
  return { target, values, result };
}

/**
 * Applies a keystroke to field `index`. Before the edit, the current target's
 * solved value is written into its raw text, so if the target moves away the
 * field keeps showing the number the user saw rather than older input.
 */
export function editField(calc: Calculator, state: FieldState, index: number, text: string): FieldState {
  const { target, result } = evaluate(calc, state);
  const raw = [...state.raw];
  const touch = [...state.touch];
  raw[target] = result === null ? "" : toPlain(result);

  const cleared = text.trim() === "";
  const clock = cleared ? state.clock : state.clock + 1;
  raw[index] = text;
  touch[index] = cleared ? 0 : clock;
  return { raw, touch, clock };
}

/** Fills every var except the last from its default, as "Load example" does. */
export function loadExample(calc: Calculator): FieldState {
  const last = calc.vars.length - 1;
  let state = initFields(calc);
  calc.vars.forEach((v, i) => {
    if (i !== last) state = editField(calc, state, i, toPlain(v.d));
  });
  return state;
}

/** Full-ish precision without exponent noise: 4.1666666667, not 4.166666666666667. */
export function toPlain(n: number): string {
  return String(Number(n.toPrecision(10)));
}
