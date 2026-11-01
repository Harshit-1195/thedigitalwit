"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import type { Category } from "@/lib/calculators/data";

export type HubItem = { id: string; cat: string; name: string; desc: string; href: string; formula: string };

/** Filter chips + scoped search + calculators grouped by vertical. */
export function CalculatorHub({ items, categories, scopeLabel }: { items: HubItem[]; categories: Category[]; scopeLabel: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const searchId = useId();

  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      categories
        .filter((c) => active === null || c.code === active)
        .map((c) => ({
          ...c,
          items: items.filter((i) => i.cat === c.code && (!q || `${i.name} ${i.desc}`.toLowerCase().includes(q))),
        }))
        .filter((g) => g.items.length > 0),
    [categories, items, active, q],
  );
  const shown = groups.reduce((n, g) => n + g.items.length, 0);
  const counts = useMemo(() => Object.fromEntries(categories.map((c) => [c.code, items.filter((i) => i.cat === c.code).length])), [categories, items]);

  return (
    <>
      <div className="sticky top-16 z-30 border-y border-ink/10 bg-white/70 backdrop-blur-xl lg:top-[4.5rem]">
        <div className="wrap flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-72 lg:shrink-0">
            <label htmlFor={searchId} className="sr-only">
              Search {scopeLabel}
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${items.length} calculators…`}
              autoComplete="off"
              className="h-10 w-full rounded-xl border-2 border-ink bg-white/70 px-3 text-sm placeholder:text-muted focus:bg-paper"
            />
          </div>
          <div role="group" aria-label="Filter by vertical" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:pb-0">
            <Chip pressed={active === null} onClick={() => setActive(null)} label="All" count={items.length} />
            {categories.map((c) => (
              <Chip
                key={c.code}
                pressed={active === c.code}
                onClick={() => setActive(active === c.code ? null : c.code)}
                label={c.label}
                count={counts[c.code]}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="wrap py-10 sm:py-14">
        <p className="text-sm text-muted" aria-live="polite">
          Showing {shown} of {items.length} calculators
          {q && <> matching “{query.trim()}”</>}
        </p>

        {groups.length === 0 && (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-ink/20 bg-white/40 p-8 text-center">
            <p className="font-display text-xl font-semibold">No calculators match.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActive(null);
              }}
              className="mt-3 font-display font-semibold text-accent hover:text-accent-strong"
            >
              Clear filters
            </button>
          </div>
        )}

        {groups.map((g) => (
          <section key={g.code} id={g.slug} aria-labelledby={`${g.slug}-h`} className="mt-10 first-of-type:mt-6">
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
              <h2 id={`${g.slug}-h`} className="min-w-0 text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold">
                {g.label.replace("/", "/\u200B")}
              </h2>
              <span className="shrink-0 font-display text-sm font-semibold text-accent tabular-nums">
                {String(g.items.length).padStart(2, "0")}
              </span>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((i) => (
                <li key={i.id} className="min-w-0">
                  <Link
                    href={i.href}
                    className="glass group flex h-full flex-col rounded-2xl p-4 transition-colors hover:bg-accent-soft/80 sm:p-5"
                  >
                    <span className="flex items-start justify-between gap-3 font-display text-lg leading-tight font-bold tracking-tight">
                      {i.name}
                      <span aria-hidden className="text-accent transition-transform group-hover:translate-x-1 motion-reduce:transition-none">
                        →
                      </span>
                    </span>
                    <span className="mt-2 text-sm text-muted">{i.desc}</span>
                    <span className="mt-auto truncate pt-4 font-mono text-xs text-muted" title={i.formula}>
                      {i.formula}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function Chip({ pressed, onClick, label, count }: { pressed: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-3 font-display text-sm font-semibold whitespace-nowrap transition-colors ${
        pressed ? "border-accent bg-accent text-on-accent" : "border-ink/10 bg-white/60 backdrop-blur hover:border-ink"
      }`}
    >
      {label}
      <span className={`text-xs tabular-nums ${pressed ? "text-on-accent" : "text-muted"}`}>{count}</span>
    </button>
  );
}
