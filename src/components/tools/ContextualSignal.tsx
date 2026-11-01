"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cleanKeyword, lean, MAX_KEYWORD } from "@/lib/context-signal/analyze";
import type { ContextResponse, Sentiment, Source } from "@/lib/context-signal/types";

const SENT: Record<Sentiment, { color: string; label: string; arrow: string }> = {
  positive: { color: "#15803d", label: "Positive", arrow: "↑" },
  neutral: { color: "#555555", label: "Neutral", arrow: "→" },
  negative: { color: "#b91c1c", label: "Negative", arrow: "↓" },
};
const UNAVAILABLE = "This source is temporarily unavailable. Try again in a few minutes.";
const EMPTY = "No recent results for this keyword.";

type Status = { kind: "idle" } | { kind: "loading"; keyword: string } | { kind: "error"; message: string } | { kind: "done"; data: ContextResponse };

const ago = (iso: string | null) => {
  if (!iso) return "";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(m)) return "";
  if (m < 60) return `${Math.max(1, m)} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} days ago`;
};

export function ContextualSignal() {
  const id = useId();
  const [keyword, setKeyword] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const ctrl = useRef<AbortController | null>(null);
  const last = useRef("");

  useEffect(() => () => ctrl.current?.abort(), []);

  const search = async (raw: string) => {
    const k = cleanKeyword(raw);
    if (!k) {
      setInputError(`Enter a brand, product or topic (1–${MAX_KEYWORD} characters).`);
      return;
    }
    // A newer search always wins: cancel the one in flight.
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    last.current = k;
    setStatus({ kind: "loading", keyword: k });
    try {
      const res = await fetch(`/api/context?${new URLSearchParams({ keyword: k })}`, { signal: c.signal });
      const body = (await res.json().catch(() => null)) as (ContextResponse & { error?: string }) | null;
      if (c.signal.aborted) return;
      if (!res.ok || !body || body.error) setStatus({ kind: "error", message: body?.error || "Something went wrong fetching results." });
      else setStatus({ kind: "done", data: body });
    } catch (e) {
      if ((e as Error).name === "AbortError" || c.signal.aborted) return;
      setStatus({ kind: "error", message: "Couldn't reach the server. Check your connection and try again." });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    search(keyword);
  };

  return (
    <div className="wrap space-y-6 pb-20">
      <section aria-label="Search" className="glass mx-auto max-w-3xl rounded-3xl p-5 sm:p-7">
        <form onSubmit={onSubmit} noValidate>
          <label htmlFor={`${id}-k`} className="block font-display text-sm font-semibold">
            Brand, product or topic
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id={`${id}-k`}
              type="search"
              value={keyword}
              maxLength={MAX_KEYWORD + 20}
              placeholder="Try binance"
              autoComplete="off"
              aria-invalid={!!inputError}
              aria-describedby={`${id}-help${inputError ? ` ${id}-err` : ""}`}
              onChange={(e) => {
                setKeyword(e.target.value);
                setInputError(null);
              }}
              className="h-12 min-w-0 flex-1 rounded-xl border-2 border-ink bg-white/70 px-4 text-lg"
            />
            <button type="submit" className="h-12 rounded-full bg-accent px-7 font-display font-semibold text-on-accent transition-colors hover:bg-accent-strong">
              {status.kind === "loading" ? "Searching…" : "Get context"}
            </button>
          </div>
          {inputError && (
            <p id={`${id}-err`} className="mt-2 text-sm font-semibold text-[#b91c1c]">
              {inputError}
            </p>
          )}
          <div id={`${id}-help`} className="mt-3 space-y-1 text-sm text-muted">
            <p>Built from public sources (GDELT, Google News, Bing News, Reddit, Hacker News, Bluesky, Google Trends). Sentiment is scored automatically and is approximate.</p>
            <p>Your search term is sent to public data sources to fetch results.</p>
          </div>
        </form>
      </section>

      <div aria-live="polite">
        {status.kind === "idle" && (
          <div className="mx-auto max-w-3xl rounded-3xl border-2 border-dashed border-ink/15 p-8 text-center text-muted">
            <p className="font-display text-lg font-semibold text-ink">Search a keyword to see its context.</p>
            <p className="mt-1">Recent news, social sentiment and search-interest trends appear here, side by side.</p>
          </div>
        )}
        {status.kind === "loading" && <p className="text-center font-display font-semibold">Gathering news, social posts and search trends for “{status.keyword}”…</p>}
        {status.kind === "error" && (
          <div role="alert" className="glass mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-3xl border-l-8 border-l-[#b91c1c] p-5">
            <p className="font-semibold">{status.message}</p>
            <button type="button" onClick={() => search(last.current || keyword)} className="rounded-full border-2 border-ink/15 bg-white/70 px-4 py-2 font-display text-sm font-semibold hover:border-ink">
              Try again
            </button>
          </div>
        )}
      </div>

      {status.kind === "done" && (
        <Results
          data={status.data}
          onPick={(k) => {
            setKeyword(k);
            setInputError(null);
            search(k);
            document.getElementById(`${id}-k`)?.scrollIntoView({ block: "center" });
          }}
        />
      )}
    </div>
  );
}

/* ---------- results ---------- */
function Results({ data, onPick }: { data: ContextResponse; onPick: (k: string) => void }) {
  const o = data.overview;
  const down = (s: Source) => data.unavailable.includes(s);
  const dir = o.trendDirection;
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Context for <b className="text-ink">{data.keyword}</b>
        {data.cached ? " · from a recent search" : ""}
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sentiment" value={o.sentimentScore === null ? "—" : `${o.sentimentScore} / 100`} sub={o.sentimentScore === null ? "Nothing to score yet" : lean(o.sentimentScore)} />
        <Stat
          label="Social posts sampled"
          value={down("social") ? "—" : String(o.mentions)}
          sub={o.mentionsDelta === null ? "Search-interest change unavailable" : `Search interest ${o.mentionsDelta >= 0 ? "+" : "−"}${Math.abs(o.mentionsDelta)}% vs previous 7 days`}
        />
        <Stat label="Search interest" value={o.searchInterest === null ? "—" : String(o.searchInterest)} sub="Relative, 0–100" />
        <Stat
          label="Trend direction"
          value={dir ? `${dir === "rising" ? "↑" : dir === "falling" ? "↓" : "→"} ${dir[0].toUpperCase() + dir.slice(1)}` : "—"}
          sub="Last 7 days vs the 7 before"
        />
      </div>

      <Section title="News and articles" sub="GDELT, Google News and Bing News">
        {down("news") ? (
          <Muted>{UNAVAILABLE}</Muted>
        ) : !data.news.length ? (
          <Muted>{EMPTY}</Muted>
        ) : (
          <>
            <ul className="divide-y divide-ink/10">
              {data.news.map((n) => (
                <li key={n.url} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <a href={n.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline-offset-2 hover:underline [overflow-wrap:anywhere]">
                      {n.title}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <p className="mt-0.5 text-xs text-muted">{[n.source, ago(n.time)].filter(Boolean).join(" · ")}</p>
                    {n.snippet && <p className="mt-1 line-clamp-2 text-sm text-muted [overflow-wrap:anywhere]">{n.snippet}</p>}
                  </div>
                  <Chip s={n.sentiment} />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Headlines and sources, with a short excerpt where the publisher provides one.</p>
          </>
        )}
      </Section>

      <Section title="Social buzz" sub="Reddit, Hacker News and Bluesky">
        {down("social") ? (
          <Muted>{UNAVAILABLE}</Muted>
        ) : !data.social.posts.length ? (
          <Muted>{EMPTY}</Muted>
        ) : (
          <>
            <SentimentBar b={data.social.breakdown} />
            <ul className="mt-4 space-y-2">
              {data.social.posts.map((p) => (
                <li key={p.url} className="flex items-start justify-between gap-4 rounded-2xl bg-white/60 p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-accent">
                      {p.platform}
                      <span className="font-normal text-muted"> · {[ago(p.time), p.score === null ? "" : `${p.score} ${p.platform === "Bluesky" ? "likes" : "points"}`].filter(Boolean).join(" · ")}</span>
                    </p>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 block font-semibold underline-offset-2 hover:underline [overflow-wrap:anywhere]">
                      {p.title}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    {p.text && <p className="mt-1 line-clamp-2 text-sm text-muted [overflow-wrap:anywhere]">{p.text}</p>}
                  </div>
                  <Chip s={p.sentiment} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title="Search interest" sub="Google Trends, last 90 days, relative 0–100">
        {down("trends") ? (
          <Muted>{UNAVAILABLE}</Muted>
        ) : !data.trend.length ? (
          <Muted>{EMPTY}</Muted>
        ) : (
          <TrendChart data={data} />
        )}
      </Section>

      <RelatedKeywords data={data} onPick={onPick} />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold tracking-[-0.03em] tabular-nums sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <section className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-bold tracking-[-0.03em]">{title}</h2>
        <p className="text-xs text-muted">{sub}</p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const Muted = ({ children }: { children: ReactNode }) => <p className="rounded-2xl bg-white/60 p-4 text-sm text-muted">{children}</p>;

function Chip({ s }: { s: Sentiment }) {
  const c = SENT[s];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ color: c.color, borderColor: c.color, background: "rgb(255 255 255 / 0.8)" }}>
      <span aria-hidden>{c.arrow}</span>
      {c.label}
    </span>
  );
}

function SentimentBar({ b }: { b: Record<Sentiment, number> }) {
  const order: Sentiment[] = ["positive", "neutral", "negative"];
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-ink/[0.07]" aria-hidden>
        {order.map((s) => (b[s] ? <span key={s} style={{ width: `${b[s]}%`, background: SENT[s].color }} /> : null))}
      </div>
      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {order.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: SENT[s].color }} />
            {SENT[s].label} <b className="font-mono tabular-nums">{b[s]}%</b>
          </span>
        ))}
      </p>
    </div>
  );
}

function TrendChart({ data }: { data: ContextResponse }) {
  // SVG attributes don't resolve CSS variables, so the site's colours are read once from the page.
  const [c, setC] = useState({ line: "#d8232a", axis: "#555555", grid: "#e4e4e4" });
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
    setC({ line: v("--accent", "#d8232a"), axis: v("--muted", "#555555"), grid: v("--line", "#e4e4e4") });
  }, []);
  const vals = data.trend.map((p) => p.value);
  return (
    <figure>
      <figcaption className="sr-only">
        Search interest for {data.keyword} over 90 days, from {Math.min(...vals)} to {Math.max(...vals)} on a 0–100 scale, latest {vals.at(-1)}.
      </figcaption>
      <div className="h-64 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 256 }}>
          <LineChart accessibilityLayer={false} data={data.trend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: c.axis }} minTickGap={28} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 12, fill: c.axis }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${c.grid}`, fontSize: 13 }} formatter={(v) => [String(v), "Interest"]} />
            <Line type="monotone" dataKey="value" stroke={c.line} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/* Trends' related and rising searches plus Google's search suggestions. Any keyword can be searched with one click. */
function RelatedKeywords({ data, onPick }: { data: ContextResponse; onPick: (k: string) => void }) {
  const trendsDown = data.unavailable.includes("trends");
  const suggestDown = data.unavailable.includes("keywords");
  const { top, rising } = data.related;
  const { suggestions, comparisons } = data.keywords;
  const nothing = !top.length && !rising.length && !suggestions.length && !comparisons.length;
  const trendsNote = trendsDown ? "Google Trends is temporarily unavailable." : "None reported for this keyword.";
  const suggestNote = suggestDown ? "Search suggestions are temporarily unavailable." : "None reported for this keyword.";
  return (
    <Section title="Related keywords" sub="Google Trends and Google search suggestions">
      {trendsDown && suggestDown ? (
        <Muted>{UNAVAILABLE}</Muted>
      ) : nothing ? (
        <Muted>{EMPTY}</Muted>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Terms title="Related searches" hint="Most searched alongside it, 0–100" empty={trendsNote} onPick={onPick} terms={top.map((t) => ({ q: t.query, tag: String(t.value) }))} />
            <Terms title="Rising searches" hint="Fastest-growing; Breakout means over 5,000%" empty={trendsNote} onPick={onPick} terms={rising.map((t) => ({ q: t.query, tag: t.value === "Breakout" ? "Breakout" : `+${t.value}%` }))} />
            <Terms title="People also search" hint="What people type after it" empty={suggestNote} onPick={onPick} terms={suggestions.map((q) => ({ q }))} />
            <Terms title="Comparisons" hint="“vs” searches: who it's weighed against" empty={suggestNote} onPick={onPick} terms={comparisons.map((q) => ({ q }))} />
          </div>
          <p className="mt-4 text-xs text-muted">Select a keyword to see its context.</p>
        </>
      )}
    </Section>
  );
}

function Terms({ title, hint, terms, empty, onPick }: { title: string; hint: string; terms: { q: string; tag?: string }[]; empty: string; onPick: (k: string) => void }) {
  return (
    <div>
      <h3 className="font-display font-bold">{title}</h3>
      <p className="text-xs text-muted">{hint}</p>
      {terms.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {terms.map((t) => (
            <li key={t.q}>
              <button
                type="button"
                onClick={() => onPick(t.q)}
                className="rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-left text-sm transition-colors hover:border-ink [overflow-wrap:anywhere]"
              >
                {t.q}
                {t.tag && <span className="ml-1.5 font-mono text-xs text-muted">{t.tag}</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}
