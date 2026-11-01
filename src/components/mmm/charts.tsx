"use client";

import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { marginal, quantile, respond, type FitResult } from "@/lib/mmm/engine";
import { fmtKpi, fmtMoney, fmtRoi, type Settings, type Summary } from "@/lib/mmm/insights";
import { INK, LINE, MUTED, seriesColor, shortDate, STATUS, ticks, TRACK, TRACK_STRONG, useTip } from "./ui";

const M = { l: 60, r: 14, t: 10, b: 28 };
const axisText = { fontSize: 11, fill: MUTED, fontFamily: "var(--font-mono)" } as const;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const smooth4 = (xs: number[]) => xs.map((_, i) => sum(xs.slice(Math.max(0, i - 3), i + 1)) / Math.min(4, i + 1));

function YGrid({ y, lo, hi, w, fmt }: { y: (v: number) => number; lo: number; hi: number; w: number; fmt: (v: number) => string }) {
  return (
    <g aria-hidden>
      {ticks(lo, hi).map((v) => (
        <g key={v}>
          <line x1={M.l} x2={w - M.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? TRACK_STRONG : LINE} />
          <text x={M.l - 8} y={y(v) + 4} textAnchor="end" style={axisText}>
            {fmt(v)}
          </text>
        </g>
      ))}
    </g>
  );
}
function XDates({ x, dates, from, to, h, w }: { x: (i: number) => number; dates: string[]; from: number; to: number; h: number; w: number }) {
  const n = to - from + 1;
  // About one label per 80px, so dates never overlap on a phone.
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.min(7, Math.floor((w - M.l - M.r) / 80)))));
  const idx = Array.from({ length: n }, (_, k) => from + k).filter((i) => (i - from) % every === 0);
  return (
    <g aria-hidden>
      {idx.map((i) => (
        <text key={i} x={x(i)} y={h - 8} textAnchor="middle" style={axisText}>
          {shortDate(dates[i])}
        </text>
      ))}
    </g>
  );
}

