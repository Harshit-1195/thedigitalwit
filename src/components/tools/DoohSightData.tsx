"use client";

import { useId, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { LAYER_LABEL, SAMPLE, type Inputs } from "@/lib/doohsight";
import { diff, FIELDS, importText, LAYOUTS, NUM_KEYS, toCsv, type Auto, type Group, type Imported } from "@/lib/doohsight-data";
import { num } from "./fields";
import { DescribeBox } from "@/components/ai/DescribeBox";
import { DOOH_SPEC } from "@/lib/ai/specs";

export type Sources = Partial<Record<keyof Inputs, string>>;
export const TRENDS_SOURCE = "Google Trends index";

type Loaded = { file: string; result: Imported | { error: string } };

const AUTO_LABEL: Record<Auto, string> = { file: "Raw report upload", market: "Market lookup", both: "Raw upload or market lookup", manual: "Vendor figure" };
const GROUP_LABEL = (g: Group) => (g === "trust" ? "Trust & quality" : LAYER_LABEL[g]);
const fmt = (v: number | string) => (typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : v);

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const btn = "rounded-full border-2 border-ink/15 bg-white/70 px-4 py-2 font-display text-sm font-semibold transition-colors hover:border-ink disabled:opacity-50";
const btnDark = "rounded-full bg-ink px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-50";
const input = "mt-2 w-full border-b-2 border-ink bg-transparent py-1 font-mono outline-none focus:border-accent";

export function DataPanel({ inputs, sources, apply }: { inputs: Inputs; sources: Sources; apply: (values: Partial<Inputs>, sources: Sources) => void }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-3xl font-bold tracking-[-0.04em]">Data sources</h2>
        <p className="font-mono text-sm text-muted">Files are read in this browser</p>
      </div>
      <p className="max-w-3xl text-muted">
        Every number on the other tabs can be typed in, uploaded from the reports your vendors send, or, for population and branded search, looked up from free market data. DoohSight works out the inputs from raw reports and shows you every change before it applies it.
      </p>
      <DescribeBox
        spec={DOOH_SPEC}
        title="Describe your results"
        intro="Paste or type what your report says, e.g. spend, screens, impressions, visit rates or a holdout test. Every input it finds is filled and the score recalculates."
        onApply={(v) => apply(v as Partial<Inputs>, Object.fromEntries(Object.keys(v).map((k) => [k, "Your description"])))}
      />
      <Upload inputs={inputs} apply={apply} />
      <Market inputs={inputs} apply={apply} />
      <SourceTable inputs={inputs} sources={sources} />
    </>
  );
}

