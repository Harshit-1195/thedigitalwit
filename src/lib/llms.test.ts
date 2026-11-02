import { describe, expect, it } from "vitest";
import { calculatorHref, SIDES } from "./calculators/data";
import { llmsFullTxt, llmsTxt } from "./llms";
import { NAV_GROUPS } from "./site";

describe("llms.txt", () => {
  const index = llmsTxt();
  const full = llmsFullTxt();

  it("starts with the site name and a summary, per llmstxt.org", () => {
    expect(index).toMatch(/^# thedigitalwit\n\n> /);
  });

  it("links every tool and every calculator", () => {
    for (const l of NAV_GROUPS.flatMap((g) => g.links)) expect(index).toContain(`${l.href})`);
    for (const side of ["buy", "sell"] as const)
      for (const c of SIDES[side].calculators) expect(index).toContain(`${calculatorHref(side, c.id)})`);
  });

  it("includes every formula in the full version", () => {
    for (const side of ["buy", "sell"] as const) for (const c of SIDES[side].calculators) expect(full).toContain(c.formulaDisplay);
  });
});