/* ---------- weekly contribution (Summary) ---------- */
export type WeeklyView = "media" | "baseline" | "mix";
export function WeeklyChart({ r, s, view, smooth, zoom, setZoom, w, h }: { r: FitResult; s: Settings; view: WeeklyView; smooth: boolean; zoom: [number, number] | null; setZoom: (z: [number, number] | null) => void; w: number; h: number | null }) {
  const H = h ?? 300;
  const tip = useTip();
  const [from, to] = zoom ?? [0, r.n - 1];
  const [hover, setHover] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const series = useMemo(() => {
    const f = smooth ? smooth4 : (x: number[]) => x;
    const ch = r.channels.map((c) => f(c.contrib));
    const base = f(r.baseline);
    const actual = f(r.actual);
    if (view === "mix") {
      const tot = r.dates.map((_, t) => sum(ch.map((c) => c[t])) || 1);
      return { layers: ch.map((c) => c.map((v, t) => (v / tot[t]) * 100)), base: null, actual: null };
    }
    return { layers: ch, base: view === "baseline" ? base : null, actual: view === "baseline" ? actual : null };
  }, [r, view, smooth]);

  const stacks = useMemo(() => {
    const out: { lo: number[]; hi: number[] }[] = [];
    let acc = r.dates.map((_, t) => (series.base ? Math.max(0, series.base[t]) : 0));
    for (const l of series.layers) {
      const hi = acc.map((v, t) => v + l[t]);
      out.push({ lo: acc, hi });
      acc = hi;
    }
    return { out, top: acc };
  }, [series, r.dates]);

  let yMax = view === "mix" ? 100 : 0;
  for (let t = from; t <= to; t++) yMax = Math.max(yMax, stacks.top[t], series.actual?.[t] ?? 0);
  yMax = view === "mix" ? 100 : yMax * 1.08 || 1;
  const x = (i: number) => M.l + ((i - from) / Math.max(1, to - from)) * (w - M.l - M.r);
  const y = (v: number) => M.t + (1 - v / yMax) * (H - M.t - M.b);
  const area = (lo: number[], hi: number[]) => {
    let d = "";
    for (let t = from; t <= to; t++) d += `${t === from ? "M" : "L"}${x(t)},${y(hi[t])}`;
    for (let t = to; t >= from; t--) d += `L${x(t)},${y(lo[t])}`;
    return d + "Z";
  };
  const idxAt = (clientX: number) => {
    const b = svg.current!.getBoundingClientRect();
    const px = ((clientX - b.left) / b.width) * w;
    return Math.max(from, Math.min(to, Math.round(from + ((px - M.l) / (w - M.l - M.r)) * (to - from))));
  };
  const fmtY = (v: number) => (view === "mix" ? `${v}%` : fmtKpi(s, v));
  const move = (e: RPointerEvent<SVGRectElement>) => {
    const i = idxAt(e.clientX);
    setHover(i);
    if (drag) setDrag({ ...drag, b: i });
    tip({
      x: e.clientX,
      y: e.clientY,
      body: (
        <div className="space-y-1">
          <p className="font-display font-semibold">Week of {shortDate(r.dates[i])}</p>
          {series.actual && <Row label="Actual" color={INK} value={fmtKpi(s, series.actual[i])} line />}
          {series.base && <Row label="Baseline" color={TRACK} value={fmtKpi(s, series.base[i])} />}
          {[...r.channels.keys()].reverse().map((c) => (
            <Row key={c} label={r.channels[c].name} color={seriesColor(c)} value={view === "mix" ? `${series.layers[c][i].toFixed(1)}%` : fmtKpi(s, series.layers[c][i])} />
          ))}
        </div>
      ),
    });
  };
  return (
    <svg ref={svg} width={w} height={H} role="img" aria-label={`Weekly ${view === "mix" ? "media mix" : "contribution"} chart, ${shortDate(r.dates[from])} to ${shortDate(r.dates[to])}`} className="block touch-pan-y select-none">
      <YGrid y={y} lo={0} hi={yMax} w={w} fmt={fmtY} />
      {series.base && <path d={area(r.dates.map(() => 0), series.base.map((v) => Math.max(0, v)))} fill={TRACK} />}
      {stacks.out.map((st, c) => (
        <path key={c} d={area(st.lo, st.hi)} fill={seriesColor(c)} stroke="#fff" strokeWidth={0.75} />
      ))}
      {series.actual && <path d={Array.from({ length: to - from + 1 }, (_, k) => `${k ? "L" : "M"}${x(from + k)},${y(series.actual![from + k])}`).join("")} fill="none" stroke={INK} strokeWidth={2} />}
      <XDates x={x} dates={r.dates} from={from} to={to} h={H} w={w} />
      {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={H - M.b} stroke={INK} strokeDasharray="3 3" />}
      {drag && <rect x={Math.min(x(drag.a), x(drag.b))} y={M.t} width={Math.abs(x(drag.b) - x(drag.a))} height={H - M.t - M.b} fill="#111" opacity={0.08} />}
      <rect
        x={M.l}
        y={M.t}
        width={w - M.l - M.r}
        height={H - M.t - M.b}
        fill="transparent"
        onPointerMove={move}
        onPointerLeave={() => (setHover(null), tip(null), setDrag(null))}
        onPointerDown={(e) => e.pointerType === "mouse" && setDrag({ a: idxAt(e.clientX), b: idxAt(e.clientX) })}
        onPointerUp={() => {
          if (drag && Math.abs(drag.b - drag.a) >= 2) setZoom([Math.min(drag.a, drag.b), Math.max(drag.a, drag.b)]);
          setDrag(null);
        }}
        style={{ cursor: "crosshair" }}
      />
    </svg>
  );
}

function Row({ label, color, value, line }: { label: string; color: string; value: string; line?: boolean }) {
  return (
    <p className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5">
        <span aria-hidden style={line ? { width: 12, borderTop: `2px solid ${color}` } : { width: 9, height: 9, background: color, borderRadius: 2 }} />
        {label}
      </span>
      <span className="font-mono tabular-nums">{value}</span>
    </p>
  );
}

