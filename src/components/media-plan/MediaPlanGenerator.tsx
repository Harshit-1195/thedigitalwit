"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ALLOCATION_PROFILES, DEFAULT_CHANNELS, DEFAULT_GEOS } from "@/lib/mediaPlan/constants";
import { addDays, currencyRate, fmtMoney, isoDaysFromNow, weeksBetween } from "@/lib/mediaPlan/format";
import { computeGrade } from "@/lib/mediaPlan/grading";
import type { CampaignSetup as Setup, Channel, ChannelKey } from "@/lib/mediaPlan/types";
import { CampaignSetup } from "./CampaignSetup";
import { ChannelMix } from "./ChannelMix";
import { ChartsPanel } from "./ChartsPanel";
import { FlightTimeline } from "./FlightTimeline";
import { GradePanel } from "./GradePanel";
import { SummaryTable } from "./SummaryTable";
import { btnPrimary } from "./ui";
import { DescribeBox } from "@/components/ai/DescribeBox";
import { MEDIA_PLAN_SPEC } from "@/lib/ai/specs";
import type { Filled } from "@/lib/ai/fill";
import { toPercent } from "@/lib/gtm/build";
import { SaveBar } from "@/components/auth/SaveBar";
import { DEFAULT_ASSUMPTIONS, DEFAULT_PERF, evaluatePerf, optimalPct, type Perf } from "@/lib/mediaPlan/performance";
import { PerformancePanel } from "./PerformancePanel";

/** What a saved plan holds. Plans saved by the retired Media Planning tool had a different shape (OldPlan). */
type SavedPlan = { setup: Setup; channels: Channel[]; perf: Perf };
type OldPlan = { budget: number; goal: Perf["goal"]; targets: Perf["target"]; scope: string[]; assumptions: Record<string, { cac: number; roas: number }> };
const OLD_IDS: Record<ChannelKey, string> = { social: "social", progDisplay: "display", native: "native", ctv: "ctv", audio: "audio", dooh: "dooh", youtube: "video" };

/** Start is today + 14 days, end is start + 56 days. */
function defaultSetup(withDates: boolean): Setup {
  const startDate = withDates ? isoDaysFromNow(14) : "";
  return {
    campaignName: "Spring Launch 2027",
    objective: "Full-funnel",
    budget: 250_000,
    currency: "USD",
    startDate,
    endDate: withDates ? addDays(startDate, 56) : "",
    geos: [...DEFAULT_GEOS],
  };
}

