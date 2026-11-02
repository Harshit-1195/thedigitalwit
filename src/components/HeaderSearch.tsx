"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { search, type SearchEntry } from "@/lib/search";

/**
 * Header search across all calculators and pages, as an ARIA combobox:
 * ↑/↓ move through results, Enter opens one, Esc closes, "/" focuses the box.
 */
export function HeaderSearch({ index, autoFocusShortcut = false }: { index: SearchEntry[]; autoFocusShortcut?: boolean }) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const groups = useMemo(() => search(index, query), [index, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.entries), [groups]);
  const calculatorCount = index.filter((e) => e.group !== "Pages").length;
  const showList = open && query.trim() !== "";

  useEffect(() => setActive(0), [query]);

  // "/" jumps to search from anywhere that isn't already a text field.
  useEffect(() => {
    if (!autoFocusShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [autoFocusShortcut]);

  useEffect(() => {
    if (!showList) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showList]);

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (showList) document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, showList, id]);

  const go = (entry: SearchEntry) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(entry.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      if (flat.length) setActive((a) => (a + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flat.length) setActive((a) => (a - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      if (showList && flat[active]) {
        e.preventDefault();
        go(flat[active]);
      }
    } else if (e.key === "Escape") {
      if (showList) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      } else if (query) {
        setQuery("");
      }
    }
  };

  let n = -1;
  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search calculators and pages
      </label>
      <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
        <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && flat.length ? `${id}-opt-${active}` : undefined}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={`Search ${calculatorCount} calculators…`}
        autoComplete="off"
        spellCheck={false}
        className="h-10 w-full rounded-xl border-2 border-ink bg-white/70 pr-3 pl-9 text-ellipsis xl:pr-8 text-sm placeholder:text-muted focus:bg-paper"
      />
      {autoFocusShortcut && !query && (
        <kbd aria-hidden className="pointer-events-none absolute top-1/2 hidden xl:block right-2.5 -translate-y-1/2 rounded-md border border-line bg-white px-1.5 font-mono text-xs text-muted">
          /
        </kbd>
      )}

      {showList && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute top-full right-0 z-50 mt-2 max-h-[min(70vh,32rem)] w-full overflow-y-auto glass-strong overflow-hidden rounded-2xl lg:w-[28rem]"
        >
          {groups.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No calculators or pages match “{query.trim()}”.</p>
          ) : (
            groups.map((g) => (
              <div key={g.group} role="group" aria-labelledby={`${id}-${g.group}`}>
                <p
                  id={`${id}-${g.group}`}
                  className={`eyebrow sticky top-0 border-b border-line bg-raised px-4 py-2 ${g.group === "Buy-Side" ? "text-red" : g.group === "Sell-Side" ? "text-charcoal" : "text-muted"}`}
                >
                  {g.group}
                </p>
                {g.entries.map((entry) => {
                  n += 1;
                  const i = n;
                  return (
                    <Link
                      key={entry.href}
                      id={`${id}-opt-${i}`}
                      role="option"
                      aria-selected={i === active}
                      href={entry.href}
                      tabIndex={-1}
                      onMouseEnter={() => setActive(i)}
                      onClick={(e) => {
                        e.preventDefault();
                        go(entry);
                      }}
                      className="block border-b border-line px-4 py-2.5 last:border-b-0 aria-selected:bg-accent-soft"
                    >
                      <span className="block font-display text-sm font-semibold tracking-tight">{entry.title}</span>
                      <span className="block truncate text-xs text-muted">{entry.desc}</span>
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {showList ? (flat.length ? `${flat.length} results` : "No results") : ""}
      </p>
    </div>
  );
}
