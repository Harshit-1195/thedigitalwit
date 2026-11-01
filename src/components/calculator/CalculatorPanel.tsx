"use client";

import { useId, useMemo, useState } from "react";
import { editField, evaluate, initFields, loadExample, toPlain } from "@/lib/calculators/fields";
import { DescribeBox } from "@/components/ai/DescribeBox";
import { calculatorSpec } from "@/lib/ai/specs";
import type { Filled } from "@/lib/ai/fill";
import { affixes, formatInput, formatResult, formatWithUnit, parseNumber } from "@/lib/calculators/format";
import type { Calculator } from "@/lib/calculators/types";
import { SaveBar } from "@/components/auth/SaveBar";
import type { FieldState } from "@/lib/calculators/fields";

type Badge = "input" | "solved" | "waiting";

const BADGE_STYLE: Record<Badge, string> = {
  input: "border-line bg-paper text-muted",
  solved: "border-accent bg-accent text-on-accent",
  waiting: "border-dashed border-muted bg-paper text-muted",
};

export function CalculatorPanel({ calc, path }: { calc: Calculator; path: string }) {
  const [state, setState] = useState(() => initFields(calc));
  // The field the user is typing in. It shows exactly what they typed (e.g.
  // "5." mid-entry); other fields show tidy formatting, which is identical on
  // focus so the caret never jumps. If they clear it, it becomes the solve
  // target but stays empty under the cursor, with the solved value as a
  // placeholder, instead of refilling mid-edit.
  const [editing, setEditing] = useState<number | null>(null);
  const { target, result } = useMemo(() => evaluate(calc, state), [calc, state]);
  const baseId = useId();
  const out = calc.vars[target];
  const [mode, setMode] = useState<"fields" | "ai">("fields");
  const [filledNote, setFilledNote] = useState("");
  const spec = useMemo(() => calculatorSpec(path.startsWith("/sell") ? "sell" : "buy", calc), [calc, path]);

  // Values from the description go in as if typed, in order; the one left out is solved.
  const fromDescription = (v: Filled) => {
    let next = initFields(calc);
    const given = calc.vars.map((x, i) => [i, v[x.key]] as const).filter((p): p is readonly [number, number] => typeof p[1] === "number");
    for (const [i, n] of given.slice(0, calc.vars.length - 1)) next = editField(calc, next, i, toPlain(n));
    setEditing(null);
    setState(next);
    setFilledNote(`Filled ${given.length === 1 ? "1 field" : `${Math.min(given.length, calc.vars.length - 1)} fields`} from your description.`);
    setMode("fields");
  };
  const tabClass = (on: boolean) => `shrink-0 px-4 py-3 font-display text-sm font-semibold sm:px-5 ${on ? "bg-ink text-white" : "text-ink hover:bg-white/70"}`;

  const display = (i: number): { value: string; placeholder: string } => {
    if (i === target) {
      const solved = result === null ? "" : formatResult(result);
      return i === editing ? { value: "", placeholder: solved } : { value: solved, placeholder: "" };
    }
    const raw = state.raw[i];
    if (i === editing) return { value: raw, placeholder: "" };
    const n = parseNumber(raw);
    return { value: n === null ? raw : formatInput(n), placeholder: "" };
  };

  return (
    <section aria-label={`${calc.name} calculator`} className="glass overflow-hidden rounded-3xl">
      {/* Tabs: only the first exists for now. */}
      <div role="tablist" aria-label="Calculator mode" className="flex overflow-x-auto border-b border-ink/10">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "fields"}
          tabIndex={mode === "fields" ? 0 : -1}
          id={`${baseId}-tab`}
          aria-controls={`${baseId}-panel`}
          onClick={() => setMode("fields")}
          onKeyDown={(e) => e.key === "ArrowRight" && (setMode("ai"), document.getElementById(`${baseId}-tab-ai`)?.focus())}
          className={tabClass(mode === "fields")}
        >
          Interactive Fields
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "ai"}
          tabIndex={mode === "ai" ? 0 : -1}
          id={`${baseId}-tab-ai`}
          aria-controls={`${baseId}-panel-ai`}
          onClick={() => setMode("ai")}
          onKeyDown={(e) => e.key === "ArrowLeft" && (setMode("fields"), document.getElementById(`${baseId}-tab`)?.focus())}
          className={tabClass(mode === "ai")}
        >
          Natural Language AI
        </button>
      </div>

      {/* Kept mounted so the description survives switching tabs. */}
      <div id={`${baseId}-panel-ai`} role="tabpanel" aria-labelledby={`${baseId}-tab-ai`} hidden={mode !== "ai"} className="p-4 sm:p-6 lg:p-8">
          <DescribeBox
            spec={spec}
            title={`Ask about ${calc.vars[calc.vars.length - 1].label}`}
            intro={`Give any ${calc.vars.length - 1} of: ${calc.vars.map((x) => x.label).join(", ")}. The calculator solves the one you leave out.`}
            onApply={fromDescription}
            plain
          />
      </div>

      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab`} hidden={mode !== "fields"} className="p-4 sm:p-6 lg:p-8">
        {filledNote && (
          <p className="mb-4 rounded-xl border-l-4 border-[#15803d] bg-white/70 px-4 py-2 text-sm" role="status">
            ✓ {filledNote}{" "}
            <button type="button" className="font-semibold underline" onClick={() => setMode("ai")}>
              Edit description
            </button>
          </p>
        )}
        <p className="eyebrow text-muted">Formula</p>
        <p tabIndex={0} role="region" aria-label="Formula" className="mt-2 overflow-x-auto rounded-xl border-l-4 border-accent bg-white/70 px-4 py-3 font-mono text-sm whitespace-nowrap sm:text-base">
          {calc.formulaDisplay}
        </p>

        <p className="mt-6 text-sm text-muted">
          Fill in any {calc.vars.length - 1} fields. The one you edited longest ago is solved for you.
        </p>

        <div className={`mt-4 grid gap-3 ${calc.vars.length === 4 ? "sm:grid-cols-2" : calc.vars.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2"}`}>
          {calc.vars.map((v, i) => {
            const isTarget = i === target;
            const badge: Badge = isTarget ? (result === null ? "waiting" : "solved") : "input";
            const { prefix, suffix } = affixes(v.unit);
            const { value, placeholder } = display(i);
            const inputId = `${baseId}-${v.key}`;
            return (
              <div
                key={v.key}
                className={`flex flex-col rounded-2xl border-2 p-3 transition-colors focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent sm:p-4 ${isTarget ? "border-accent bg-accent-soft" : "border-ink/10 bg-white/60"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <label htmlFor={inputId} className="font-display text-sm font-semibold leading-tight">
                    {v.label}
                    <span className="mt-0.5 block font-mono text-xs font-normal text-muted">{v.key}</span>
                  </label>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.68rem] uppercase tracking-wider ${BADGE_STYLE[badge]}`}>
                    {badge}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1 border-b-2 border-ink pb-1 focus-within:border-accent">
                  {prefix && <span className="font-mono text-xl text-muted" aria-hidden>{prefix}</span>}
                  <input
                    id={inputId}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck={false}
                    value={value}
                    placeholder={placeholder || (isTarget ? "—" : "0")}
                    aria-describedby={`${inputId}-state`}
                    onBlur={() => setEditing(null)}
                    onChange={(e) => {
                      setFilledNote("");
                      setEditing(i);
                      setState((s) => editField(calc, s, i, e.target.value));
                    }}
                    className={`w-full min-w-0 bg-transparent font-mono text-xl tabular-nums outline-none placeholder:text-muted/60 sm:text-2xl ${isTarget ? "font-semibold text-accent-strong" : ""}`}
                  />
                  {suffix && <span className="font-mono text-xl text-muted" aria-hidden>{suffix.trim()}</span>}
                </div>
                <span id={`${inputId}-state`} className="sr-only">
                  {v.unit === "$" ? "Dollars. " : v.unit === "%" ? "Percent. " : ""}
                  {badge === "solved" ? "Solved by the calculator." : badge === "waiting" ? "Waiting for the other fields." : ""}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-h-7 font-display text-lg font-semibold" aria-live="polite">
            {result === null ? (
              <span className="text-muted">Waiting for {calc.vars.length - 1} values to solve {out.label}.</span>
            ) : (
              <>
                {out.label} = <span className="font-mono text-accent">{formatWithUnit(result, out.unit)}</span>
              </>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setState(loadExample(calc));
              }}
              className="h-11 bg-accent px-5 font-display text-sm font-semibold text-on-accent hover:bg-accent-strong rounded-full"
            >
              Load example
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setState(initFields(calc));
              }}
              className="h-11 glass rounded-full px-5 font-display text-sm font-semibold hover:bg-white"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="mt-4 border-t border-line pt-4">
          <SaveBar<FieldState>
            kind="calculator"
            path={path}
            label="Save scenario"
            snapshot={() =>
              result === null ? null : { title: `${calc.name}: ${out.label} = ${formatWithUnit(result, out.unit)}`, payload: state }
            }
            restore={(saved) => {
              // Ignore scenarios saved before this calculator's fields changed.
              if (saved?.raw?.length !== calc.vars.length) return;
              setEditing(null);
              setState(saved);
            }}
          />
        </div>
      </div>
    </section>
  );
}
