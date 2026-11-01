import { ACTIVATION_FLOOR_USD, UPPER_FUNNEL_KEYS, VIDEO_ATTENTION_KEYS } from "./constants";
import { toUSD } from "./format";
import type { Channel, Grade, GradeFactor, Letter } from "./types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeGrade(channels: Channel[], geoCount: number, weeks: number, budget: number, currency: string): Grade {
  const n = channels.length || 1;
  const active = channels.filter((c) => c.pct > 0);
  const shareOf = (keys: string[]) => channels.filter((c) => keys.includes(c.key)).reduce((s, c) => s + c.pct, 0);

  // 1. Diversification: HHI scaled between an even split (1/n) and one channel (1)
  const hhi = channels.reduce((s, c) => s + (c.pct / 100) ** 2, 0);
  const even = 1 / n;
  const diversification = clamp(25 * (1 - (hhi - even) / (1 - even)), 0, 25);

  // 2. Funnel balance
  const upper = shareOf(UPPER_FUNNEL_KEYS);
  const lower = 100 - upper;
  const funnel = clamp(20 * (1 - Math.abs(upper - lower) / 100), 0, 20);

  // 3. Video and attention weight, best at half the budget
  const video = shareOf(VIDEO_ATTENTION_KEYS);
  const attention = clamp(20 * (1 - Math.abs(video - 50) / 50), 0, 20);

  // 4. Geo coverage and 5. timeline
  const geo = Math.min(15, (geoCount / 5) * 15);
  const timeline = Math.min(10, (weeks / 6) * 10);

  // 6. Activation floor: each live channel needs enough budget to learn
  const funded = active.filter((c) => toUSD((budget * c.pct) / 100, currency) >= ACTIVATION_FLOOR_USD).length;
  const activation = active.length ? (10 * funded) / active.length : 0;

  const breakdown: GradeFactor[] = [
    { label: "Channel diversification", score: round1(diversification), max: 25, note: `HHI ${hhi.toFixed(2)} across ${active.length} channel${active.length === 1 ? "" : "s"}` },
    { label: "Funnel balance", score: round1(funnel), max: 20, note: `${Math.round(upper)}% upper / ${Math.round(lower)}% lower` },
    { label: "Video and attention weight", score: round1(attention), max: 20, note: `${Math.round(video)}% in CTV, YouTube and social; 50% scores best` },
    { label: "Geo coverage", score: round1(geo), max: 15, note: `${geoCount} market${geoCount === 1 ? "" : "s"}; 5 or more scores full marks` },
    { label: "Timeline adequacy", score: round1(timeline), max: 10, note: `${weeks} week${weeks === 1 ? "" : "s"}; 6 or more scores full marks` },
    {
      label: "Activation floor met",
      score: round1(activation),
      max: 10,
      note: `${funded} of ${active.length} live channels have at least $${ACTIVATION_FLOOR_USD.toLocaleString("en-US")} (USD)`,
    },
  ];
  const total = Math.round(breakdown.reduce((s, f) => s + f.score, 0));
  return { total, letter: letterFor(total), breakdown };
}

export const letterFor = (total: number): Letter => (total >= 90 ? "A" : total >= 80 ? "B" : total >= 70 ? "C" : total >= 60 ? "D" : "F");

const GRADE_COLORS: Record<Letter, string> = { A: "#4CD787", B: "#8DD84C", C: "#FFB020", D: "#FF8A3D", F: "#FF5C5C" };
export const gradeColor = (letter: Letter) => GRADE_COLORS[letter];
