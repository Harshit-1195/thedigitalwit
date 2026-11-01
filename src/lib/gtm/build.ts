// Pure functions that turn the five choices into a GTM plan. No network, no storage.
import { BUDGET_LINES, CHANNEL_IDS, CHANNELS, GEOS, type Budget, type ChannelId, type Geo, type Goal, type Industry, type Motion, type Stage } from "./data";

export type Inputs = { industry: Industry; geo: Geo; goal: Goal; stage: Stage; budget: Budget; notes: string };
export type Severity = "High" | "Medium" | "Low";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Rounds shares to whole percentages that add up to exactly 100 (largest remainder). */
export function toPercent(values: number[]) {
  const total = values.reduce((s, v) => s + v, 0) || 1;
  const raw = values.map((v) => (v / total) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((s, v) => s + v, 0);
  raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => {
    if (left > 0) {
      out[i]++;
      left--;
    }
  });
  return out;
}

export function buildChannelMix({ industry, geo, goal, stage, budget }: Inputs) {
  const weighted = CHANNEL_IDS.map((id) => ({ id, w: industry.mix[id] * (goal.shift[id] ?? 1) * (geo.adjust?.[id] ?? 1) * (stage.shift?.[id] ?? 1) }))
    .filter((c) => c.w > 0)
    .sort((a, b) => b.w - a.w)
    .slice(0, budget.maxChannels);
  const pct = toPercent(weighted.map((c) => c.w));
  return weighted.map((c, i) => ({ id: c.id, label: CHANNELS[c.id].label, pct: pct[i], stack: geo.stack?.[c.id] ?? CHANNELS[c.id].stack }));
}

export function buildBudget({ budget }: Inputs) {
  return BUDGET_LINES.map((label, i) => ({ label, pct: budget.split[i] }));
}

export function buildScorecard({ industry, geo, stage, budget }: Inputs) {
  const budgetIdx = ["b1", "b2", "b3", "b4"].indexOf(budget.id);
  const localStack = Object.keys(geo.stack ?? {}).length;
  return [
    { label: "Ease of entry", score: clamp(geo.ease - (industry.regulation === 2 && geo.ease > 1 ? 1 : 0), 1, 5), note: geo.note },
    { label: "Competitive whitespace", score: clamp(industry.openness, 1, 5), note: industry.whitespace },
    { label: "Regulatory simplicity", score: clamp(5 - industry.regulation * 1.5 - (geo.ease <= 2 ? 1 : 0), 1, 5), note: industry.regulation === 2 ? "Heavily regulated claims: every asset needs review." : industry.regulation === 1 ? "Some category rules on claims and audiences." : "Few category-specific advertising rules." },
    { label: "Channel readiness", score: clamp(5 - (localStack > 3 ? 3 : localStack > 0 ? 1 : 0), 1, 5), note: localStack > 3 ? "Local platforms replace most global ones; new accounts, partners and skills needed." : localStack ? "Some local platforms alongside the global ones." : "Global platforms cover the market." },
    { label: "Budget fit", score: clamp(Math.round(budgetIdx + 2 + stage.fit - (geo.ease <= 2 ? 1 : 0)), 1, 5), note: `${budget.label} funds up to ${budget.maxChannels} channels well at this stage.` },
  ].map((s) => ({ ...s, score: Math.round(s.score) }));
}

export type Phase = { name: string; start: number; end: number; focus: string[]; gate: string; kill: string };

const GATE: Record<string, string> = {
  awareness: "Brand lift is measurable in exposed versus control groups",
  demand: "Cost per qualified opportunity is within 20% of target",
  expansion: "The beachhead segment engages at or above home-market rates",
  retention: "Repeat or renewal rate beats the holdout group",
};

