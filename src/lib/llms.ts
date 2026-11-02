import { calculatorHref, getCategory, oneLiner, SIDES, type Side } from "./calculators/data";
import type { Calculator } from "./calculators/types";
import { NAV_GROUPS, SITE, SITE_URL } from "./site";

// Builds /llms.txt (an index of the site for AI assistants, per llmstxt.org) and
// /llms-full.txt (the same plus every calculator's formula and explanation), straight from the site data.

const url = (path: string) => `${SITE_URL}${path}`;

const INTRO = `# ${SITE.name}

> ${SITE.tagline} KPI calculators for media buyers and publishers, plus planning, measurement and creative tools. No paywall and no login needed; most tools run entirely in the browser.

Each calculator solves for any one of its values from the others, shows the formula and a worked example. Benchmarks and default values on the site are illustrative starting points, not verified industry data.`;

function sideSection(side: Side, full: boolean) {
  const meta = SIDES[side];
  const lines = [`## ${meta.label} calculators`, "", `Hub: [${meta.label} calculators](${url(meta.hub)})`];
  for (const cat of meta.categories) {
    const calcs = meta.calculators.filter((c) => c.cat === cat.code);
    if (!calcs.length) continue;
    lines.push("", `### ${cat.label}`, "");
    for (const c of calcs) lines.push(full ? calculatorDetail(side, c) : `- [${c.name} calculator](${url(calculatorHref(side, c.id))}): ${oneLiner(c)}`);
  }
  return lines.join("\n");
}

function calculatorDetail(side: Side, c: Calculator) {
  const inputs = c.vars.map((v) => `${v.label} (${v.unit})`).join(", ");
  return [
    `#### ${c.name}`,
    "",
    `- Page: ${url(calculatorHref(side, c.id))}`,
    `- Vertical: ${getCategory(side, c.cat).label}`,
    `- Formula: ${c.formulaDisplay}`,
    `- Values: ${inputs}`,
    "",
    c.about,
    "",
  ].join("\n");
}

function toolsSection() {
  return NAV_GROUPS.map((g) => [`## ${g.label}`, "", ...g.links.map((l) => `- [${l.label}](${url(l.href)}): ${l.blurb}`)].join("\n")).join("\n\n");
}

const OPTIONAL = `## Optional

- [Privacy policy](${url("/privacy")}): what data the site collects and why.
- [Terms of use](${url("/terms")}): results are estimates, not professional advice.
- [Full calculator reference](${url("/llms-full.txt")}): every formula and explanation in one file.`;

export function llmsTxt() {
  return [INTRO, toolsSection(), sideSection("buy", false), sideSection("sell", false), OPTIONAL].join("\n\n") + "\n";
}

export function llmsFullTxt() {
  return [INTRO, toolsSection(), sideSection("buy", true), sideSection("sell", true)].join("\n\n") + "\n";
}