/* ---------- ROI: bars with ranges, or bubbles ---------- */
export type RoiStyle = "bars" | "bubble";
export function RoiChart({ r, s, sum: sm, style, w, h }: { r: FitResult; s: Settings; sum: Summary; style: RoiStyle; w: number; h: number | null }) {
  const tip = useTip();
  const conv = s.kpiType === "conversions";
  const k = conv ? 1000 : 1; // conversions are shown per 1,000 of spend
  const order = r.channels.map((c, i) => ({ c, i })).sort((a, b) => b.c.roi - a.c.roi);
  const beV = sm.be * k;
  const label = conv ? `Conversions per ${s.currency}1k` : "Return per 1 spent (ROAS)";
  const show = (c: (typeof r.channels)[number], i: number, e: { clientX: number; clientY: number }) =>
    tip({
      x: e.clientX,
      y: e.clientY,
      body: (
        <div className="space-y-0.5">
          <p className="flex items-center gap-1.5 font-display font-semibold">
            <span aria-hidden style={{ width: 9, height: 9, background: seriesColor(i), borderRadius: 2 }} />
            {c.name}
          </p>
          <p>
            {conv ? "Cost per conversion" : "ROAS"}: <b>{fmtRoi(s, c.roi)}</b>
          </p>
          <p className="text-muted">90% range {fmtRoi(s, c.ci.roi[0])} to {fmtRoi(s, c.ci.roi[1])}</p>
          <p>Spend {fmtMoney(s.currency, c.totalSpend)} · {(c.spendShare * 100).toFixed(0)}% of media</p>
          <p>Contribution {fmtKpi(s, c.totalContrib)}</p>
        </div>
      ),
    });

  if (style === "bars") {
    const rowH = 34;
    const H = h ?? M.t + order.length * rowH + 34;
    const left = Math.min(150, w * 0.32);
    const max = Math.max(beV, ...order.map((o) => o.c.ci.roi[1] * k), ...order.map((o) => o.c.roi * k)) * 1.12 || 1;
    const x = (v: number) => left + (v / max) * (w - left - 70);
    const band = (H - M.t - 30) / order.length;
    return (
      <svg width={w} height={H} role="img" aria-label={`${label} by channel with 90% ranges`} className="block">
        {ticks(0, max).map((v) => (
          <g key={v} aria-hidden>
            <line x1={x(v)} x2={x(v)} y1={M.t} y2={H - 26} stroke={LINE} />
            <text x={x(v)} y={H - 10} textAnchor="middle" style={axisText}>
              {conv ? v : `${v}×`}
            </text>
          </g>
        ))}
        {order.map(({ c, i }, row) => {
          const cy = M.t + band * row + band / 2;
          const bh = Math.min(16, band * 0.5);
          return (
            <g key={c.name} onPointerMove={(e) => show(c, i, e)} onPointerLeave={() => tip(null)}>
              <rect x={0} y={cy - band / 2} width={w} height={band} fill="transparent" />
              <text x={left - 10} y={cy + 4} textAnchor="end" className="fill-ink" style={{ fontSize: 12 }}>
                {c.name.length > 18 ? c.name.slice(0, 17) + "…" : c.name}
              </text>
              <rect x={left} y={cy - bh / 2} width={Math.max(2, x(c.roi * k) - left)} height={bh} rx={4} fill={seriesColor(i)} opacity={c.noLift ? 0.45 : 1} />
              <line x1={x(c.ci.roi[0] * k)} x2={x(c.ci.roi[1] * k)} y1={cy} y2={cy} stroke={INK} strokeWidth={1.5} />
              {[c.ci.roi[0], c.ci.roi[1]].map((v, j) => (
                <line key={j} x1={x(v * k)} x2={x(v * k)} y1={cy - 5} y2={cy + 5} stroke={INK} strokeWidth={1.5} />
              ))}
              <text x={x(Math.max(c.ci.roi[1], c.roi) * k) + 8} y={cy + 4} style={{ ...axisText, fill: INK }}>
                {fmtRoi(s, c.roi)}
              </text>
            </g>
          );
        })}
        {beV > 0 && (
          <g aria-hidden>
            <line x1={x(beV)} x2={x(beV)} y1={M.t - 4} y2={H - 26} stroke={STATUS.crit} strokeWidth={1.5} strokeDasharray="5 4" />
          </g>
        )}
      </svg>
    );
  }
  // Bubble: spend share across, return up, size = contribution.
  const H = h ?? 340;
  const maxX = Math.max(...r.channels.map((c) => c.spendShare * 100)) * 1.15 || 1;
  const maxY = Math.max(beV, ...r.channels.map((c) => c.roi * k)) * 1.2 || 1;
  const x = (v: number) => M.l + (v / maxX) * (w - M.l - M.r - 20);
  const y = (v: number) => M.t + (1 - v / maxY) * (H - M.t - M.b - 14);
  const maxC = Math.max(...r.channels.map((c) => c.totalContrib)) || 1;
  const rad = (v: number) => 6 + Math.sqrt(Math.max(0, v) / maxC) * Math.min(34, w / 22);
  return (
    <svg width={w} height={H} role="img" aria-label="Return against share of spend; bubble size is contribution" className="block">
      <YGrid y={y} lo={0} hi={maxY} w={w} fmt={(v) => (conv ? String(v) : `${v}×`)} />
      {ticks(0, maxX).map((v) => (
        <text key={v} x={x(v)} y={H - 8} textAnchor="middle" style={axisText} aria-hidden>
          {v}%
        </text>
      ))}
      {beV > 0 && <line x1={M.l} x2={w - M.r} y1={y(beV)} y2={y(beV)} stroke={STATUS.crit} strokeWidth={1.5} strokeDasharray="5 4" aria-hidden />}
      {r.channels.map((c, i) => (
        <g key={c.name} onPointerMove={(e) => show(c, i, e)} onPointerLeave={() => tip(null)}>
          <circle cx={x(c.spendShare * 100)} cy={y(c.roi * k)} r={rad(c.totalContrib)} fill={seriesColor(i)} fillOpacity={0.75} stroke="#fff" strokeWidth={2} />
          <text x={x(c.spendShare * 100) + rad(c.totalContrib) + 4} y={y(c.roi * k) + 4} style={{ fontSize: 11, fill: INK }}>
            {c.name}
          </text>
        </g>
      ))}
      <text x={w - M.r} y={H - 22} textAnchor="end" style={axisText} aria-hidden>
        Share of spend →
      </text>
    </svg>
  );
}

