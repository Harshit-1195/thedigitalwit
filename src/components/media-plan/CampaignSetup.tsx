"use client";

import { useId } from "react";
import { NumberField } from "@/components/tools/fields";
import { CURRENCIES, GEOS, OBJECTIVES } from "@/lib/mediaPlan/constants";
import type { CampaignSetup as Setup, Objective } from "@/lib/mediaPlan/types";
import { card, inputCls, labelCls } from "./ui";

type Props = { setup: Setup; onChange: (patch: Partial<Setup>) => void };

export function CampaignSetup({ setup, onChange }: Props) {
  const id = useId();
  const f = (name: string) => `${id}-${name}`;
  const addGeo = (g: string) => {
    if (g && !setup.geos.includes(g)) onChange({ geos: [...setup.geos, g] });
  };

  return (
    <section aria-labelledby={f("h")} className={`${card} space-y-5`}>
      <h2 id={f("h")} className="text-2xl font-bold tracking-[-0.03em]">
        Campaign setup
      </h2>

      <div>
        <label htmlFor={f("name")} className={labelCls}>
          Campaign name
        </label>
        <input id={f("name")} type="text" value={setup.campaignName} onChange={(e) => onChange({ campaignName: e.target.value })} className={inputCls} />
      </div>

      <div>
        <label htmlFor={f("obj")} className={labelCls}>
          Primary objective
        </label>
        <select id={f("obj")} value={setup.objective} onChange={(e) => onChange({ objective: e.target.value as Objective })} className={inputCls}>
          {OBJECTIVES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <NumberField label="Total budget" value={setup.budget} onChange={(v) => onChange({ budget: v })} suffix={setup.currency} />

      <div>
        <label htmlFor={f("cur")} className={labelCls}>
          Currency
        </label>
        <select id={f("cur")} value={setup.currency} onChange={(e) => onChange({ currency: e.target.value })} className={inputCls}>
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted">Illustrative rates, not a live feed.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={f("start")} className={labelCls}>
            Flight start
          </label>
          <input id={f("start")} type="date" value={setup.startDate} max={setup.endDate || undefined} onChange={(e) => onChange({ startDate: e.target.value })} className={`${inputCls} px-2 text-sm`} />
        </div>
        <div>
          <label htmlFor={f("end")} className={labelCls}>
            Flight end
          </label>
          <input id={f("end")} type="date" value={setup.endDate} min={setup.startDate || undefined} onChange={(e) => onChange({ endDate: e.target.value })} className={`${inputCls} px-2 text-sm`} />
        </div>
      </div>

      <div>
        <label htmlFor={f("geo")} className={labelCls}>
          Add market
        </label>
        <select
          id={f("geo")}
          value=""
          // Controlled at "", so it snaps back to the placeholder after each pick.
          onChange={(e) => addGeo(e.target.value)}
          className={inputCls}
        >
          <option value="">Select a country…</option>
          {Object.entries(GEOS).map(([region, countries]) => (
            <optgroup key={region} label={region}>
              {countries.map((c) => (
                <option key={c} value={c} disabled={setup.geos.includes(c)}>
                  {c}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {setup.geos.length ? (
          <ul aria-label="Selected markets" className="mt-3 flex flex-wrap gap-1.5">
            {setup.geos.map((g) => (
              <li key={g} className="inline-flex items-center gap-1 rounded-full bg-ink py-1 pr-1 pl-3 text-sm font-semibold text-white">
                {g}
                <button
                  type="button"
                  aria-label={`Remove ${g}`}
                  onClick={() => onChange({ geos: setup.geos.filter((x) => x !== g) })}
                  className="focus-on-dark grid size-6 place-items-center rounded-full text-base leading-none hover:bg-white/20"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No markets selected yet</p>
        )}
      </div>
    </section>
  );
}
