"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Action } from "@/lib/mmm/insights";
import { ACTION_LABEL } from "@/lib/mmm/insights";

/* Eight channel colours: the site's validated categorical order (colour-blind checked). Fixed per channel. */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
export const NEUTRAL_MARK = "#8c8c8c";
export const seriesColor = (i: number) => SERIES[i] ?? NEUTRAL_MARK;
export const TRACK = "#d4d4d4";
export const TRACK_STRONG = "#a3a3a3";
export const INK = "#111111";
export const MUTED = "#555555";
export const LINE = "#e4e4e4";
export const STATUS = { good: "#15803d", warn: "#b45309", serious: "#c2410c", crit: "#b91c1c" } as const;

export const ACTION_STYLE: Record<Action, { color: string; icon: string }> = {
  scale: { color: STATUS.good, icon: "▲" },
  hold: { color: "#404040", icon: "■" },
  trim: { color: STATUS.warn, icon: "▼" },
  cut: { color: STATUS.crit, icon: "▼▼" },
  none: { color: MUTED, icon: "○" },
};

export function ActionPill({ action }: { action: Action }) {
  const a = ACTION_STYLE[action];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-xs font-semibold whitespace-nowrap text-white" style={{ background: a.color }}>
      <span aria-hidden className="text-[0.6rem]">{a.icon}</span>
      {ACTION_LABEL[action]}
    </span>
  );
}

/* ---------- tooltip that follows the cursor and stays on screen ---------- */
type TipState = { x: number; y: number; body: ReactNode } | null;
const TipCtx = createContext<(t: TipState) => void>(() => {});
/** The tooltip setter; hides the tooltip when the chart using it goes away (tab switch, full screen). */
export function useTip() {
  const set = useContext(TipCtx);
  useEffect(() => () => set(null), [set]);
  return set;
}

export function TipProvider({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<TipState>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    if (!tip || !ref.current) return;
    const w = ref.current.offsetWidth, h = ref.current.offsetHeight;
    const left = tip.x + 16 + w > window.innerWidth - 8 ? tip.x - 16 - w : tip.x + 16;
    const top = tip.y + 16 + h > window.innerHeight - 8 ? tip.y - 16 - h : tip.y + 16;
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [tip]);
  return (
    <TipCtx.Provider value={setTip}>
      {children}
      {tip &&
        createPortal(
          <div ref={ref} role="tooltip" className="pointer-events-none fixed z-[80] max-w-[18rem] rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg" style={pos}>
            {tip.body}
          </div>,
          document.body,
        )}
    </TipCtx.Provider>
  );
}

/* ---------- width of a box, redrawn when it changes by more than 30px ---------- */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const next = Math.floor(e.contentRect.width);
      setW((cur) => (Math.abs(next - cur) > 30 || cur === 0 ? next : cur));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/* ---------- full screen ---------- */
const FsCtx = createContext<{ fs: string | null; setFs: (k: string | null) => void }>({ fs: null, setFs: () => {} });
export function FsProvider({ children }: { children: ReactNode }) {
  const [fs, setFs] = useState<string | null>(null);
  useEffect(() => {
    if (!fs) return;
    document.documentElement.classList.add("fs-lock");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFs(null);
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("fs-lock");
      document.removeEventListener("keydown", onKey);
    };
  }, [fs]);
  return <FsCtx.Provider value={{ fs, setFs }}>{children}</FsCtx.Provider>;
}

export type Render = (w: number, h: number | null) => ReactNode;

/** A chart in a card, with an Expand button that opens it full screen. Controls work in both places. */
export function ChartCard({ id, title, sub, controls, legend, note, render, className = "" }: { id: string; title: string; sub?: ReactNode; controls?: ReactNode; legend?: ReactNode; note?: ReactNode; render: Render; className?: string }) {
  const { fs, setFs } = useContext(FsCtx);
  const [box, w] = useWidth<HTMLDivElement>();
  const open = fs === id;
  const closeRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (wasOpen.current) expandRef.current?.focus();
    wasOpen.current = open;
  }, [open]);
  return (
    <section aria-label={title} className={`glass min-w-0 rounded-3xl p-4 sm:p-6 ${className}`}>
      <Head title={title} sub={sub}>
        {controls}
        <button ref={expandRef} type="button" onClick={() => setFs(id)} className={btnSm} aria-label={`Expand ${title}`}>
          <span aria-hidden>⤢</span> Expand
        </button>
      </Head>
      {legend && <div className="mt-3">{legend}</div>}
      <div ref={box} className="mt-4 min-w-0">{w > 0 && !open ? render(w, null) : <div style={{ height: 240 }} />}</div>
      {note && <p className="mt-3 text-xs text-muted">{note}</p>}
      {open && createPortal(<FullScreen title={title} sub={sub} controls={controls} legend={legend} render={render} onClose={() => setFs(null)} closeRef={closeRef} />, document.body)}
    </section>
  );
}

function FullScreen({ title, sub, controls, legend, render, onClose, closeRef }: { title: string; sub?: ReactNode; controls?: ReactNode; legend?: ReactNode; render: Render; onClose: () => void; closeRef: React.RefObject<HTMLButtonElement | null> }) {
  const body = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = body.current!;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[70] flex flex-col bg-white p-4 sm:p-8" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
      <Head title={title} sub={sub}>
        {controls}
        <button ref={closeRef} type="button" onClick={onClose} className={`${btnSm} border-ink`}>
          Close <span className="text-muted">(Esc)</span>
        </button>
      </Head>
      {legend && <div className="mt-3">{legend}</div>}
      <div ref={body} className="mt-4 min-h-0 flex-1">{size && render(size.w, size.h)}</div>
    </div>
  );
}

function Head({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export const btnSm = "inline-flex items-center gap-1.5 rounded-full border-2 border-ink/15 bg-white/80 px-3 py-1.5 font-display text-xs font-semibold transition-colors hover:border-ink";
export const btn = "inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-white/80 px-4 py-2 font-display text-sm font-semibold transition-colors hover:border-ink disabled:opacity-50";
export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-50";
export const inp = "w-full rounded-xl border-2 border-ink/20 bg-white px-3 py-2 font-mono text-sm tabular-nums outline-none focus:border-accent";

/** Segmented toggle. */
export function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border-2 border-ink/15 bg-white/80 p-0.5">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={`rounded-full px-3 py-1 font-display text-xs font-semibold transition-colors ${value === v ? "bg-ink text-white" : "hover:bg-ink/5"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Tile({ label, value, sub, lead }: { label: string; value: ReactNode; sub?: ReactNode; lead?: boolean }) {
  return (
    <div className={`glass min-w-0 rounded-2xl p-4 ${lead ? "bg-accent-soft/70" : ""}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 font-display font-extrabold tracking-[-0.03em] tabular-nums ${lead ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dash?: boolean; band?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block" style={it.dash ? { width: 16, borderTop: `2px dashed ${it.color}` } : it.band ? { width: 14, height: 10, background: it.color, opacity: 0.35, borderRadius: 2 } : { width: 10, height: 10, background: it.color, borderRadius: 3 }} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

/* ---------- axes ---------- */
/** About five round tick values covering [lo, hi]. */
export function ticks(lo: number, hi: number, count = 5) {
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Number(v.toPrecision(12)));
  return out;
}
export const shortDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" });