/* ---------- response curves: one small chart per channel ---------- */
export function CurveGrid({ r, s, sum: sm, show, w }: { r: FitResult; s: Settings; sum: Summary; show: boolean[]; w: number; h?: number | null }) {
  const cols = w >= 900 ? 3 : w >= 560 ? 2 : 1;
  const gap = 16;
  const cw = Math.floor((w - gap * (cols - 1)) / cols);
  const list = r.channels.map((c, i) => ({ c, i })).filter(({ i }) => show[i]);
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }}>
      {list.map(({ c, i }) => (
        <Curve key={c.name} r={r} s={s} i={i} be={sm.be} w={cw} />
      ))}
    </div>
  );
}

function Curve({ r, s, i, be, w }: { r: FitResult; s: Settings; i: number; be: number; w: number }) {
  const tip = useTip();
  const c = r.channels[i];
  const H = 190;
  const m = { l: 52, r: 10, t: 26, b: 26 };
  const maxSpend = Math.max(c.current * 2.2, ...c.spend) || 1;
  const pts = useMemo(() => {
    return Array.from({ length: 41 }, (_, k) => {
      const x = (maxSpend * k) / 40;
      const draws = r.reps.map((rep) => respond(rep.ch[i], x));
      return { x, y: respond(c.params, x), lo: quantile(draws, 0.05), hi: quantile(draws, 0.95) };
    });
  }, [r, i, c.params, maxSpend]);
  const maxY = Math.max(...pts.map((p) => p.hi), 1) * 1.08;
  const X = (v: number) => m.l + (v / maxSpend) * (w - m.l - m.r);
  const Y = (v: number) => m.t + (1 - v / maxY) * (H - m.t - m.b);
  const line = pts.map((p, k) => `${k ? "L" : "M"}${X(p.x)},${Y(p.y)}`).join("");
  const band = pts.map((p, k) => `${k ? "L" : "M"}${X(p.x)},${Y(p.hi)}`).join("") + [...pts].reverse().map((p) => `L${X(p.x)},${Y(p.lo)}`).join("") + "Z";
  const color = seriesColor(i);
  const beX = be > 0 ? Math.min(maxSpend, maxY / be) : 0;
  const svg = useRef<SVGSVGElement>(null);
  return (
    <figure className="min-w-0 rounded-2xl bg-white/60 p-2">
      <figcaption className="flex items-baseline justify-between gap-2 px-1 text-sm">
        <span className="flex items-center gap-1.5 font-display font-semibold">
          <span aria-hidden style={{ width: 9, height: 9, background: color, borderRadius: 2 }} />
          {c.name}
        </span>
        <span className="font-mono text-xs text-muted">next {s.currency}1 → {s.kpiType === "revenue" ? `${s.currency}${c.mroi.toFixed(2)}` : `${(c.mroi * 1000).toFixed(1)} per ${s.currency}1k`}</span>
      </figcaption>
      <svg
        ref={svg}
        width={w - 16}
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        role="img"
        aria-label={`${c.name} response curve: weekly spend against weekly ${s.kpiType}. Today ${fmtMoney(s.currency, c.current)} a week.`}
        className="block"
        onPointerMove={(e) => {
          const b = svg.current!.getBoundingClientRect();
          const sx = Math.max(0, Math.min(maxSpend, (((e.clientX - b.left) / b.width) * w - m.l) / (w - m.l - m.r) * maxSpend));
          tip({
            x: e.clientX,
            y: e.clientY,
            body: (
              <div className="space-y-0.5">
                <p className="font-display font-semibold">{c.name}</p>
                <p>Spend {fmtMoney(s.currency, sx)} a week</p>
                <p>Brings {fmtKpi(s, respond(c.params, sx))} a week</p>
                <p className="text-muted">Next {s.currency}1 returns {s.kpiType === "revenue" ? `${s.currency}${marginal(c.params, sx).toFixed(2)}` : `${(marginal(c.params, sx) * 1000).toFixed(1)} per ${s.currency}1k`}</p>
              </div>
            ),
          });
        }}
        onPointerLeave={() => tip(null)}
      >
        {ticks(0, maxY, 3).map((v) => (
          <g key={v} aria-hidden>
            <line x1={m.l} x2={w - m.r} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? TRACK_STRONG : LINE} />
            <text x={m.l - 6} y={Y(v) + 4} textAnchor="end" style={axisText}>
              {fmtKpi(s, v)}
            </text>
          </g>
        ))}
        {ticks(0, maxSpend, 3).map((v) => (
          <text key={v} x={X(v)} y={H - 6} textAnchor="middle" style={axisText} aria-hidden>
            {fmtMoney(s.currency, v)}
          </text>
        ))}
        {be > 0 && <line x1={X(0)} y1={Y(0)} x2={X(beX)} y2={Y(beX * be)} stroke={STATUS.crit} strokeWidth={1.25} strokeDasharray="5 4" aria-hidden />}
        <path d={band} fill={color} opacity={0.18} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} />
        <line x1={X(c.current)} x2={X(c.current)} y1={Y(respond(c.params, c.current))} y2={H - m.b} stroke={INK} strokeDasharray="2 3" aria-hidden />
        <circle cx={X(c.current)} cy={Y(respond(c.params, c.current))} r={5} fill={INK} stroke="#fff" strokeWidth={2} />
        <text x={X(c.current)} y={Y(respond(c.params, c.current)) - 10} textAnchor="middle" style={{ fontSize: 10, fill: INK, fontWeight: 600 }}>
          today
        </text>
      </svg>
    </figure>
  );
}

