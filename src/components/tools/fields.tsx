"use client";

import { useId, useState, type ReactNode } from "react";
import { formatInput, parseNumber } from "@/lib/calculators/format";

/**
 * Number field that accepts "50,000" or "$50k"-free pasted numbers, shows
 * thousands separators when not focused, and commits on every valid keystroke.
 */
export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  tag,
  min = 0,
  className = "",
  compact = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  /** Small marker beside the label, e.g. a status pill. */
  tag?: ReactNode;
  min?: number;
  className?: string;
  compact?: boolean;
}) {
  const id = useId();
  // Raw text only while focused; otherwise the formatted value is shown.
  const [text, setText] = useState<string | null>(null);

  return (
    <div className={className}>
      {tag && !compact ? (
        <div className="flex items-start justify-between gap-2">
          <label htmlFor={id} className="block font-display text-sm font-semibold">
            {label}
          </label>
          {tag}
        </div>
      ) : (
        <label htmlFor={id} className={compact ? "sr-only" : "block font-display text-sm font-semibold"}>
          {label}
        </label>
      )}
      <div className={`flex items-baseline gap-1 border-b-2 border-ink focus-within:border-accent focus-within:outline-3 focus-within:outline-offset-4 focus-within:outline-accent ${compact ? "" : "mt-2"}`}>
        {prefix && <span aria-hidden className="font-mono text-muted">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text ?? formatInput(value)}
          onFocus={() => setText(String(value))}
          onBlur={() => setText(null)}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseNumber(e.target.value);
            if (n !== null && n >= min) onChange(n);
          }}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`w-full min-w-0 bg-transparent py-1 font-mono tabular-nums outline-none ${compact ? "text-sm" : "text-xl"}`}
        />
        {suffix && <span aria-hidden className="font-mono text-muted">{suffix}</span>}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="font-display text-sm font-semibold">{label}</legend>
      <div className="glass mt-2 inline-flex gap-1 rounded-full p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className={`cursor-pointer rounded-full px-4 py-2 font-display text-sm font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
              value === o.value ? "bg-ink text-white" : "hover:bg-white"
            }`}
          >
            <input type="radio" name={name} className="sr-only" checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export const money = (n: number, digits = 0) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
export const num = (n: number, digits = 0) => n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
