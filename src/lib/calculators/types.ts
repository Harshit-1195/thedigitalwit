// Shape of each entry in buyside-calculators.json / sellside-calculators.json
// (PROJECT_SPEC.md §4). The LAST var is the named output metric, but every var
// is equally solvable.

export type Relation = "RATIO2" | "ROI2" | "INVERSE1" | "PRODUCT2_SCALED" | "PRODUCT3";

export type CalcVar = {
  key: string;
  label: string;
  /** "$", "%", "x", "#" or a short word such as "yrs". */
  unit: string;
  /** Default value, used by "Load example" and the worked example. */
  d: number;
  /** Multiplier applied before multiplying, e.g. 0.01 for a percent input. */
  scale?: number;
};

export type Calculator = {
  id: string;
  cat: string;
  name: string;
  relation: Relation;
  k?: number;
  vars: CalcVar[];
  about: string;
  formulaDisplay: string;
};

/** Number of vars each relation expects. */
export const RELATION_ARITY: Record<Relation, number> = {
  RATIO2: 3,
  ROI2: 3,
  INVERSE1: 2,
  PRODUCT2_SCALED: 3,
  PRODUCT3: 4,
};
