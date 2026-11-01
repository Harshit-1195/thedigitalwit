"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { fitModel, type Dataset, type FitResult } from "@/lib/mmm/engine";
import { buildDataset, guessRoles, readTable, resultsCsv, templateCsv, type Role, type Table } from "@/lib/mmm/data";
import { ACTION_LABEL, DEFAULT_SETTINGS, fmtKpi, fmtRoi, summarize, type Settings } from "@/lib/mmm/insights";
import { sampleDataset } from "@/lib/mmm/sample";
import { DataPanel } from "./DataTab";
import { CurvesPanel, FitPanel, MethodPanel, RoiPanel, SummaryPanel, type Ctx, type View } from "./panels";
import { OptimizerPanel, ScenarioPanel } from "./planning";
import { btn, btnPrimary, FsProvider, TipProvider } from "./ui";
import { DescribeBox } from "@/components/ai/DescribeBox";
import { MMM_SPEC } from "@/lib/ai/specs";
import type { Filled } from "@/lib/ai/fill";

const SETTINGS_KEY = "mmm-settings-v1";
const VIEW_KEY = "mmm-view-v1";
const DEFAULT_VIEW: View = { weekly: "media", smooth: false, roi: "bars", fit: "time" };

const TABS = [
  ["summary", "Summary"],
  ["roi", "Channel ROI"],
  ["curves", "Response curves"],
  ["optimizer", "Budget optimizer"],
  ["scenarios", "Scenario planner"],
  ["fit", "Model accuracy"],
  ["data", "Data & settings"],
  ["method", "Methodology"],
] as const;
type Tab = (typeof TABS)[number][0];
const isTab = (h: string): h is Tab => TABS.some(([t]) => t === h);

function load<T>(key: string, fallback: T): T {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "null");
    return v && typeof v === "object" ? { ...fallback, ...v } : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

type Status = { running: boolean; progress: number; label: string; error: string | null };