export function MediaPlanGenerator() {
  // Dates depend on "today", so they're filled in after hydration to keep server and client markup identical.
  const [setup, setSetup] = useState<Setup>(() => defaultSetup(false));
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [perf, setPerf] = useState<Perf>(DEFAULT_PERF);
  const [generated, setGenerated] = useState(false);
  const [scrollTick, setScrollTick] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSetup((s) => (s.startDate ? s : { ...s, startDate: defaultSetup(true).startDate, endDate: defaultSetup(true).endDate }));
  }, []);

  const { weeks } = weeksBetween(setup.startDate, setup.endDate);
  const allocated = channels.reduce((s, c) => s + c.pct, 0);
  const grade = useMemo(() => computeGrade(channels, setup.geos.length, weeks, setup.budget, setup.currency), [channels, setup.geos.length, weeks, setup.budget, setup.currency]);

  const blockers = [
    allocated !== 100 && `allocation is ${allocated}%, not 100%`,
    !setup.geos.length && "no market is selected",
    !(setup.budget > 0) && "the budget is 0",
  ].filter((x): x is string => !!x);
  const canGenerate = blockers.length === 0;
  const showReport = generated && canGenerate;

  useEffect(() => {
    if (scrollTick) reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollTick]);

  const patchSetup = (patch: Partial<Setup>) => setSetup((s) => ({ ...s, ...patch }));
  const patchChannel = (key: ChannelKey, patch: Partial<Channel>) => setChannels((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const autoAllocate = () => {
    const profile = ALLOCATION_PROFILES[setup.objective];
    setChannels((cs) => cs.map((c) => ({ ...c, pct: profile[c.key] })));
  };
  const fromDescription = (v: Filled) => {
    const objective = (typeof v.objective === "string" ? v.objective : setup.objective) as Setup["objective"];
    const startDate = typeof v.startDate === "string" ? v.startDate : setup.startDate;
    const endDate = typeof v.endDate === "string" ? v.endDate : typeof v.weeks === "number" && v.weeks > 0 ? addDays(startDate, Math.round(v.weeks * 7)) : setup.endDate;
    const next: Setup = {
      ...setup,
      objective,
      startDate,
      endDate: endDate > startDate ? endDate : addDays(startDate, 56),
      ...(typeof v.campaignName === "string" && { campaignName: v.campaignName.slice(0, 80) }),
      ...(typeof v.budget === "number" && v.budget > 0 && { budget: v.budget }),
      ...(typeof v.currency === "string" && { currency: v.currency }),
      ...(Array.isArray(v.geos) && v.geos.length && { geos: v.geos as string[] }),
    };
    setSetup(next);
    const goal = v.goal === "cac" || v.goal === "roas" ? v.goal : typeof v.cac === "number" ? "cac" : typeof v.roas === "number" ? "roas" : null;
    if (goal || typeof v.cac === "number" || typeof v.roas === "number")
      setPerf((p) => ({
        ...p,
        goal: goal ?? p.goal,
        target: { cac: typeof v.cac === "number" && v.cac > 0 ? v.cac / currencyRate(next.currency) : p.target.cac, roas: typeof v.roas === "number" && v.roas > 0 ? v.roas : p.target.roas },
      }));
    // Stated shares are kept; whatever is left goes to the other channels in the objective's proportions.
    const profile = ALLOCATION_PROFILES[objective];
    const given = Object.fromEntries(channels.filter((c) => typeof v[`pct_${c.key}`] === "number").map((c) => [c.key, v[`pct_${c.key}`] as number]));
    const givenTotal = Object.values(given).reduce((s, x) => s + x, 0);
    if (Object.keys(given).length && givenTotal <= 100) {
      const rest = channels.filter((c) => !(c.key in given));
      const restWeight = rest.reduce((s, c) => s + profile[c.key], 0) || 1;
      const raw = channels.map((c) => (c.key in given ? given[c.key] : ((100 - givenTotal) * profile[c.key]) / restWeight));
      const pct = toPercent(raw);
      setChannels((cs) => cs.map((c, i) => ({ ...c, pct: pct[i] })));
    } else if (typeof v.objective === "string") {
      setChannels((cs) => cs.map((c) => ({ ...c, pct: profile[c.key] })));
    }
    setGenerated(true);
    setScrollTick((t) => t + 1);
  };
  const optimise = (p: Perf = perf) => {
    const pct = optimalPct(p, channels, setup.budget, setup.currency);
    setChannels((cs) => cs.map((c, i) => ({ ...c, pct: pct[i] })));
  };
  const reset = () => {
    setChannels(DEFAULT_CHANNELS);
    setSetup(defaultSetup(true));
    setPerf(DEFAULT_PERF);
    setGenerated(false);
  };
  const restore = (p: SavedPlan | OldPlan) => {
    if ("setup" in p) {
      setSetup({ ...defaultSetup(true), ...p.setup });
      setChannels(DEFAULT_CHANNELS.map((d) => ({ ...d, ...p.channels.find((c) => c.key === d.key) })));
      setPerf({ ...DEFAULT_PERF, ...p.perf });
      return;
    }
    // A Media Planning plan: budget, goal, targets and assumptions carry over; the channels it had in scope get the optimal split.
    const next: Perf = {
      goal: p.goal ?? "cac",
      target: { ...DEFAULT_PERF.target, ...p.targets },
      assumptions: Object.fromEntries(Object.entries(OLD_IDS).map(([k, id]) => [k, p.assumptions?.[id] ?? DEFAULT_ASSUMPTIONS[k as ChannelKey]])) as Perf["assumptions"],
    };
    setSetup((s) => ({ ...s, budget: p.budget, currency: "USD" }));
    setPerf(next);
    const keys = (Object.keys(OLD_IDS) as ChannelKey[]).filter((k) => p.scope?.includes(OLD_IDS[k]));
    const pct = optimalPct(next, channels, p.budget, "USD", keys.length ? keys : undefined);
    setChannels((cs) => cs.map((c, i) => ({ ...c, pct: pct[i] })));
  };

  return (
    <div className="wrap space-y-8 pb-20">
      <DescribeBox spec={MEDIA_PLAN_SPEC} intro="Say the objective, budget, markets, dates and any channel shares you already know. The plan is filled in and generated." onApply={fromDescription} />
      <div className="grid gap-6 min-[920px]:grid-cols-[20rem_minmax(0,1fr)] min-[920px]:items-start print:hidden">
        <CampaignSetup setup={setup} onChange={patchSetup} />
        <div className="min-w-0 space-y-6">
          <dl className="glass flex flex-wrap gap-x-8 gap-y-2 rounded-3xl px-5 py-4 sm:px-6">
            {[
              ["Allocated", `${allocated}%`],
              ["Markets", String(setup.geos.length)],
              ["Flight", `${weeks} week${weeks === 1 ? "" : "s"}`],
              ["Objective", setup.objective],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow text-muted">{k}</dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <ChannelMix channels={channels} budget={setup.budget} currency={setup.currency} onPct={(k, pct) => patchChannel(k, { pct })} onAutoAllocate={autoAllocate} onReset={reset} />
          <PerformancePanel perf={perf} setPerf={setPerf} channels={channels} budget={setup.budget} currency={setup.currency} onOptimise={() => optimise()} />
          <FlightTimeline channels={channels} weeks={weeks} startDate={setup.startDate} endDate={setup.endDate} onFlight={(k, patch) => patchChannel(k, patch)} />
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={!canGenerate}
              aria-describedby="mpg-why"
              onClick={() => {
                setGenerated(true);
                setScrollTick((t) => t + 1);
              }}
              className={`${btnPrimary} px-7 py-3 text-lg`}
            >
              Generate plan
            </button>
            <p id="mpg-why" aria-live="polite" className="text-sm text-muted">
              {canGenerate ? "Ready. Generating keeps everything in your browser." : `Can't generate yet: ${blockers.join(", ")}.`}
            </p>
          </div>
          <SaveBar<SavedPlan | OldPlan>
            kind="media_plan"
            path="/media-plan-generator"
            label="Save plan"
            snapshot={() => {
              const ev = evaluatePerf(perf, channels, setup.budget, setup.currency);
              const blended = ev.blended === null ? "—" : perf.goal === "cac" ? `CAC ${fmtMoney(ev.blended, setup.currency)}` : `ROAS ${ev.blended.toFixed(2)}×`;
              return { title: `${setup.campaignName || "Media plan"}: ${fmtMoney(setup.budget, setup.currency)} · ${blended}`, payload: { setup, channels, perf } };
            }}
            restore={restore}
          />
        </div>
      </div>

      {showReport && (
        <div ref={reportRef} className="scroll-mt-24 space-y-6">
          <div className="hidden print:block">
            <h2 className="text-3xl font-bold">{setup.campaignName}</h2>
            <p className="text-muted">
              {setup.objective} · {setup.geos.join(", ")} · {weeks} weeks
            </p>
          </div>
          <GradePanel grade={grade} />
          <ChartsPanel channels={channels} budget={setup.budget} currency={setup.currency} weeks={weeks} />
          <SummaryTable channels={channels} setup={setup} grade={grade} weeks={weeks} perf={perf} />
        </div>
      )}
    </div>
  );
}
