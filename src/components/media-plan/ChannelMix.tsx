"use client";

import { fmtMoney } from "@/lib/mediaPlan/format";
import { channelBudget } from "@/lib/mediaPlan/plan";
import type { Channel, ChannelKey } from "@/lib/mediaPlan/types";
import { BAD, btnSecondary, card, OK } from "./ui";

type Props = {
  channels: Channel[];
  budget: number;
  currency: string;
  onPct: (key: ChannelKey, pct: number) => void;
  onAutoAllocate: () => void;
  onReset: () => void;
};

export function ChannelMix({ channels, budget, currency, onPct, onAutoAllocate, onReset }: Props) {
  const total = channels.reduce((s, c) => s + c.pct, 0);
  const ok = total === 100;
  const cols = "sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_3.5rem_minmax(6.5rem,auto)]";

  return (
    <section aria-labelledby="mpg-mix" className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="mpg-mix" className="text-2xl font-bold tracking-[-0.03em]">
          Channel mix
        </h2>
        <p aria-live="polite" className="rounded-full px-3 py-1 font-mono text-sm font-semibold text-white" style={{ background: ok ? OK : BAD }}>
          Allocated: {total}% / 100%
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onAutoAllocate} className={btnSecondary}>
          Auto-allocate to goal
        </button>
        <button type="button" onClick={onReset} className={btnSecondary}>
          Reset to defaults
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">Distributes budget based on the selected objective above.</p>

      <div className="mt-5">
        <div aria-hidden className={`hidden gap-4 border-b-2 border-ink pb-2 font-display text-xs font-semibold tracking-[0.08em] uppercase sm:grid ${cols}`}>
          <span>Channel</span>
          <span>Allocation</span>
          <span className="text-right">Share</span>
          <span className="text-right">Budget</span>
        </div>
        <ul className="divide-y divide-ink/10">
          {channels.map((c) => (
            <li key={c.key} className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-2 py-3 ${cols}`}>
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ background: c.color }} />
                <span className="truncate font-display font-semibold">{c.name}</span>
                <span className="shrink-0 rounded-full bg-ink/[0.07] px-2 py-0.5 text-xs text-muted">{c.funnel}</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={c.pct}
                onChange={(e) => onPct(c.key, Number(e.target.value))}
                aria-label={`${c.name} allocation`}
                aria-valuetext={`${c.pct}%, ${fmtMoney(channelBudget(budget, c), currency)}`}
                className="order-last col-span-3 w-full sm:order-none sm:col-span-1"
                style={{ accentColor: c.color }}
              />
              <span className="text-right font-mono text-sm tabular-nums">{c.pct}%</span>
              <span className="text-right font-mono text-sm tabular-nums">{fmtMoney(channelBudget(budget, c), currency)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
