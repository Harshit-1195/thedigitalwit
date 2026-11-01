"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Tab = "studio" | "specs";
const TABS: [Tab, string][] = [
  ["studio", "Preview & export"],
  ["specs", "Specs library"],
];

/**
 * Creative Studio: the preview app and the specs library on one page, as two tabs (#specs opens the library).
 * The preview app stays loaded while the library is open, so switching tabs never loses work. Only the
 * preview tab locks the page to the viewport (the .studio-root rules in globals.css); the library scrolls.
 */
export function CreativeStudio({ specs }: { specs: ReactNode }) {
  const [tab, setTabState] = useState<Tab>("studio");
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({ studio: null, specs: null });

  useEffect(() => {
    const read = () => setTabState(location.hash === "#specs" ? "specs" : "studio");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const setTab = (t: Tab) => {
    setTabState(t);
    history.replaceState(null, "", t === "specs" ? "#specs" : location.pathname);
    if (t === "specs") window.scrollTo({ top: 0, behavior: "instant" });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tab === "studio" ? "specs" : "studio";
    setTab(next);
    refs.current[next]?.focus();
  };

  return (
    <div className={tab === "studio" ? "studio-root" : ""}>
      <h1 className="sr-only">Creative Studio</h1>
      {/* 3rem including its border, so the frame below fills exactly the rest of the screen. */}
      <div className="h-12 border-b border-line bg-white/80 backdrop-blur">
        <div className="wrap flex h-full items-center justify-between gap-3">
          <div role="tablist" aria-label="Creative Studio sections" onKeyDown={onKey} className="flex gap-1">
            {TABS.map(([t, label]) => (
              <button
                key={t}
                ref={(el) => {
                  refs.current[t] = el;
                }}
                type="button"
                role="tab"
                id={`cs-tab-${t}`}
                aria-selected={tab === t}
                aria-controls={`cs-panel-${t}`}
                tabIndex={tab === t ? 0 : -1}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 font-display text-sm font-semibold whitespace-nowrap transition-colors ${tab === t ? "bg-ink text-white" : "hover:bg-ink/5"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="hidden truncate text-xs text-muted sm:block">{tab === "studio" ? "Preview a creative in 50+ formats, score it and export it." : "Sizes, file types, weights and durations for every format."}</p>
        </div>
      </div>
      <div id="cs-panel-studio" role="tabpanel" aria-labelledby="cs-tab-studio" hidden={tab !== "studio"} className="h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-7.5rem)]">
        <iframe src="/tools/creative-studio.html" title="Creative Studio: preview a creative in 50+ ad formats" className="block h-full w-full border-0" allow="clipboard-write" />
      </div>
      <div id="cs-panel-specs" role="tabpanel" aria-labelledby="cs-tab-specs" hidden={tab !== "specs"}>
        {specs}
      </div>
    </div>
  );
}
