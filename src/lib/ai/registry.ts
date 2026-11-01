// Server-side lookup from a spec id to its spec. Kept apart from specs.ts so tool pages don't bundle every calculator.
import { getCalculator, type Side } from "../calculators/data";
import type { AiSpec } from "./fill";
import { calculatorSpec, DOOH_SPEC, GTM_SPEC, MEDIA_PLAN_SPEC, MMM_SPEC } from "./specs";

const SPECS: Record<string, AiSpec> = { gtm: GTM_SPEC, doohsight: DOOH_SPEC, "media-plan": MEDIA_PLAN_SPEC, mmm: MMM_SPEC };

export function getSpec(id: string): AiSpec | null {
  if (Object.hasOwn(SPECS, id)) return SPECS[id];
  const m = /^calc:(buy|sell):([a-z0-9-]+)$/.exec(id);
  const calc = m && getCalculator(m[1] as Side, m[2]);
  return calc ? calculatorSpec(m![1] as Side, calc) : null;
}
