"use client";

import { gradeColor, letterFor } from "@/lib/mediaPlan/grading";
import type { Grade } from "@/lib/mediaPlan/types";
import { card } from "./ui";

export function GradePanel({ grade }: { grade: Grade }) {
  const color = gradeColor(grade.letter);
  return (
    <section aria-labelledby="mpg-grade" className={`${card} grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-10`}>
      <div className="flex items-center gap-5 md:flex-col md:gap-3">
        <div className="grid size-36 shrink-0 place-items-center rounded-full border-[10px] bg-white/80" style={{ borderColor: color }}>
          <p className="text-center leading-none">
            <span className="block font-display text-6xl font-extrabold tracking-[-0.05em]">{grade.letter}</span>
            <span className="mt-1 block font-mono text-sm text-muted">{grade.total} / 100</span>
          </p>
        </div>
        <h2 id="mpg-grade" className="text-2xl font-bold tracking-[-0.03em] md:text-center">
          Plan grade
        </h2>
      </div>
      <ul className="space-y-4">
        {grade.breakdown.map((f) => {
          const share = f.max ? f.score / f.max : 0;
          return (
            <li key={f.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display font-semibold">{f.label}</span>
                <span className="font-mono text-sm tabular-nums">
                  {f.score} / {f.max}
                </span>
              </div>
              <div aria-hidden className="mt-1.5 h-2.5 rounded-full bg-ink/[0.07]">
                <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, share * 100))}%`, minWidth: share > 0 ? 4 : 0, background: gradeColor(letterFor(share * 100)) }} />
              </div>
              <p className="mt-1 text-xs text-muted">{f.note}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
