"use client";

import { fmtMoney, fmtNum } from "@/lib/mediaPlan/format";
import { channelBudget, impressions, reach } from "@/lib/mediaPlan/plan";
import { evaluatePerf, type Perf } from "@/lib/mediaPlan/performance";
import type { CampaignSetup, Channel, Grade } from "@/lib/mediaPlan/types";
import { btnSecondary, card } from "./ui";

type Props = { channels: Channel[]; setup: CampaignSetup; grade: Grade; weeks: number; perf: Perf };

export function SummaryTable({ channels, setup, grade, weeks, perf }: Props) {
  const { budget, currency } = setup;
  const ev = evaluatePerf(perf, channels, budget, currency);
  const cac = perf.goal === "cac";
  const effOf = (key: string) => ev.rows.find((r) => r.id === key)!;
  const showEff = (v: number | null) => (v === null ? "—" : cac ? fmtMoney(v, currency) : `${v.toFixed(2)}×`);
  const showRes = (v: number) => (cac ? fmtNum(v) : fmtMoney(v, currency));
  const rows = channels
    .filter((c) => c.pct > 0)
    .map((c) => ({ c, spend: channelBudget(budget, c), imps: impressions(budget, currency, c), reach: reach(budget, currency, c) }));
  const total = rows.reduce((t, r) => ({ pct: t.pct + r.c.pct, spend: t.spend + r.spend, imps: t.imps + r.imps, reach: t.reach + r.reach }), { pct: 0, spend: 0, imps: 0, reach: 0 });

  const exportJson = () => {
    const plan = {
      campaign: setup.campaignName,
      objective: setup.objective,
      budget,
      currency,
      flight: { start: setup.startDate, end: setup.endDate, weeks },
      markets: setup.geos,
      grade,
      performance: { goal: perf.goal, target: ev.target, blended: ev.blended, onTarget: ev.onTarget, [cac ? "customers" : "revenue"]: Math.round(ev.totalResults) },
      channels: channels.map((c) => ({ key: c.key, name: c.name, funnel: c.funnel, pct: c.pct, budget: Math.round(channelBudget(budget, c)), flightStartPct: c.start, flightEndPct: c.end })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(setup.campaignName || "media-plan").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "media-plan"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section aria-labelledby="mpg-sum" className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="mpg-sum" className="text-2xl font-bold tracking-[-0.03em]">
          Plan summary
        </h2>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} className={btnSecondary}>
            Print / save as PDF
          </button>
          <button type="button" onClick={exportJson} className={btnSecondary}>
            Export plan as JSON
          </button>
        </div>
      </div>
      <div className="relative mt-4 overflow-x-auto">
        <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink font-display">
              <th scope="col" className="py-2 pr-3 font-semibold">Channel</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Funnel</th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">Share</th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">Budget</th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">Est. impressions</th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">Est. reach</th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">Est. {cac ? "customers" : "revenue"}</th>
              <th scope="col" className="py-2 text-right font-semibold">{cac ? "CAC" : "ROAS"}</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {rows.map(({ c, spend, imps, reach }) => (
              <tr key={c.key} className="border-b border-ink/10">
                <th scope="row" className="py-2.5 pr-3 font-sans font-semibold">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ background: c.color }} />
                    {c.name}
                  </span>
                </th>
                <td className="py-2.5 pr-3 font-sans text-muted">{c.funnel}</td>
                <td className="py-2.5 pr-3 text-right">{c.pct}%</td>
                <td className="py-2.5 pr-3 text-right">{fmtMoney(spend, currency)}</td>
                <td className="py-2.5 pr-3 text-right">{fmtNum(imps)}</td>
                <td className="py-2.5 pr-3 text-right">{fmtNum(reach)}</td>
                <td className="py-2.5 pr-3 text-right">{showRes(effOf(c.key).results)}</td>
                <td className="py-2.5 text-right">{showEff(effOf(c.key).efficiency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-mono font-semibold tabular-nums">
            <tr className="border-t-2 border-ink">
              <th scope="row" colSpan={2} className="py-2.5 pr-3 font-display">Total</th>
              <td className="py-2.5 pr-3 text-right">{total.pct}%</td>
              <td className="py-2.5 pr-3 text-right">{fmtMoney(total.spend, currency)}</td>
              <td className="py-2.5 pr-3 text-right">{fmtNum(total.imps)}</td>
              <td className="py-2.5 pr-3 text-right">{fmtNum(total.reach)}</td>
              <td className="py-2.5 pr-3 text-right">{showRes(ev.totalResults)}</td>
              <td className="py-2.5 text-right">
                {showEff(ev.blended)}
                {ev.onTarget !== null && (
                  <span className="block font-sans text-xs font-semibold" style={{ color: ev.onTarget ? "#15803d" : "#b91c1c" }}>
                    <span aria-hidden>{ev.onTarget ? "✓ " : "× "}</span>
                    {ev.onTarget ? "On" : "Misses"} target {showEff(ev.target)}
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">{cac ? "Customers and CAC" : "Revenue and ROAS"} come from the assumptions under Performance targets. Reach is impressions ÷ average frequency per channel. The total adds channels together, so people reached by several channels are counted more than once.</p>
    </section>
  );
}