export function buildTimeline({ geo, goal, stage, industry }: Inputs): Phase[] {
  // 26 weeks; set-up stretches for larger organisations and markets that need an in-market lead.
  const f = 3 + stage.setupWeeks + (geo.inMarketLead ? 2 : 0);
  const p = f + 6;
  const s = p + 8;
  return [
    {
      name: "Foundation", start: 1, end: f,
      focus: [
        "Install and verify tracking from ad click to CRM",
        `Validate the ICP and top message with 5–10 target customers in ${geo.label}`,
        "Produce launch creative and landing pages",
        ...(geo.inMarketLead ? ["Hire or appoint the in-market lead; open local platform accounts and partner contracts"] : []),
        ...(industry.regulation === 2 ? ["Agree a claims library with legal and compliance before any asset is made"] : []),
      ],
      gate: "Tracking verified end to end, and customers confirm the core message",
      kill: "Fix tracking or rework the message before spending on media",
    },
    {
      name: "Pilot", start: f + 1, end: p,
      focus: ["Run the top two or three channels at about 30% of planned media", "Test two or three message variants per channel", `Track ${goal.focus} weekly`],
      gate: GATE[goal.id],
      kill: "Stop the weakest channel and move its budget to the best performer",
    },
    {
      name: "Scale", start: p + 1, end: s,
      focus: ["Scale winning channels and add the rest of the mix", "Refresh creative every four to six weeks", "Start lifecycle programmes for new customers"],
      gate: "Unit economics hold at twice the pilot spend",
      kill: "Hold spend at pilot level and fix conversion before scaling",
    },
    {
      name: "Optimise and expand", start: s + 1, end: 26,
      focus: ["Shift budget monthly toward the best cost per outcome", "Test one new segment or market", "Prepare the next six-month plan with finance"],
      gate: "Steering review: continue, expand or re-plan",
      kill: "Re-plan with a narrower segment if targets are missed",
    },
  ];
}

export type Risk = { risk: string; severity: Severity; mitigation: string };

