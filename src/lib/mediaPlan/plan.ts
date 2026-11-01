import { toUSD } from "./format";
import type { Channel } from "./types";

export const channelBudget = (budget: number, c: Channel) => (budget * c.pct) / 100;

/** Estimated impressions from the USD budget and the channel's CPM. */
export const impressions = (budget: number, currency: string, c: Channel) => (c.cpm ? (toUSD(channelBudget(budget, c), currency) / c.cpm) * 1000 : 0);

export const reach = (budget: number, currency: string, c: Channel) => (c.freq ? impressions(budget, currency, c) / c.freq : 0);

/** First live week (0-based) and number of live weeks for a channel. */
export function flightWeeks(c: Channel, weeks: number) {
  return { first: Math.round((c.start / 100) * weeks), duration: Math.max(1, Math.round(((c.end - c.start) / 100) * weeks)) };
}

/** Week-by-week spend per active channel, spread evenly over each channel's own flight. */
export function pacing(channels: Channel[], budget: number, weeks: number) {
  const active = channels.filter((c) => c.pct > 0);
  const spans = active.map((c) => ({ c, ...flightWeeks(c, weeks) }));
  const length = Math.max(weeks, ...spans.map((s) => s.first + s.duration));
  return Array.from({ length }, (_, w) => {
    const row: Record<string, number | string> = { week: `W${w + 1}` };
    for (const s of spans) row[s.c.key] = w >= s.first && w < s.first + s.duration ? channelBudget(budget, s.c) / s.duration : 0;
    return row;
  });
}

/** Week number shown in the timeline inputs, and back to a percentage. */
export const pctToWeek = (pct: number, weeks: number) => Math.round((pct / 100) * weeks);
export const weekToPct = (week: number, weeks: number) => Math.round((week / weeks) * 100);
