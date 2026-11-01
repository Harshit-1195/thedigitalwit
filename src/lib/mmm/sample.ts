// "Halden Home (sample)": a fictional homeware retailer, 104 weeks, 6 channels. Generated from known true
// parameters with a fixed seed, so the Methodology tab can show how close the model gets to the truth.

import { adstock, hill, rng, type Dataset, type Params } from "./engine";

export const SAMPLE_TRUTH: Record<string, Params> = {
  TV: { theta: 0.6, k: 60_000, s: 2, beta: 290_000 },
  "Paid search": { theta: 0.1, k: 30_000, s: 1, beta: 330_000 },
  "Paid social": { theta: 0.3, k: 30_000, s: 1, beta: 160_000 },
  "Online video": { theta: 0.4, k: 35_000, s: 1, beta: 110_000 },
  Display: { theta: 0.2, k: 25_000, s: 1, beta: 36_000 },
  "Retail media": { theta: 0.2, k: 15_000, s: 1, beta: 90_000 },
};

export function sampleDataset(seed = 20261213): Dataset {
  const n = 104;
  const r = rng(seed);
  const noise = () => (r() + r() + r() - 1.5) / 1.5; // roughly normal, -1..1
  const start = Date.UTC(2024, 10, 4); // Monday 4 Nov 2024
  const dates = Array.from({ length: n }, (_, t) => new Date(start + t * 7 * 86_400_000).toISOString().slice(0, 10));
  const season = (t: number) => Math.sin((2 * Math.PI * (t + 8)) / 52.18); // winter peak
  const sale = Array.from({ length: n }, (_, t) => (t % 52 >= 8 && t % 52 <= 10 ? 1 : 0)); // January sale
  const promo = Array.from({ length: n }, (_, t) => (t % 13 === 5 || t % 13 === 6 ? 1 : 0));

  // Spend patterns: TV in bursts, search following demand, the rest varied around a level.
  const tv = Array.from({ length: n }, (_, t) => ((t % 10) < 4 ? 70_000 + 25_000 * r() : r() < 0.25 ? 20_000 * r() : 0));
  const search = Array.from({ length: n }, (_, t) => 9_000 + 2_000 * season(t) + 26_000 * r());
  const social = Array.from({ length: n }, () => 6_000 + 26_000 * r());
  const video = Array.from({ length: n }, (_, t) => (((t + 3) % 9) < 5 ? 15_000 + 12_000 * r() : 3_000 * r()));
  const display = Array.from({ length: n }, () => 4_000 + 16_000 * r());
  const retail = Array.from({ length: n }, () => 3_000 + 11_000 * r());
  const spends = [tv, search, social, video, display, retail].map((x) => x.map((v) => Math.max(0, Math.round(v))));
  const names = Object.keys(SAMPLE_TRUTH);

  const media = Array.from({ length: n }, () => 0);
  names.forEach((name, i) => {
    const p = SAMPLE_TRUTH[name];
    const a = adstock(spends[i], p.theta);
    for (let t = 0; t < n; t++) media[t] += p.beta * hill(a[t], p.k, p.s);
  });
  const kpi = Array.from({ length: n }, (_, t) => Math.round(240_000 + 450 * t + 30_000 * season(t) + 55_000 * sale[t] + 38_000 * promo[t] + media[t] + 22_000 * noise()));

  return {
    name: "Halden Home (sample)",
    dates,
    kpiName: "Revenue",
    kpi,
    channels: names.map((name, i) => ({ name, spend: spends[i] })),
    controls: [
      { name: "Promotion", values: promo },
      { name: "January sale", values: sale },
    ],
    sample: true,
  };
}

/** True return on spend per channel over the whole sample, computed exactly as the model reports it. */
export function sampleTruthRoi(d: Dataset) {
  return Object.fromEntries(
    d.channels.map((c) => {
      const p = SAMPLE_TRUTH[c.name];
      const a = adstock(c.spend, p.theta);
      let contrib = 0;
      for (let t = 0; t < a.length; t++) contrib += p.beta * hill(a[t], p.k, p.s);
      return [c.name, contrib / (c.spend.reduce((x, y) => x + y, 0) || 1)];
    }),
  );
}