/* ---------- model fit ---------- */
export type FitStyle = "time" | "scatter";
export function FitChart({ r, s, style, zoom, w, h }: { r: FitResult; s: Settings; style: FitStyle; zoom: [number, number] | null; w: number; h: number | null }) {
  const tip = useTip();
  const H = h ?? 300;
  const ho = r.holdout;
  const [from, to] = zoom ?? [0, r.n - 1];
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const fitColor = seriesColor(0);
  const hoColor = seriesColor(1);
  if (style === "scatter") {
    const idx = Array.from({ length: to - from + 1 }, (_, k) => from + k);
    const vals = idx.flatMap((t) => [r.actual[t], r.predicted[t], ho && t >= ho.from ? ho.predicted[t] : r.predicted[t]]);
    const lo = Math.min(...vals) * 0.97, hi = Math.max(...vals) * 1.03;
    const side = Math.min(w, H + 120);
    const X = (v: number) => M.l + ((v - lo) / (hi - lo)) * (side - M.l - M.r);
    const Y = (v: number) => M.t + (1 - (v - lo) / (hi - lo)) * (H - M.t - M.b);
    return (
      <svg width={w} height={H} role="img" aria-label="Actual against predicted, one dot per week" className="block">
        <YGrid y={Y} lo={lo} hi={hi} w={side} fmt={(v) => fmtKpi(s, v)} />
        {ticks(lo, hi, 4).map((v) => (
          <text key={v} x={X(v)} y={H - 8} textAnchor="middle" style={axisText} aria-hidden>
            {fmtKpi(s, v)}
          </text>
        ))}
        <line x1={X(lo)} y1={Y(lo)} x2={X(hi)} y2={Y(hi)} stroke={TRACK_STRONG} strokeDasharray="4 4" aria-hidden />
        {idx.map((t) => {
          const held = ho && t >= ho.from;
          const p = held ? ho!.predicted[t] : r.predicted[t];
          return (
            <circle
              key={t}
              cx={X(p)}
              cy={Y(r.actual[t])}
              r={4.5}
              fill={held ? hoColor : fitColor}
              stroke="#fff"
              strokeWidth={1.5}
              onPointerMove={(e) => tip({ x: e.clientX, y: e.clientY, body: <div><p className="font-display font-semibold">Week of {shortDate(r.dates[t])}{held ? " (held out)" : ""}</p><p>Actual {fmtKpi(s, r.actual[t])}</p><p>Predicted {fmtKpi(s, p)}</p></div> })}
              onPointerLeave={() => tip(null)}
            />
          );
        })}
        <text x={side - M.r} y={H - 22} textAnchor="end" style={axisText} aria-hidden>
          Predicted →
        </text>
      </svg>
    );
  }
  const vals: number[] = [];
  for (let t = from; t <= to; t++) vals.push(r.actual[t], r.predicted[t]);
  const lo = Math.min(...vals) * 0.95, hi = Math.max(...vals) * 1.04;
  const x = (i: number) => M.l + ((i - from) / Math.max(1, to - from)) * (w - M.l - M.r);
  const y = (v: number) => M.t + (1 - (v - lo) / (hi - lo)) * (H - M.t - M.b);
  const path = (vs: number[], a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => `${k ? "L" : "M"}${x(a + k)},${y(vs[a + k])}`).join("");
  const hoFrom = ho ? Math.max(from, ho.from) : null;
  return (
    <svg ref={svg} width={w} height={H} role="img" aria-label="Actual and predicted by week" className="block touch-pan-y">
      {ho && hoFrom !== null && hoFrom <= to && <rect x={x(hoFrom)} y={M.t} width={x(to) - x(hoFrom)} height={H - M.t - M.b} fill="#f2f2f2" aria-hidden />}
      <YGrid y={y} lo={lo} hi={hi} w={w} fmt={(v) => fmtKpi(s, v)} />
      {ho && hoFrom !== null && hoFrom <= to && (
        <text x={x(hoFrom) + 6} y={M.t + 14} style={{ ...axisText, fill: INK }} aria-hidden>
          held out
        </text>
      )}
      <path d={path(r.actual, from, to)} fill="none" stroke={INK} strokeWidth={2} />
      <path d={path(r.predicted, from, to)} fill="none" stroke={fitColor} strokeWidth={2} />
      {ho && hoFrom !== null && hoFrom <= to && <path d={path(ho.predicted, hoFrom, to)} fill="none" stroke={hoColor} strokeWidth={2} strokeDasharray="6 4" />}
      <XDates x={x} dates={r.dates} from={from} to={to} h={H} w={w} />
      {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={H - M.b} stroke={INK} strokeDasharray="3 3" />}
      <rect
        x={M.l}
        y={M.t}
        width={w - M.l - M.r}
        height={H - M.t - M.b}
        fill="transparent"
        onPointerMove={(e) => {
          const b = svg.current!.getBoundingClientRect();
          const i = Math.max(from, Math.min(to, Math.round(from + (((e.clientX - b.left) / b.width) * w - M.l) / (w - M.l - M.r) * (to - from))));
          setHover(i);
          const held = ho && i >= ho.from;
          tip({
            x: e.clientX,
            y: e.clientY,
            body: (
              <div className="space-y-1">
                <p className="font-display font-semibold">Week of {shortDate(r.dates[i])}</p>
                <Row label="Actual" color={INK} value={fmtKpi(s, r.actual[i])} line />
                <Row label="Model (all weeks)" color={fitColor} value={fmtKpi(s, r.predicted[i])} line />
                {held && <Row label="Blind forecast" color={hoColor} value={fmtKpi(s, ho!.predicted[i])} line />}
              </div>
            ),
          });
        }}
        onPointerLeave={() => (setHover(null), tip(null))}
      />
    </svg>
  );
}

