"use client";

import { useId } from "react";
import { NumberField, Segmented } from "@/components/tools/fields";
import { currencyRate, fmtMoney, fmtNum } from "@/lib/mediaPlan/format";
import { evaluatePerf, type Perf } from "@/lib/mediaPlan/performance";
import type { Channel } from "@/lib/mediaPlan/types";
import type { Goal } from "@/lib/planning/media-plan";
import { BAD, btnSecondary, card, OK } from "./ui";

type Props = { perf: Perf; setPerf: (p: Perf) => void; channels: Channel[]; budget: number; currency: string; onOptimise: () => void };

/** Target CAC or ROAS, the plan's blended result against it, and the channel assumptions behind it. */
export function PerformancePanel({ perf, setPerf, channels, budget, currency, onOptimise }: Props) {
  const id = useId();
  const rate = currencyRate(currency);
  const ev = evaluatePerf(perf, channels, budget, currency);
  const cac = perf.goal === "cac";
  const symbol = fmtMoney(0, currency).replace(/[\d.,\s]/g, "");
  const show = (v: number | null) => (v === null ? "—" : cac ? fmtMoney(v, currency) : `${v.toFixed(2)}×`);
  const gapText = ev.gap === null ? "" : Math.abs(ev.gap) < 0.005 ? "right on target" : `${Math.abs(ev.gap * 100).toFixed(0)}% ${ev.gap > 0 ? "worse than" : "better than"} target`;

  return (
    <section aria-labelledby={`${id}-h`} className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id={`${id}-h`} className="text-2xl font-bold tracking-[-0.03em]">
          Performance targets
        </h2>
        <button type="button" onClick={onOptimise} className={btnSecondary}>
          Optimise split for {cac ? "lowest CAC" : "highest ROAS"}
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">What this split should deliver in customers or revenue, against your target. The optimise button rewrites the channel shares above.</p>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <Segmented<Goal>
          label="Optimise for"
          value={perf.goal}
          onChange={(goal) => setPerf({ ...perf, goal })}
          options={[
            { value: "cac", label: "Target CAC" },
            { value: "roas", label: "Target ROAS" },
          ]}
        />
        <NumberField
          key={perf.goal + currency}
          label={cac ? "Target CAC (cost per customer)" : "Target ROAS (revenue ÷ spend)"}
          prefix={cac ? symbol : undefined}
          suffix={cac ? undefined : "x"}
          value={cac ? Math.round(perf.target.cac * rate * 100) / 100 : perf.target.roas}
          onChange={(v) => setPerf({ ...perf, target: cac ? { ...perf.target, cac: v / rate } : { ...perf.target, roas: v } })}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-white/70 p-4" aria-live="polite">
        <div>
          <p className="eyebrow text-muted">Blended {cac ? "CAC" : "ROAS"}</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums">{show(ev.blended)}</p>
        </div>
        <div>
          <p className="eyebrow text-muted">{cac ? "Customers" : "Revenue"}</p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{cac ? fmtNum(ev.totalResults) : fmtMoney(ev.totalResults, currency)}</p>
        </div>
        {ev.onTarget !== null && (
          <p className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-display text-sm font-semibold text-white" style={{ background: ev.onTarget ? OK : BAD }}>
            <span aria-hidden>{ev.onTarget ? "✓" : "×"}</span>
            {ev.onTarget ? "On target" : "Misses target"}: {gapText} ({show(ev.target)})
          </p>
        )}
      </div>

      <div className="relative mt-4 overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink font-display">
              <th scope="col" className="py-2 pr-3 font-semibold">Channel</th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">Assumed {cac ? "CAC" : "ROAS"}</th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">At this spend</th>
              <th scope="col" className="py-2 text-right font-semibold">{cac ? "Customers" : "Revenue"}</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {channels.map((c, i) => {
              const row = ev.rows[i];
              const a = perf.assumptions[c.key];
              return (
                <tr key={c.key} className="border-b border-ink/10">
                  <th scope="row" className="py-2 pr-3 font-sans font-semibold">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ background: c.color }} />
                      {c.name}
                    </span>
                  </th>
                  <td className="w-36 py-2 pr-3">
                    <NumberField
                      compact
                      key={perf.goal + currency}
                      label={`${c.name} assumed ${cac ? "CAC" : "ROAS"}`}
                      prefix={cac ? symbol : undefined}
                      suffix={cac ? undefined : "x"}
                      value={cac ? Math.round(a.cac * rate * 100) / 100 : a.roas}
                      onChange={(v) => setPerf({ ...perf, assumptions: { ...perf.assumptions, [c.key]: cac ? { ...a, cac: v / rate } : { ...a, roas: v } } })}
                    />
                  </td>
                  <td className="py-2 pr-3 text-right">{c.pct > 0 ? show(row.efficiency) : "—"}</td>
                  <td className="py-2 text-right">{c.pct > 0 ? (cac ? fmtNum(row.results) : fmtMoney(row.results, currency)) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        Assumptions are illustrative placeholders, not industry data: replace them with your own. Each channel delivers its assumed {cac ? "CAC" : "ROAS"} at an even split, with diminishing returns beyond that (doubling a channel&apos;s spend brings about 41% more results). The optimal split puts spend in proportion to {cac ? "(1 ÷ CAC)²" : "ROAS²"}.
      </p>
    </section>
  );
}
