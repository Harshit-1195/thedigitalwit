"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import type { Speed } from "@/lib/mmm/engine";
import { MAX_BYTES, type Check, type Role, type Table } from "@/lib/mmm/data";
import type { KpiType, Settings } from "@/lib/mmm/insights";
import { PanelHead } from "./panels";
import { btn, btnPrimary, inp, Seg, STATUS } from "./ui";

const ROLE_LABEL: Record<Role, string> = { date: "Date", kpi: "KPI (what you measure)", spend: "Channel spend", control: "Control (promo, price…)", ignore: "Ignore" };
const CHECK: Record<Check["level"], { icon: string; color: string; word: string }> = {
  ok: { icon: "✓", color: STATUS.good, word: "OK" },
  warn: { icon: "!", color: STATUS.warn, word: "Check" },
  error: { icon: "×", color: STATUS.crit, word: "Fix" },
};

export function DataPanel({
  table,
  roles,
  setRoles,
  checks,
  onText,
  settings,
  setSettings,
  onRun,
  running,
  canRun,
  onSample,
  onTemplate,
  onExport,
  activeName,
  sample,
}: {
  table: Table | null;
  roles: Role[];
  setRoles: (r: Role[]) => void;
  checks: Check[];
  onText: (text: string, name: string, source: "upload" | "paste") => void;
  settings: Settings;
  setSettings: (p: Partial<Settings>) => void;
  onRun: () => void;
  running: boolean;
  canRun: boolean;
  onSample: () => void;
  onTemplate: () => void;
  onExport: () => void;
  activeName: string;
  sample: boolean;
}) {
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [paste, setPaste] = useState("");
  const [fileErr, setFileErr] = useState("");

  const readFile = (f: File) => {
    setFileErr("");
    if (!/\.(csv|tsv|txt)$/i.test(f.name)) return setFileErr(/\.xlsx?$/i.test(f.name) ? "Excel files can't be read directly yet. Save the sheet as CSV (File → Save as → CSV) and upload that." : "Use a .csv, .tsv or .txt file.");
    if (f.size > MAX_BYTES) return setFileErr("That file is over 20 MB. Export weekly totals rather than every row.");
    const fr = new FileReader();
    fr.onload = () => onText(String(fr.result ?? ""), f.name, "upload");
    fr.onerror = () => setFileErr("The file couldn't be read.");
    fr.readAsText(f);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) readFile(f);
  };
  const m = settings.model;
  const setModel = (p: Partial<Settings["model"]>) => setSettings({ model: { ...m, ...p } });
  const errors = checks.filter((c) => c.level === "error").length;

  return (
    <>
      <PanelHead title="Data & settings" intro={`Now modeling: ${activeName}. Bring your own weekly data: a date column, your KPI (revenue or conversions) and one spend column per channel. Files are read in your browser and never uploaded.`}>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={onTemplate}>
            Download template
          </button>
          <button type="button" className={btn} onClick={onExport}>
            Export results (CSV)
          </button>
          {!sample && (
            <button type="button" className={btn} onClick={onSample}>
              Back to the sample
            </button>
          )}
        </div>
      </PanelHead>

      <div className="grid gap-6 min-[900px]:grid-cols-2">
        <section aria-labelledby={`${id}-up`} className="glass rounded-3xl p-5 sm:p-6">
          <h3 id={`${id}-up`} className="font-display text-lg font-bold">
            Upload a file
          </h3>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={`mt-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${drag ? "border-accent bg-white" : "border-ink/20 bg-white/50"}`}
          >
            <p className="font-display font-semibold">Drop a CSV here</p>
            <p className="mt-1 text-sm text-muted">.csv, .tsv or .txt, up to 20 MB. Weekly or daily rows (daily is added up into weeks).</p>
            <label htmlFor={`${id}-file`} className={`${btnPrimary} mt-4 cursor-pointer focus-within:outline-3 focus-within:outline-offset-4 focus-within:outline-accent`}>
              Choose file
              <input
                id={`${id}-file`}
                ref={file}
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/plain"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readFile(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {fileErr && <p className="mt-3 text-sm" style={{ color: STATUS.crit }}>× {fileErr}</p>}
        </section>
        <section aria-labelledby={`${id}-pa`} className="glass rounded-3xl p-5 sm:p-6">
          <h3 id={`${id}-pa`} className="font-display text-lg font-bold">
            Or paste from a spreadsheet
          </h3>
          <label htmlFor={`${id}-paste`} className="mt-1 block text-sm text-muted">
            Copy the cells, header row included, and paste them here.
          </label>
          <textarea id={`${id}-paste`} value={paste} onChange={(e) => setPaste(e.target.value)} rows={6} placeholder={"date\trevenue\ttv_spend\tsearch_spend\n2025-01-06\t412000\t65000\t21000"} className={`${inp} mt-3 font-mono text-xs`} />
          <button type="button" className={`${btn} mt-3`} disabled={paste.trim().length < 5} onClick={() => onText(paste, "Pasted data", "paste")}>
            Use pasted data
          </button>
        </section>
      </div>

      {table && (
        <section aria-labelledby={`${id}-cols`} className="glass min-w-0 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 id={`${id}-cols`} className="font-display text-lg font-bold">
              Columns in {table.name}
            </h3>
            <p className="text-sm text-muted">
              {table.rows.length} rows · roles were guessed from the names; change any that are wrong.
            </p>
          </div>
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th scope="col" className="py-2 pr-3 font-display font-semibold">Column</th>
                  <th scope="col" className="py-2 pr-3 font-display font-semibold">First values</th>
                  <th scope="col" className="py-2 font-display font-semibold">Role</th>
                </tr>
              </thead>
              <tbody>
                {table.headers.map((h, i) => (
                  <tr key={h + i} className="border-b border-ink/10">
                    <th scope="row" className="py-2 pr-3 font-semibold">{h}</th>
                    <td className="max-w-[16rem] truncate py-2 pr-3 font-mono text-xs text-muted">{table.rows.slice(0, 3).map((r) => r[i] ?? "").join(" · ")}</td>
                    <td className="py-2">
                      <select aria-label={`Role of ${h}`} value={roles[i]} onChange={(e) => setRoles(roles.map((r, j) => (j === i ? (e.target.value as Role) : r)))} className={`${inp} w-auto font-sans`}>
                        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {checks.length > 0 && (
        <section aria-labelledby={`${id}-chk`} className="glass rounded-3xl p-5 sm:p-6">
          <h3 id={`${id}-chk`} className="font-display text-lg font-bold">
            Data check
          </h3>
          <ul className="mt-3 space-y-2" aria-live="polite">
            {checks.map((c, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="mt-0.5 inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 font-display text-[0.7rem] font-semibold text-white" style={{ background: CHECK[c.level].color }}>
                  <span aria-hidden>{CHECK[c.level].icon}</span>
                  {CHECK[c.level].word}
                </span>
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby={`${id}-set`} className="glass rounded-3xl p-5 sm:p-6">
        <h3 id={`${id}-set`} className="font-display text-lg font-bold">
          Settings
        </h3>
        <div className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,14rem),1fr))]">
          <div>
            <p className="font-display text-sm font-semibold">KPI type</p>
            <div className="mt-2">
              <Seg<KpiType> label="KPI type" value={settings.kpiType} options={[["revenue", "Revenue"], ["conversions", "Conversions"]]} onChange={(v) => setSettings({ kpiType: v })} />
            </div>
          </div>
          <div>
            <label htmlFor={`${id}-cur`} className="font-display text-sm font-semibold">
              Currency symbol
            </label>
            <input id={`${id}-cur`} value={settings.currency} maxLength={4} onChange={(e) => setSettings({ currency: e.target.value.slice(0, 4) })} className={`${inp} mt-2`} />
          </div>
          {settings.kpiType === "revenue" ? (
            <div>
              <label htmlFor={`${id}-mg`} className="font-display text-sm font-semibold">
                Gross margin (%)
              </label>
              <input id={`${id}-mg`} type="number" min={1} max={100} value={settings.margin} onChange={(e) => setSettings({ margin: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} className={`${inp} mt-2`} />
              <p className="mt-1 text-xs text-muted">Sets break-even: ROAS of {(100 / settings.margin).toFixed(2)}×.</p>
            </div>
          ) : (
            <div>
              <label htmlFor={`${id}-cpa`} className="font-display text-sm font-semibold">
                Target cost per conversion
              </label>
              <input id={`${id}-cpa`} type="number" min={0} value={settings.targetCpa || ""} placeholder="Optional" onChange={(e) => setSettings({ targetCpa: Math.max(0, Number(e.target.value) || 0) })} className={`${inp} mt-2`} />
              <p className="mt-1 text-xs text-muted">Blank: channels are compared with the average.</p>
            </div>
          )}
          <div>
            <label htmlFor={`${id}-ho`} className="font-display text-sm font-semibold">
              Weeks held out for testing
            </label>
            <input id={`${id}-ho`} type="number" min={0} max={26} value={m.holdout} onChange={(e) => setModel({ holdout: Math.min(26, Math.max(0, Math.round(Number(e.target.value) || 0))) })} className={`${inp} mt-2`} />
          </div>
          <div>
            <p className="font-display text-sm font-semibold">Uncertainty detail</p>
            <div className="mt-2">
              <Seg<Speed> label="Uncertainty detail" value={m.speed} options={[["quick", "Quick"], ["standard", "Standard"], ["thorough", "Thorough"]]} onChange={(v) => setModel({ speed: v })} />
            </div>
          </div>
          <fieldset>
            <legend className="font-display text-sm font-semibold">Baseline</legend>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={m.seasonality} onChange={(e) => setModel({ seasonality: e.target.checked })} className="size-4 accent-[var(--accent)]" />
              Yearly seasonality (52+ weeks)
            </label>
            <label className="mt-1 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={m.trend} onChange={(e) => setModel({ trend: e.target.checked })} className="size-4 accent-[var(--accent)]" />
              Long-term trend
            </label>
          </fieldset>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button type="button" className={btnPrimary} onClick={onRun} disabled={running || !canRun}>
            {running ? "Running…" : "Run model"}
          </button>
          <p className="text-sm text-muted">{errors ? `Fix the ${errors === 1 ? "item" : `${errors} items`} marked Fix first.` : "Margin, currency and targets apply instantly; data and model settings need a re-run."}</p>
        </div>
      </section>
    </>
  );
}