export function buildRiskRegister({ industry, geo, goal, stage, budget }: Inputs): Risk[] {
  const r: Risk[] = [];
  if (geo.ease <= 2) r.push({ risk: `Entry friction in ${geo.label}: local entity, platform accounts, partners and approvals take longer than planned`, severity: "High", mitigation: "Add four to six weeks to Foundation and secure the in-market lead and partners before media spend." });
  if (geo.fx === "high") r.push({ risk: "FX volatility: a USD budget can gain or lose buying power quickly, and payments may be delayed", severity: "High", mitigation: "Budget in local currency where possible, review rates monthly and hold a 10% contingency." });
  else if (geo.fx === "moderate") r.push({ risk: "Currency movements change local media costs", severity: "Medium", mitigation: "Review FX at each monthly reallocation." });
  if (goal.id === "expansion") r.push({ risk: "Creative may not translate: home-market messages, humour and proof points may not land locally", severity: "High", mitigation: "Use native copywriters, local customer proof and test two or three variants in the pilot." });
  if (goal.id === "retention") r.push({ risk: "CRM data hygiene: duplicates, stale consent and missing purchase data weaken targeting", severity: "High", mitigation: "Clean and de-duplicate the CRM and re-confirm consent before the first campaign." });
  if (industry.regulation === 2) r.push({ risk: "Regulated claims: legal and compliance review slows every asset", severity: "High", mitigation: "Pre-approve a claims library and book review slots in the plan." });
  else if (industry.regulation === 1) r.push({ risk: "Category rules on claims or audiences cause ad rejections", severity: "Medium", mitigation: "Check platform policies for the category before building creative." });
  if (industry.motion === "Retail and channel-led") r.push({ risk: "Retail partners control shelf, pricing and customer data", severity: "Medium", mitigation: "Negotiate data sharing and joint business plans with key retailers." });
  if (budget.maxChannels <= 3) r.push({ risk: goal.id === "awareness" ? "Reach may stay below the level needed to move awareness" : "Budget spread too thin across channels", severity: "Medium", mitigation: "Concentrate on two channels until one proves itself." });
  if (stage.id === "bootstrapped") r.push({ risk: "Cash flow: media spend runs ahead of the revenue it brings in", severity: "High", mitigation: "Set the longest payback you can fund from cash, scale only channels inside it, and pause any that miss it two months running." });
  if (stage.id === "startup" || stage.id === "bootstrapped") r.push({ risk: "Founder bandwidth becomes the bottleneck for sales and content", severity: "Medium", mitigation: "Hand channel execution to one owner and keep the founder on message and key deals." });
  if (stage.id === "enterprise") r.push({ risk: "Slow internal approvals delay launch and learning", severity: "Medium", mitigation: "Agree decision rights and gate dates with the steering committee up front." });
  r.push({ risk: "Signal loss (cookie limits, app tracking consent) weakens attribution", severity: "Medium", mitigation: "Add server-side conversions, a holdout test and a simple marketing mix read." });
  r.push({ risk: "Creative fatigue after six to eight weeks", severity: "Low", mitigation: "Plan creative refreshes into the Scale phase." });
  r.push({ risk: "Vendor sprawl in the stack", severity: "Low", mitigation: "One owner approves every new tool against a use case." });
  const order: Record<Severity, number> = { High: 0, Medium: 1, Low: 2 };
  return r.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function buildCompliance({ industry, geo }: Inputs) {
  const extra: string[] = [];
  if (industry.id === "health") extra.push(geo.id === "na" ? "FDA rules for direct-to-consumer prescription drug ads: fair balance and the major statement" : "Prescription medicines generally can't be advertised directly to consumers; check local rules");
  if (industry.id === "finance") extra.push("Financial promotions must be fair, clear and not misleading, with representative examples where required");
  if (industry.id === "gaming") extra.push("Age ratings and protections for minors; disclose paid random items (loot boxes) where required");
  if (industry.id === "education" && geo.id === "na") extra.push("COPPA for under-13s; FERPA for student records");
  return [...geo.compliance, ...extra];
}

const firstClause = (s: string) => s.split(/[,;.]/)[0].trim();
/** Lower-cases a leading capital unless it starts an acronym ("B2B SaaS" stays). */
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

export function buildNarrative({ industry, geo, goal, stage, notes }: Inputs) {
  const audience = notes.trim() ? firstClause(notes.trim()) : "";
  const icp = audience ? `${audience} in ${geo.label} (${lowerFirst(industry.label)})` : `${industry.buyer} in ${geo.label}`;
  const motion: Motion = stage.motion ?? industry.motion;
  const pillars: [string, string, string] = [audience ? `Built for ${audience}` : industry.pillars[0], industry.pillars[1], industry.pillars[2]];
  return {
    positioning: `For ${icp}, [your brand] is the ${lowerFirst(industry.label)} choice with one clear promise: ${pillars[0].charAt(0).toLowerCase()}${pillars[0].slice(1)}. ${industry.angle}`,
    pillars,
    whitespace: industry.whitespace,
    angle: industry.angle,
    icp,
    notes: notes.trim(),
    committee: industry.committee,
    motion,
    pricing: industry.pricing,
    sizing: `Size the market bottom-up: count the ${audience || "buyers"} in ${geo.label} who match the ICP, apply a realistic adoption rate from your own funnel data, and multiply by average order or contract value. Cross-check with search demand and any panel or industry data you trust.`,
    localisation: geo.localisation,
    focus: goal.focus,
    quickWin: goal.quickWin,
  };
}

export function buildGovernance({ geo, stage }: Inputs) {
  return {
    org: stage.org,
    governance: stage.governance,
    inMarket: geo.inMarketLead ? `Appoint an in-market lead for ${geo.label} with authority over platforms, creative and partners; the central team sets goals and guardrails, the local team decides how.` : null,
  };
}

/** The same plan in every geography, so markets can be compared on equal terms. No market-size figures. */
export function buildGeoBenchmark(i: Inputs) {
  return GEOS.map((geo) => {
    const g = { ...i, geo };
    const scorecard = buildScorecard(g);
    const timeline = buildTimeline(g);
    return {
      id: geo.id,
      label: geo.label,
      overall: Math.round((scorecard.reduce((s, c) => s + c.score, 0) / scorecard.length) * 10) / 10,
      scores: scorecard.map((c) => ({ label: c.label, score: c.score })),
      fx: geo.fx,
      inMarketLead: geo.inMarketLead,
      firstGate: timeline[0].end,
      highRisks: buildRiskRegister(g).filter((r) => r.severity === "High").length,
      rules: buildCompliance(g).length,
      topChannels: buildChannelMix(g).slice(0, 3).map((c) => c.label),
      localPlatforms: Object.keys(geo.stack ?? {}).length,
      note: geo.note,
    };
  }).sort((a, b) => b.overall - a.overall || a.firstGate - b.firstGate || a.label.localeCompare(b.label));
}
export type GeoBenchmark = ReturnType<typeof buildGeoBenchmark>;

export function buildPlan(i: Inputs) {
  return {
    mix: buildChannelMix(i),
    budget: buildBudget(i),
    scorecard: buildScorecard(i),
    timeline: buildTimeline(i),
    risks: buildRiskRegister(i),
    compliance: buildCompliance(i),
    narrative: buildNarrative(i),
    governance: buildGovernance(i),
    kpis: i.industry.kpis,
  };
}

export type Plan = ReturnType<typeof buildPlan>;
export type { ChannelId };