/* ---------- upload ---------- */
function Upload({ inputs, apply }: { inputs: Inputs; apply: (v: Partial<Inputs>, s: Sources) => void }) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState<Loaded[]>([]);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState("");

  const read = async (files: FileList | File[]) => {
    const list = [...files].slice(0, 10);
    const out = await Promise.all(
      list.map(async (f) => ({ file: f.name, result: f.size > 20_000_000 ? { error: "Files over 20 MB aren't supported. Upload a daily summary instead of every play." } : importText(await f.text(), f.name) })),
    );
    setLoaded(out);
    setStatus("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // Later files win when two set the same input.
  const merged: Partial<Inputs> = {};
  const from: Sources = {};
  for (const l of loaded)
    if (!("error" in l.result))
      for (const [k, v] of Object.entries(l.result.values) as [keyof Inputs, number | string][]) {
        (merged as Record<string, unknown>)[k] = v;
        from[k] = l.file;
      }
  const changes = diff(inputs, merged);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files.length) read(e.dataTransfer.files);
  };

  return (
    <section aria-labelledby={`${id}-h`} className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id={`${id}-h`} className="font-display text-xl font-bold">
          Upload your data
        </h3>
        <button type="button" className={btn} onClick={() => download("doohsight-inputs.csv", toCsv(inputs))}>
          Download template with current numbers
        </button>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`mt-4 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${drag ? "border-accent bg-white/80" : "border-ink/20 bg-white/40"}`}
      >
        <p className="font-display font-semibold">Drop CSV files here</p>
        <p className="mt-1 text-sm text-muted">Proof-of-play logs, weekly channel data, exposed/control exports or the summary template. Several at once is fine.</p>
        <label htmlFor={`${id}-file`} className={`${btnDark} mt-4 inline-block cursor-pointer focus-within:outline-3 focus-within:outline-offset-4 focus-within:outline-accent`}>
          Choose files
          <input id={`${id}-file`} ref={fileRef} type="file" multiple accept=".csv,.tsv,.txt,.json,text/csv,application/json" className="sr-only" onChange={(e) => e.target.files && read(e.target.files)} />
        </label>
      </div>

      {loaded.length > 0 && (
        <div className="mt-5 space-y-3">
          <ul className="space-y-2">
            {loaded.map((l, i) => (
              <li key={i} className={`rounded-2xl border-l-4 bg-white/60 p-4 ${"error" in l.result ? "border-[#b91c1c]" : "border-[#15803d]"}`}>
                <p className="font-display text-sm font-semibold">
                  <span aria-hidden>{"error" in l.result ? "× " : "✓ "}</span>
                  {l.file}
                  <span className="font-normal text-muted"> · {"error" in l.result ? "couldn't be read" : `${l.result.title}, ${Object.keys(l.result.values).length} inputs`}</span>
                </p>
                {"error" in l.result ? (
                  <p className="mt-1 text-sm">{l.result.error}</p>
                ) : (
                  l.result.notes.length > 0 && (
                    <ul className="mt-1 list-square pl-5 text-sm text-muted">
                      {l.result.notes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  )
                )}
              </li>
            ))}
          </ul>

          {changes.length > 0 ? (
            <div>
              <p className="font-display font-semibold">Review {changes.length === 1 ? "1 change" : `${changes.length} changes`}</p>
              <div className="mt-2 max-h-96 overflow-auto rounded-2xl bg-white/60">
                <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b-2 border-ink">
                      <th scope="col" className="px-3 py-2 font-display font-semibold">Input</th>
                      <th scope="col" className="px-3 py-2 text-right font-display font-semibold">Now</th>
                      <th scope="col" className="px-3 py-2 text-right font-display font-semibold">New</th>
                      <th scope="col" className="px-3 py-2 font-display font-semibold">From</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changes.map((c) => (
                      <tr key={c.key} className="border-b border-ink/10">
                        <th scope="row" className="px-3 py-2 font-semibold">{c.key === "campaign" ? "Campaign name" : FIELDS[c.key].label}</th>
                        <td className="px-3 py-2 text-right font-mono text-muted tabular-nums">{fmt(c.from)}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">{fmt(c.to)}</td>
                        <td className="px-3 py-2 text-muted">{from[c.key]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnDark}
                  onClick={() => {
                    apply(Object.fromEntries(changes.map((c) => [c.key, c.to])) as Partial<Inputs>, Object.fromEntries(changes.map((c) => [c.key, from[c.key]])));
                    setStatus(`Applied ${changes.length === 1 ? "1 change" : `${changes.length} changes`}. The score and every tab now use them.`);
                    setLoaded([]);
                  }}
                >
                  Apply {changes.length === 1 ? "1 change" : `${changes.length} changes`}
                </button>
                <button type="button" className={btn} onClick={() => setLoaded([])}>
                  Discard
                </button>
              </div>
            </div>
          ) : (
            loaded.some((l) => !("error" in l.result)) && <p className="text-sm text-muted">These files match the numbers you already have; nothing to change.</p>
          )}
        </div>
      )}
      <p role="status" className="mt-3 text-sm font-semibold text-[#15803d] empty:hidden">
        {status}
      </p>

      <details className="mt-5 rounded-2xl bg-white/50 p-4">
        <summary className="cursor-pointer font-display font-semibold">What files DoohSight can read</summary>
        <p className="mt-2 text-sm text-muted">Column names are matched loosely (case, spaces and underscores don&apos;t matter). Excel files: save as CSV first.</p>
        <div className="mt-3 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))]">
          {LAYOUTS.map((l) => (
            <div key={l.kind} className="rounded-2xl bg-white/70 p-4 text-sm">
              <p className="font-display font-bold">{l.title}</p>
              <p className="mt-1 text-muted">From: {l.from}</p>
              <p className="mt-2">
                <span className="font-semibold">Columns:</span> <span className="font-mono text-[0.8rem]">{l.columns}</span>
              </p>
              <p className="mt-1">
                <span className="font-semibold">Fills:</span> {l.fills}
              </p>
              <button type="button" className={`${btn} mt-3`} onClick={() => download(l.file, l.example)}>
                Download example
              </button>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

/* ---------- market lookups ---------- */
type PopMatch = { id: string; label: string; description: string; population: number; year: number | null };
type SearchResult = { before: number; during: number; beforeN: number; duringN: number; weeks: number };

async function lookup<T>(params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`/api/doohsight-market?${new URLSearchParams(params)}`, { signal });
  const body = (await res.json().catch(() => ({ error: "The lookup failed. Try again." }))) as T & { error?: string };
  if (!res.ok || body.error) throw new Error(body.error ?? "The lookup failed. Try again.");
  return body;
}

function Market({ inputs, apply }: { inputs: Inputs; apply: (v: Partial<Inputs>, s: Sources) => void }) {
  return (
    <section aria-labelledby="ds-market" className="glass rounded-3xl p-5 sm:p-6">
      <h3 id="ds-market" className="font-display text-xl font-bold">
        Fill from market data
      </h3>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        Free public sources, no account needed. Only what you type in these two boxes is sent: the place name to Wikidata, and the brand and dates to Google Trends.
      </p>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <PopulationLookup current={inputs.population} apply={apply} />
        <SearchLookup inputs={inputs} apply={apply} />
      </div>
    </section>
  );
}

function PopulationLookup({ current, apply }: { current: number; apply: (v: Partial<Inputs>, s: Sources) => void }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [state, setState] = useState<{ loading?: boolean; error?: string; matches?: PopMatch[]; used?: string }>({});
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState({ loading: true });
    try {
      setState(await lookup<{ matches: PopMatch[] }>({ type: "population", q }));
    } catch (err) {
      setState({ error: (err as Error).message });
    }
  };
  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/50 p-4" aria-labelledby={`${id}-h`}>
      <p id={`${id}-h`} className="font-display font-bold">Target market population</p>
      <p className="mt-1 text-sm text-muted">Census figures for a city, region or country, from Wikidata. Now: {num(current)}</p>
      <label htmlFor={`${id}-q`} className="mt-3 block font-display text-sm font-semibold">
        City, region or country
      </label>
      <div className="flex items-end gap-2">
        <input id={`${id}-q`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Manchester" className={input} required minLength={2} maxLength={80} />
        <button type="submit" className={`${btnDark} shrink-0 whitespace-nowrap`} disabled={state.loading}>
          {state.loading ? "Looking up…" : "Look up"}
        </button>
      </div>
      <div aria-live="polite" className="mt-3 text-sm">
        {state.error && <p className="text-[#b91c1c]">{state.error}</p>}
        {state.used && <p className="font-semibold text-[#15803d]">✓ {state.used}</p>}
        {state.matches && state.matches.length === 0 && <p className="text-muted">No place with a population figure matched. Try the full name, like &ldquo;Greater Manchester&rdquo;.</p>}
        {state.matches && state.matches.length > 0 && (
          <ul className="space-y-1.5">
            {state.matches.map((m) => {
              const tag = `Wikidata: ${m.label}${m.year ? `, ${m.year}` : ""}`;
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2">
                  <span className="min-w-0">
                    <span className="font-semibold">{m.label}</span> <span className="text-muted">{m.description}</span>
                    <span className="block font-mono text-xs tabular-nums">
                      {num(m.population)}
                      {m.year ? ` (${m.year})` : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={btn}
                    aria-label={`Use ${m.label}, ${num(m.population)}`}
                    onClick={() => {
                      apply({ population: m.population }, { population: tag });
                      setState({ used: `Population set to ${num(m.population)} (${m.label}${m.year ? `, ${m.year}` : ""}).` });
                    }}
                  >
                    Use
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </form>
  );
}

function SearchLookup({ inputs, apply }: { inputs: Inputs; apply: (v: Partial<Inputs>, s: Sources) => void }) {
  const id = useId();
  const [f, setF] = useState({ term: "", start: "", end: "", before: "8", geo: "" });
  const [state, setState] = useState<{ loading?: boolean; error?: string; result?: SearchResult; used?: string }>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState({ loading: true });
    try {
      setState({ result: await lookup<SearchResult>({ type: "search", ...f }) });
    } catch (err) {
      setState({ error: (err as Error).message });
    }
  };
  const r = state.result;
  const lift = r && r.before ? ((r.during - r.before) / r.before) * 100 : null;
  const label = (k: keyof typeof f, text: string, el: ReactNode) => (
    <div>
      <label htmlFor={`${id}-${k}`} className="block font-display text-sm font-semibold">
        {text}
      </label>
      {el}
    </div>
  );
  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/50 p-4" aria-labelledby={`${id}-h`}>
      <p id={`${id}-h`} className="font-display font-bold">Branded search, before vs during</p>
      <p className="mt-1 text-sm text-muted">
        Google Trends interest in your brand name. It&apos;s an index (0–100), not a search count, so the lift % is what to read. Now: {num(inputs.searchBase)} → {num(inputs.searchCampaign)}
      </p>
      <div className="mt-3 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,9rem),1fr))]">
        <div className="col-span-full">{label("term", "Brand name", <input id={`${id}-term`} value={f.term} onChange={set("term")} required minLength={2} maxLength={100} placeholder="e.g. Meridian Coffee" className={input} />)}</div>
        {label("start", "Flight start", <input id={`${id}-start`} type="date" value={f.start} onChange={set("start")} required className={input} />)}
        {label("end", "Flight end", <input id={`${id}-end`} type="date" value={f.end} onChange={set("end")} required className={input} />)}
        {label("before", "Weeks before to compare", <input id={`${id}-before`} type="number" min={1} max={26} value={f.before} onChange={set("before")} required className={input} />)}
        {label("geo", "Country code (optional)", <input id={`${id}-geo`} value={f.geo} onChange={set("geo")} maxLength={6} placeholder="US, GB, IN…" className={`${input} uppercase`} />)}
      </div>
      <button type="submit" className={`${btnDark} mt-4`} disabled={state.loading}>
        {state.loading ? "Fetching…" : "Fetch search interest"}
      </button>
      <div aria-live="polite" className="mt-3 text-sm">
        {state.error && <p className="text-[#b91c1c]">{state.error}</p>}
        {state.used && <p className="font-semibold text-[#15803d]">✓ {state.used}</p>}
        {r && (
          <div className="rounded-xl bg-white/70 p-3">
            {r.before === 0 && r.during === 0 ? (
              <p>Google Trends has too little search for this name to measure. Try a shorter or more common brand term.</p>
            ) : (
              <>
                <p className="font-mono tabular-nums">
                  Before {num(r.before, 1)} → during {num(r.during, 1)}
                  {lift !== null && <span className="font-semibold"> ({lift >= 0 ? "+" : "−"}{num(Math.abs(lift), 1)}%)</span>}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Averaged over {r.beforeN} points before and {r.duringN} during · {r.weeks} campaign {r.weeks === 1 ? "week" : "weeks"}
                </p>
                <button
                  type="button"
                  className={`${btn} mt-2`}
                  onClick={() => {
                    apply({ searchBase: r.before, searchCampaign: r.during, weeks: r.weeks }, { searchBase: TRENDS_SOURCE, searchCampaign: TRENDS_SOURCE, weeks: "Flight dates" });
                    setState({ used: "Branded search and campaign weeks filled from Google Trends." });
                  }}
                >
                  Use these
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

/* ---------- where every input comes from ---------- */
function SourceTable({ inputs, sources }: { inputs: Inputs; sources: Sources }) {
  const groups = [...new Set(NUM_KEYS.map((k) => FIELDS[k].group))];
  const now = (k: (typeof NUM_KEYS)[number]) => sources[k] ?? (inputs[k] === SAMPLE[k] ? "Sample" : "Typed in");
  return (
    <section aria-labelledby="ds-where" className="glass min-w-0 rounded-3xl p-5 sm:p-6">
      <h3 id="ds-where" className="font-display text-xl font-bold">
        Where every input comes from
      </h3>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        Any input can be typed in or included in the summary template. &ldquo;Raw report upload&rdquo; and &ldquo;Market lookup&rdquo; mark the ones DoohSight can work out for you. Vendor figures (attention, reach, verification, category spend) come as finished numbers in your vendors&apos; reports, and there&apos;s no free public source for them.
      </p>
      <div className="relative mt-4 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink">
              <th scope="col" className="py-2 pr-3 font-display font-semibold">Input</th>
              <th scope="col" className="py-2 pr-3 text-right font-display font-semibold">Value</th>
              <th scope="col" className="py-2 pr-3 font-display font-semibold">Set by</th>
              <th scope="col" className="py-2 pr-3 font-display font-semibold">Who provides it</th>
              <th scope="col" className="py-2 font-display font-semibold">Can be automated</th>
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g}>
              <tr>
                <th colSpan={5} scope="colgroup" className="pt-4 pb-1 font-display text-xs font-semibold tracking-wide text-muted uppercase">
                  {GROUP_LABEL(g)}
                </th>
              </tr>
              {NUM_KEYS.filter((k) => FIELDS[k].group === g).map((k) => (
                <tr key={k} className="border-b border-ink/10 align-top">
                  <th scope="row" className="py-2 pr-3 font-semibold">{FIELDS[k].label}</th>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums">{fmt(inputs[k])}</td>
                  <td className={`py-2 pr-3 ${now(k) === "Sample" ? "text-muted" : ""}`}>{now(k)}</td>
                  <td className="py-2 pr-3 text-muted">{FIELDS[k].from}</td>
                  <td className="py-2">{AUTO_LABEL[FIELDS[k].auto]}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
