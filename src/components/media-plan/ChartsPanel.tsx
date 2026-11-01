"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtMoney, fmtNum } from "@/lib/mediaPlan/format";
import { channelBudget, impressions, pacing } from "@/lib/mediaPlan/plan";
import type { Channel } from "@/lib/mediaPlan/types";
import { card } from "./ui";

type Props = { channels: Channel[]; budget: number; currency: string; weeks: number };

const compact = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n)));
const axis = { fontSize: 12, fill: "#555555" };
const tipStyle = { borderRadius: 12, border: "1px solid rgb(17 17 17 / 0.1)", fontSize: 13 };

function ChartCard({ title, label, children }: { title: string; label: string; children: React.ReactNode }) {
  return (
    <figure className="min-w-0">
      <figcaption className="font-display font-bold">{title}</figcaption>
      <div role="img" aria-label={label} className="mt-3 h-72">
        {children}
      </div>
    </figure>
  );
}

export function ChartsPanel({ channels, budget, currency, weeks }: Props) {
  const active = channels.filter((c) => c.pct > 0);
  const share = active.map((c) => ({ name: c.name, value: channelBudget(budget, c), color: c.color }));
  const imps = active.map((c) => ({ name: c.name, value: impressions(budget, currency, c), color: c.color }));
  const pace = pacing(channels, budget, weeks);
  const money = (v: unknown) => fmtMoney(Number(v), currency);

  return (
    <section aria-labelledby="mpg-charts" className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="mpg-charts" className="text-2xl font-bold tracking-[-0.03em]">
          Charts
        </h2>
        <p className="text-xs text-muted">Illustrative planning estimates, not live rate-card figures</p>
      </div>
      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        <ChartCard title="Budget share by channel" label={`Donut chart of budget share: ${share.map((s) => `${s.name} ${fmtMoney(s.value, currency)}`).join(", ")}`}>
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 288 }}>
            <PieChart>
              <Pie data={share} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={1} stroke="#ffffff" strokeWidth={2} isAnimationActive={false}>
                {share.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
              <Tooltip formatter={money} contentStyle={tipStyle} />
              <Legend itemSorter={null} verticalAlign="bottom" iconType="square" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Estimated impressions by channel" label={`Bar chart of estimated impressions: ${imps.map((s) => `${s.name} ${fmtNum(s.value)}`).join(", ")}`}>
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 288 }}>
            <BarChart data={imps} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgb(17 17 17 / 0.08)" />
              <XAxis dataKey="name" tick={axis} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={axis} tickFormatter={compact} width={48} />
              <Tooltip formatter={(v) => fmtNum(Number(v))} contentStyle={tipStyle} cursor={{ fill: "rgb(17 17 17 / 0.05)" }} />
              <Bar dataKey="value" name="Impressions" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {imps.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard title="Weekly spend pacing" label={`Stacked bar chart of weekly spend across ${pace.length} weeks for ${active.map((c) => c.name).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 288 }}>
              <BarChart data={pace} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgb(17 17 17 / 0.08)" />
                <XAxis dataKey="week" tick={axis} />
                <YAxis tick={axis} tickFormatter={compact} width={56} />
                <Tooltip formatter={money} contentStyle={tipStyle} cursor={{ fill: "rgb(17 17 17 / 0.05)" }} />
                <Legend itemSorter={null} iconType="square" wrapperStyle={{ fontSize: 12 }} />
                {active.map((c) => (
                  <Bar key={c.key} dataKey={c.key} name={c.name} stackId="spend" fill={c.color} isAnimationActive={false} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}
