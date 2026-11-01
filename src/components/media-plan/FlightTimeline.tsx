"use client";

import { fmtDate } from "@/lib/mediaPlan/format";
import { pctToWeek, weekToPct } from "@/lib/mediaPlan/plan";
import type { Channel, ChannelKey } from "@/lib/mediaPlan/types";
import { card } from "./ui";

type Props = {
  channels: Channel[];
  weeks: number;
  startDate: string;
  endDate: string;
  onFlight: (key: ChannelKey, patch: { start?: number; end?: number }) => void;
};

const weekInput = "h-9 w-16 rounded-lg border-2 border-ink bg-white/70 px-2 font-mono text-sm tabular-nums";

export function FlightTimeline({ channels, weeks, startDate, endDate, onFlight }: Props) {
  const step = weeks <= 12 ? 2 : Math.ceil(weeks / 6);
  const ticks = Array.from({ length: Math.floor(weeks / step) + 1 }, (_, i) => i * step);
  const cols = "grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_auto]";

  const setWeek = (c: Channel, which: "start" | "end", week: number) => {
    if (!Number.isFinite(week)) return;
    const pct = Math.min(100, Math.max(0, weekToPct(Math.min(weeks, Math.max(0, week)), weeks)));
    // Keep at least 1 percentage point between start and end.
    if (which === "start") onFlight(c.key, { start: Math.min(pct, c.end - 1) });
    else onFlight(c.key, { end: Math.max(pct, c.start + 1) });
  };

  return (
    <section aria-labelledby="mpg-tl" className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="mpg-tl" className="text-2xl font-bold tracking-[-0.03em]">
          Flight timeline
        </h2>
        <p className="font-mono text-sm text-muted">
          {fmtDate(startDate)} – {fmtDate(endDate)} · {weeks} week{weeks === 1 ? "" : "s"}
        </p>
      </div>
      <p className="mt-2 text-sm text-muted">Each bar shows the weeks that channel is live. Adjust Start wk / End wk to stagger a channel — for example, delaying retargeting until week 3.</p>

      <div className="mt-5">
        <div className={`grid items-end gap-x-4 border-b-2 border-ink pb-2 font-display text-xs font-semibold tracking-[0.08em] uppercase ${cols}`}>
          <span>Channel</span>
          <span>
            Flight
            <span aria-hidden className="relative mt-2 block h-4 font-mono text-[0.65rem] font-normal tracking-normal text-muted normal-case">
              {ticks.map((w) => (
                <span key={w} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${(w / weeks) * 100}%` }}>
                  W{w}
                </span>
              ))}
            </span>
          </span>
          <span className="hidden sm:block">Adjust</span>
        </div>
        <ul className="divide-y divide-ink/10">
          {channels.map((c) => (
            <li key={c.key} className={`grid items-center gap-x-4 gap-y-2 py-3 ${cols}`}>
              <span className="truncate font-display text-sm font-semibold">{c.name}</span>
              <span className="relative h-5 rounded-full bg-ink/[0.07]">
                <span
                  aria-hidden
                  className="absolute inset-y-0 rounded-full"
                  style={{ left: `${c.start}%`, width: `${Math.max(1, c.end - c.start)}%`, background: c.color, opacity: c.pct > 0 ? 1 : 0.35 }}
                />
                <span className="sr-only">
                  {c.name} live from week {pctToWeek(c.start, weeks)} to week {pctToWeek(c.end, weeks)}
                </span>
              </span>
              <span className="col-span-2 flex items-center gap-3 sm:col-span-1">
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  Start wk
                  <input type="number" min={0} max={weeks} value={pctToWeek(c.start, weeks)} onChange={(e) => setWeek(c, "start", e.target.valueAsNumber)} aria-label={`${c.name} start week`} className={weekInput} />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  End wk
                  <input type="number" min={0} max={weeks} value={pctToWeek(c.end, weeks)} onChange={(e) => setWeek(c, "end", e.target.valueAsNumber)} aria-label={`${c.name} end week`} className={weekInput} />
                </label>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