export function MediaMixModel() {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [view, setViewState] = useState<View>(DEFAULT_VIEW);
  const [dataset, setDataset] = useState<Dataset>(() => sampleDataset());
  const [result, setResult] = useState<FitResult | null>(null);
  const [status, setStatus] = useState<Status>({ running: true, progress: 0, label: "Starting", error: null });
  const [tab, setTabState] = useState<Tab>("summary");
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const runId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((m: string) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  const setSettings = (p: Partial<Settings>) =>
    setSettingsState((s) => {
      const next = { ...s, ...p };
      save(SETTINGS_KEY, next);
      return next;
    });
  const setView = (p: Partial<View>) =>
    setViewState((v) => {
      const next = { ...v, ...p };
      save(VIEW_KEY, next);
      return next;
    });

  const run = useCallback(async (d: Dataset, model: Settings["model"]) => {
    const id = ++runId.current;
    setStatus({ running: true, progress: 0, label: "Preparing data", error: null });
    try {
      const r = await fitModel(d, model, (f, label) => id === runId.current && setStatus({ running: true, progress: f, label, error: null }));
      if (id !== runId.current) return;
      setDataset(d);
      setResult(r);
      setZoom(null);
      setStatus({ running: false, progress: 1, label: "", error: null });
    } catch (e) {
      if (id !== runId.current) return;
      setStatus({ running: false, progress: 0, label: "", error: (e as Error).message || "The model couldn't be fitted." });
    }
  }, []);

  // Once on load: saved preferences, the tab from the address, then fit the sample.
  useEffect(() => {
    const s = load(SETTINGS_KEY, DEFAULT_SETTINGS);
    s.model = { ...DEFAULT_SETTINGS.model, ...s.model };
    setSettingsState(s);
    setViewState(load(VIEW_KEY, DEFAULT_VIEW));
    const h = location.hash.slice(1);
    if (isTab(h)) setTabState(h);
    const onHash = () => {
      const t = location.hash.slice(1);
      if (isTab(t)) setTabState(t);
    };
    window.addEventListener("hashchange", onHash);
    run(sampleDataset(), s.model);
    return () => {
      window.removeEventListener("hashchange", onHash);
      runId.current++;
    };
  }, [run]);

  const setTab = (t: Tab) => {
    setTabState(t);
    history.replaceState(null, "", `#${t}`);
  };

  const sum = useMemo(() => (result ? summarize(result, settings) : null), [result, settings]);
  const pending = useMemo(() => (table ? buildDataset(table, roles) : null), [table, roles]);

  const onText = (text: string, name: string) => {
    const t = readTable(text, name);
    if (!t.headers.length) return notify("No rows found in that data.");
    setTable(t);
    setRoles(guessRoles(t));
    notify(`Loaded ${t.rows.length} rows from ${name}. Check the columns, then run the model.`);
  };
  const onRun = () => {
    if (pending?.dataset) run(pending.dataset, settings.model);
    else if (!table) run(dataset, settings.model);
  };

  // "Describe your case": settings apply at once; a change to held-out weeks or detail re-runs the model.
  const fromDescription = (v: Filled) => {
    const model: Settings["model"] = {
      ...settings.model,
      ...(typeof v.holdout === "number" && { holdout: Math.min(26, Math.round(v.holdout)) }),
      ...((v.speed === "quick" || v.speed === "standard" || v.speed === "thorough") && { speed: v.speed as Settings["model"]["speed"] }),
    };
    setSettings({
      ...((v.kpiType === "revenue" || v.kpiType === "conversions") && { kpiType: v.kpiType }),
      ...(typeof v.currency === "string" && { currency: v.currency }),
      ...(typeof v.margin === "number" && v.margin > 0 && { margin: Math.min(100, v.margin) }),
      ...(typeof v.targetCpa === "number" && { targetCpa: v.targetCpa }),
      model,
    });
    if (model.holdout !== settings.model.holdout || model.speed !== settings.model.speed) run(dataset, model);
  };

  const copySummary = async () => {
    if (!result || !sum) return;
    const s = settings;
    const lines = [
      `Media mix model summary: ${dataset.name} (${result.n} weeks, ${result.channels.length} channels)`,
      "",
      sum.headline,
      sum.sub,
      "",
      `Media drove ${(sum.mediaShare * 100).toFixed(0)}% of ${s.kpiType}; return on media ${fmtRoi(s, sum.totalRoi)}. Holdout accuracy ${sum.accuracy.toFixed(1)}%.`,
      "",
      ...result.channels.map((c, i) => `- ${c.name}: ${fmtRoi(s, c.roi)} (90% range ${fmtRoi(s, c.ci.roi[0])} to ${fmtRoi(s, c.ci.roi[1])}), contribution ${fmtKpi(s, c.totalContrib)}. ${ACTION_LABEL[sum.actions[i]]}.`),
      "",
      ...sum.insights.map((t) => `• ${t}`),
    ];
    notify((await copyText(lines.join("\n"))) ? "Summary copied" : "Couldn't copy: select the text manually");
  };

  const ctx: Ctx | null = result && sum ? { r: result, s: settings, sum, d: dataset, view, setView, zoom, setZoom } : null;
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onTabKey = (e: KeyboardEvent) => {
    const i = TABS.findIndex(([t]) => t === tab);
    const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (n === null) return;
    e.preventDefault();
    const next = TABS[(n + TABS.length) % TABS.length][0];
    setTab(next);
    tabRefs.current[next]?.focus();
  };
  const accuracy = sum ? `Holdout accuracy ${sum.accuracy.toFixed(1)}%` : "";

  return (
    <TipProvider>
      <FsProvider>
        <div className="ml-root pb-20">
          {/* Sticky bar under the site header: dataset, status, actions, tabs. */}
          <div className="sticky top-16 z-30 lg:top-[4.5rem]">
            <div className="wrap pt-3">
              <div className="glass-strong rounded-3xl p-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-2 pt-1 pb-2">
                  <p className="flex min-w-0 items-center gap-2 font-display text-sm font-semibold">
                    <span className="truncate">{dataset.name}</span>
                    {dataset.sample && <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-strong">Sample</span>}
                    <span className="hidden shrink-0 font-mono text-xs font-normal text-muted sm:inline">
                      {dataset.kpi.length} wk · {dataset.channels.length} channels
                    </span>
                  </p>
                  <div className="flex min-w-[10rem] flex-1 items-center gap-2" role="status" aria-live="polite">
                    {status.running ? (
                      <>
                        <span className="relative h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-ink/10" aria-hidden>
                          <span className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-150" style={{ width: `${Math.round(status.progress * 100)}%` }} />
                        </span>
                        <span className="truncate text-xs text-muted">
                          {status.label}… {Math.round(status.progress * 100)}%
                        </span>
                      </>
                    ) : status.error ? (
                      <span className="text-xs font-semibold text-[#b91c1c]">× {status.error}</span>
                    ) : (
                      <span className="text-xs font-semibold text-[#15803d]">✓ {accuracy}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={`${btn} px-3 py-1.5 text-xs`} onClick={copySummary} disabled={!ctx}>
                      Copy summary
                    </button>
                    <button type="button" className={`${btnPrimary} px-3 py-1.5 text-xs`} onClick={() => setTab("data")}>
                      Use your data
                    </button>
                  </div>
                </div>
                <div role="tablist" aria-label="Media mix model sections" onKeyDown={onTabKey} className="flex gap-1 overflow-x-auto rounded-full bg-white/60 p-1 [scrollbar-width:thin]">
                  {TABS.map(([t, label]) => (
                    <button
                      key={t}
                      ref={(el) => {
                        tabRefs.current[t] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`ml-tab-${t}`}
                      aria-selected={tab === t}
                      aria-controls="ml-panel"
                      tabIndex={tab === t ? 0 : -1}
                      onClick={() => setTab(t)}
                      className={`shrink-0 rounded-full px-4 py-2 font-display text-sm font-semibold whitespace-nowrap transition-colors ${tab === t ? "bg-ink text-white" : "hover:bg-white"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div id="ml-panel" role="tabpanel" aria-labelledby={`ml-tab-${tab}`} tabIndex={-1} className="wrap mt-6 space-y-6 outline-none">
            {tab === "data" ? (
              <>
              <DescribeBox spec={MMM_SPEC} title="Describe your setup" intro="Say what you measure and how to read it, e.g. revenue in euros at a 55% margin, or leads with a $40 target. Settings update and the results recalculate." onApply={fromDescription} />
              <DataPanel
                table={table}
                roles={roles}
                setRoles={setRoles}
                checks={pending?.checks ?? []}
                onText={onText}
                settings={settings}
                setSettings={setSettings}
                onRun={onRun}
                running={status.running}
                canRun={!table || !!pending?.dataset}
                onSample={() => {
                  setTable(null);
                  setRoles([]);
                  run(sampleDataset(), settings.model);
                }}
                onTemplate={() => (download("media-mix-model-template.csv", templateCsv()), notify("Template downloaded"))}
                onExport={() => (result ? (download(`media-mix-model-results-${dataset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, resultsCsv(result)), notify("Results exported")) : notify("Run the model first"))}
                activeName={dataset.name}
                sample={!!dataset.sample}
              />
              </>
            ) : !ctx ? (
              <div className="glass rounded-3xl p-10 text-center">
                {status.error ? (
                  <>
                    <p className="font-display text-lg font-semibold">The model couldn&apos;t run.</p>
                    <p className="mt-1 text-muted">{status.error}</p>
                    <button type="button" className={`${btn} mt-4`} onClick={() => setTab("data")}>
                      Check the data
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-display text-lg font-semibold">Fitting the model in your browser…</p>
                    <p className="mt-1 text-muted">{status.label}. This takes a few seconds.</p>
                  </>
                )}
              </div>
            ) : tab === "summary" ? (
              <SummaryPanel c={ctx} />
            ) : tab === "roi" ? (
              <RoiPanel c={ctx} />
            ) : tab === "curves" ? (
              <CurvesPanel key={dataset.name + result!.n} c={ctx} />
            ) : tab === "optimizer" ? (
              <OptimizerPanel c={ctx} />
            ) : tab === "scenarios" ? (
              <ScenarioPanel c={ctx} notify={notify} />
            ) : tab === "fit" ? (
              <FitPanel c={ctx} />
            ) : (
              <MethodPanel c={ctx} />
            )}
          </div>
        </div>
        {toast && (
          <div role="status" className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 font-display text-sm font-semibold text-white shadow-lg" style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}>
            {toast}
          </div>
        )}
      </FsProvider>
    </TipProvider>
  );
}