/* ---------- current vs recommended spend ---------- */
export function SpendBars({ r, s, a, b, aLabel, bLabel, w, h }: { r: FitResult; s: Settings; a: number[]; b: number[]; aLabel: string; bLabel: string; w: number; h: number | null }) {
  const tip = useTip();
  const left = Math.min(140, w * 0.3);
  const max = Math.max(...a, ...b) * 1.18 || 1;
  const band = 44;
  const H = h ?? r.channels.length * band + 34;
  const rowH = (H - 34) / r.channels.length;
  const x = (v: number) => left + (v / max) * (w - left - 64);
  return (
    <svg width={w} height={H} role="img" aria-label={`${aLabel} and ${bLabel} weekly spend by channel`} className="block">
      {ticks(0, max, 4).map((v) => (
        <g key={v} aria-hidden>
          <line x1={x(v)} x2={x(v)} y1={4} y2={H - 26} stroke={LINE} />
          <text x={x(v)} y={H - 10} textAnchor="middle" style={axisText}>
            {fmtMoney(s.currency, v)}
          </text>
        </g>
      ))}
      {r.channels.map((c, i) => {
        const y0 = 4 + rowH * i;
        const bh = Math.min(12, rowH * 0.32);
        const d = b[i] - a[i];
        return (
          <g
            key={c.name}
            onPointerMove={(e) => tip({ x: e.clientX, y: e.clientY, body: <div><p className="font-display font-semibold">{c.name}</p><p>{aLabel}: {fmtMoney(s.currency, a[i])} a week</p><p>{bLabel}: {fmtMoney(s.currency, b[i])} a week</p><p className="text-muted">Change {d >= 0 ? "+" : "−"}{fmtMoney(s.currency, Math.abs(d))} ({a[i] ? `${d >= 0 ? "+" : "−"}${Math.abs((d / a[i]) * 100).toFixed(0)}%` : "new"})</p></div> })}
            onPointerLeave={() => tip(null)}
          >
            <rect x={0} y={y0} width={w} height={rowH} fill="transparent" />
            <text x={left - 10} y={y0 + rowH / 2 + 4} textAnchor="end" style={{ fontSize: 12, fill: INK }}>
              {c.name.length > 16 ? c.name.slice(0, 15) + "…" : c.name}
            </text>
            <rect x={left} y={y0 + rowH / 2 - bh - 1} width={Math.max(2, x(a[i]) - left)} height={bh} rx={3} fill={TRACK_STRONG} />
            <rect x={left} y={y0 + rowH / 2 + 1} width={Math.max(2, x(b[i]) - left)} height={bh} rx={3} fill={seriesColor(i)} />
            <text x={Math.max(x(a[i]), x(b[i])) + 6} y={y0 + rowH / 2 + 4} style={{ ...axisText, fill: d > 0.5 ? STATUS.good : d < -0.5 ? STATUS.crit : MUTED }}>
              {Math.abs(d) < 0.5 ? "±0" : `${d > 0 ? "+" : "−"}${a[i] ? Math.abs((d / a[i]) * 100).toFixed(0) + "%" : fmtMoney(s.currency, Math.abs(d))}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
