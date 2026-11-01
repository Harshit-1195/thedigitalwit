"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { basicFill, MAX_TEXT, show, type AiSpec, type FillResult, type Filled } from "@/lib/ai/fill";

// Once the server says AI is off, later boxes on the page skip straight to the built-in reader.
let aiOff = false;

type Shown = FillResult & { fallback?: "off" | "failed" };

/** "Describe your case": a sentence in, form values out. The tool's onApply fills its fields and recalculates. */
export function DescribeBox({
  spec,
  onApply,
  title = "Describe your case",
  intro,
  className = "",
  plain = false,
}: {
  spec: AiSpec;
  onApply: (values: Filled) => void;
  title?: string;
  intro?: string;
  className?: string;
  /** No card of its own, for use inside another card. */
  plain?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Shown | null>(null);

  const read = async (t: string): Promise<Shown> => {
    if (!aiOff) {
      try {
        const res = await fetch("/api/ai-fill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spec: spec.id, text: t }) });
        if (res.ok) return (await res.json()) as FillResult;
        if (res.status === 429 || res.status === 400) throw Object.assign(new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Try again in a moment."), { show: true });
        if (res.status === 503) aiOff = true;
        return { ...basicFill(spec, t), fallback: res.status === 503 ? "off" : "failed" };
      } catch (e) {
        if ((e as { show?: boolean }).show) throw e;
        return { ...basicFill(spec, t), fallback: "failed" };
      }
    }
    return { ...basicFill(spec, t), fallback: "off" };
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (t.length < 3) return setError("Describe your case in a sentence or two.");
    setBusy(true);
    setError("");
    try {
      const r = await read(t);
      if (Object.keys(r.values).length) onApply(r.values);
      setResult(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
  };

  const filled = result ? Object.entries(result.values) : [];
  return (
    <form onSubmit={submit} aria-labelledby={`${id}-h`} className={`${plain ? "" : "glass rounded-3xl p-5 sm:p-6"} print:hidden ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${id}-h`} className="flex items-center gap-2 font-display text-lg font-bold">
          <span aria-hidden className="text-accent">✦</span>
          {title}
        </h2>
        <p className="text-xs text-muted">Plain English · fills the fields and calculates</p>
      </div>
      {intro && <p className="mt-1 text-sm text-muted">{intro}</p>}
      <label htmlFor={`${id}-t`} className="sr-only">
        Describe your case for {spec.title}
      </label>
      <textarea
        id={`${id}-t`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        rows={2}
        maxLength={MAX_TEXT}
        placeholder={`e.g. ${spec.examples[0]}`}
        className="mt-3 w-full rounded-xl border-2 border-ink bg-white/70 px-3 py-2"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="submit" disabled={busy} className="rounded-full bg-accent px-5 py-2.5 font-display text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-60">
          {busy ? "Reading…" : "Fill in & calculate"}
        </button>
        {spec.examples.length > 0 && <span className="text-xs text-muted">Try:</span>}
        {spec.examples.slice(0, 3).map((ex) => (
          <button key={ex} type="button" onClick={() => setText(ex)} className="max-w-full truncate rounded-full border border-ink/15 bg-white/60 px-3 py-1 text-left text-xs hover:border-ink" title={ex}>
            {ex.split("\n")[0].length > 48 ? `${ex.split("\n")[0].slice(0, 46)}…` : ex.split("\n")[0]}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="text-sm">
        {error && <p className="mt-3 text-[#b91c1c]">{error}</p>}
        {result && (
          <div className="mt-3 rounded-2xl bg-white/60 p-3">
            {filled.length > 0 ? (
              <>
                <p className="font-semibold text-[#15803d]">
                  ✓ Filled {filled.length} {filled.length === 1 ? "field" : "fields"}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {filled.map(([k, v]) => (
                    <li key={k} className="rounded-full bg-white px-2.5 py-1 text-xs">
                      <span className="text-muted">{spec.fields.find((f) => f.key === k)?.label}:</span> <span className="font-semibold">{show(spec, k, v)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="font-semibold">Nothing filled in.</p>
            )}
            {result.note && <p className="mt-2 text-muted">{result.note}</p>}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">
        {aiOff || result?.fallback === "off"
          ? "Read in your browser with the built-in reader (AI isn't switched on for this site). It understands names and amounts like “budget $40k”."
          : result?.fallback === "failed"
            ? "The AI didn't answer, so the built-in reader in your browser filled what it could."
            : "Your description is sent to Claude, Anthropic's AI, only to read it; don't include personal data. Check the filled fields before relying on them."}
      </p>
    </form>
  );
}
