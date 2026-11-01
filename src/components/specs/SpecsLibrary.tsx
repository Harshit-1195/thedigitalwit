"use client";

import { useId, useMemo, useState } from "react";
import { ratioLabel, type CreativeSpec } from "@/lib/creative-specs";

/** Search + format chips over the creative specs table. */
export function SpecsLibrary({ specs, formats }: { specs: CreativeSpec[]; formats: string[] }) {
  const [format, setFormat] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const searchId = useId();

  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      specs.filter((s) => {
        if (format && s.format !== format) return false;
        if (!q) return true;
        const size = s.w ? `${s.w}x${s.h} ${s.w}×${s.h} ${ratioLabel(s.w, s.h!)}` : "";
        return `${s.name} ${s.format} ${size} ${s.fileTypes} ${s.notes} ${s.source}`.toLowerCase().includes(q);
      }),
    [specs, format, q],
  );

  return (
    <>
      <div className="sticky top-16 z-30 border-y border-ink/10 bg-white/70 backdrop-blur-xl lg:top-[4.5rem]">
        <div className="wrap flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <div className="lg:w-72 lg:shrink-0">
            <label htmlFor={searchId} className="sr-only">
              Search creative specs
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sizes, e.g. 300x250 or 9:16"
              autoComplete="off"
              className="h-10 w-full rounded-xl border-2 border-ink bg-white/70 px-3 text-sm placeholder:text-muted focus:bg-paper"
            />
          </div>
          <div role="group" aria-label="Filter by format" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:pb-0">
            {[null, ...formats].map((f) => {
              const pressed = format === f;
              const count = f ? specs.filter((s) => s.format === f).length : specs.length;
              return (
                <button
                  key={f ?? "all"}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setFormat(pressed && f ? null : f)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-3 font-display text-sm font-semibold whitespace-nowrap transition-colors ${
                    pressed ? "border-accent bg-accent text-on-accent" : "border-ink/10 bg-white/60 backdrop-blur hover:border-ink"
                  }`}
                >
                  {f ?? "All"}
                  <span className={`text-xs tabular-nums ${pressed ? "text-on-accent" : "text-muted"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="wrap py-8 sm:py-10">
        <p className="text-sm text-muted" aria-live="polite">
          Showing {rows.length} of {specs.length} specs
        </p>

        {rows.length === 0 ? (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-ink/20 bg-white/40 p-8 text-center">
            <p className="font-display text-xl font-semibold">No specs match.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFormat(null);
              }}
              className="mt-3 font-display font-semibold text-accent hover:text-accent-strong"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Table from md up. */}
            <div tabIndex={0} role="region" aria-label="Creative specs table" className="glass relative mt-4 hidden overflow-x-auto rounded-2xl md:block">
              <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
                <caption className="sr-only">Creative specifications</caption>
                <thead className="bg-ink text-white">
                  <tr>
                    {["Shape", "Unit", "Size", "File types", "Max file size", "Duration", "Notes"].map((h) => (
                      <th key={h} scope="col" className="px-3 py-3 font-display text-xs font-semibold tracking-wider uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-t border-line align-top even:bg-raised">
                      <td className="px-3 py-3">
                        <Shape spec={s} />
                      </td>
                      <th scope="row" className="px-3 py-3 font-normal">
                        <span className="block font-display font-semibold">{s.name}</span>
                        <span className="eyebrow mt-1 block text-[0.65rem] text-muted">{s.format}</span>
                      </th>
                      <td className="px-3 py-3 font-mono whitespace-nowrap">
                        {s.w ? (
                          <>
                            {s.w}×{s.h}
                            <span className="block text-xs text-muted">{ratioLabel(s.w, s.h!)}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">{s.fileTypes}</td>
                      <td className="px-3 py-3">{s.maxFileSize}</td>
                      <td className="px-3 py-3">{s.duration}</td>
                      <td className="max-w-xs px-3 py-3">
                        {s.notes}
                        <Meta spec={s} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards on phones. */}
            <ul className="mt-4 grid gap-3 md:hidden">
              {rows.map((s) => (
                <li key={s.id} className="glass rounded-2xl p-4">
                  <div className="flex items-start gap-4">
                    <Shape spec={s} />
                    <div className="min-w-0">
                      <p className="eyebrow text-[0.65rem] text-muted">{s.format}</p>
                      <p className="font-display text-lg leading-tight font-bold">{s.name}</p>
                      {s.w && (
                        <p className="mt-1 font-mono text-sm">
                          {s.w}×{s.h} <span className="text-muted">· {ratioLabel(s.w, s.h!)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                    <dt className="text-muted">File types</dt>
                    <dd>{s.fileTypes}</dd>
                    <dt className="text-muted">Max file size</dt>
                    <dd>{s.maxFileSize}</dd>
                    <dt className="text-muted">Duration</dt>
                    <dd>{s.duration}</dd>
                  </dl>
                  <p className="mt-3 text-sm">{s.notes}</p>
                  <Meta spec={s} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

/** A to-scale silhouette of the unit, max 56px on its long side. */
function Shape({ spec }: { spec: CreativeSpec }) {
  const box = 56;
  if (!spec.w || !spec.h) {
    return (
      <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-lg border-2 border-dashed border-line font-mono text-[0.6rem] text-muted uppercase">
        {spec.format === "Audio" ? "audio" : "text"}
      </span>
    );
  }
  const s = box / Math.max(spec.w, spec.h);
  return (
    <span aria-hidden className="grid size-14 shrink-0 place-items-center">
      <span className="block bg-accent" style={{ width: Math.max(3, spec.w * s), height: Math.max(3, spec.h * s) }} />
    </span>
  );
}

function Meta({ spec }: { spec: CreativeSpec }) {
  return (
    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
      <span>Source: {spec.source}</span>
      {spec.verify && (
        <span className="rounded-full border border-accent bg-accent-soft px-2 py-0.5 font-semibold text-accent-strong">Verify against current platform specs</span>
      )}
    </span>
  );
}
