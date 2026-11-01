"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchEntry } from "@/lib/search";
import { NAV_GROUPS, PILLARS, isActive, type NavGroup } from "@/lib/site";
import { AccountMenu, MobileAccount } from "./auth/AccountMenu";
import { HeaderSearch } from "./HeaderSearch";
import { Wordmark } from "./Wordmark";

export function Header({ searchIndex }: { searchIndex: SearchEntry[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const side = pathname.startsWith("/sell-side") ? "sell" : "buy";

  // Close the mobile menu on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header data-side={side} className="sticky top-0 z-50 border-b border-ink/10 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="wrap flex h-16 items-center gap-4 lg:h-[4.5rem]">
        <Link href="/" className="shrink-0" aria-label="thedigitalwit home">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          <PillarLink href={PILLARS.buy.href} label={PILLARS.buy.label} tone="red" active={isActive(pathname, PILLARS.buy.href)} />
          <PillarLink href={PILLARS.sell.href} label={PILLARS.sell.label} tone="charcoal" active={isActive(pathname, PILLARS.sell.href)} />
          <span aria-hidden className="mx-2 h-6 w-px bg-line" />
          {NAV_GROUPS.map((g) => (
            <NavDropdown key={g.label} group={g} pathname={pathname} />
          ))}
        </nav>

        <div className="ml-auto hidden w-full max-w-64 lg:block">
          <HeaderSearch index={searchIndex} autoFocusShortcut />
        </div>

        <AccountMenu className="ml-auto hidden shrink-0 sm:block lg:ml-0" />

        <button
          type="button"
          className="ml-auto glass inline-flex h-10 items-center gap-2 rounded-full px-4 font-display text-sm font-semibold sm:ml-0 lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span>{mobileOpen ? "Close" : "Menu"}</span>
          <span aria-hidden className="relative block h-3 w-4">
            <span className={`absolute left-0 h-0.5 w-4 bg-ink transition-transform ${mobileOpen ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 h-0.5 w-4 bg-ink transition-transform ${mobileOpen ? "top-1.5 -rotate-45" : "top-2.5"}`} />
          </span>
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-t border-ink/10 bg-white/90 backdrop-blur-xl lg:hidden">
          <div className="wrap flex flex-col gap-8 py-6">
            <HeaderSearch index={searchIndex} />
            <nav aria-label="Main" className="flex flex-col gap-8">
              <div className="grid grid-cols-2 gap-3">
                <MobilePillar href={PILLARS.buy.href} label={PILLARS.buy.label} sell={false} />
                <MobilePillar href={PILLARS.sell.href} label={PILLARS.sell.label} sell />
              </div>
              {NAV_GROUPS.map((g) => (
                <div key={g.label}>
                  <p className="eyebrow mb-3 text-muted">{g.label}</p>
                  <ul className="border-t border-line">
                    {g.links.map((l) => (
                      <li key={l.href} className="border-b border-line">
                        <Link
                          href={l.href}
                          aria-current={isActive(pathname, l.href) ? "page" : undefined}
                          className="flex items-center justify-between py-3 font-display text-xl font-semibold tracking-tight aria-[current=page]:text-red"
                        >
                          {l.label}
                          <span aria-hidden>→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <MobileAccount />
          </div>
        </div>
      )}
    </header>
  );
}

function PillarLink({ href, label, tone, active }: { href: string; label: string; tone: "red" | "charcoal"; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="group relative inline-flex h-10 items-center gap-2 px-3 font-display text-[0.95rem] font-semibold tracking-tight"
    >
      <span aria-hidden className={`size-2 ${tone === "red" ? "bg-red" : "bg-charcoal"}`} />
      {label}
      <span
        aria-hidden
        className={`absolute inset-x-3 -bottom-px h-0.5 origin-left transition-transform ${tone === "red" ? "bg-red" : "bg-charcoal"} ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
      />
    </Link>
  );
}

function MobilePillar({ href, label, sell }: { href: string; label: string; sell: boolean }) {
  return (
    <Link
      href={href}
      className={`flex aspect-[4/3] flex-col rounded-2xl justify-between p-4 font-display text-2xl font-bold tracking-tight text-white focus-on-dark ${sell ? "bg-charcoal" : "bg-red"}`}
    >
      {label}
      <span aria-hidden className="self-end">→</span>
    </Link>
  );
}

function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const groupActive = group.links.some((l) => isActive(pathname, l.href));

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-10 items-center gap-1.5 px-3 font-display text-[0.95rem] font-medium tracking-tight hover:text-accent-strong ${groupActive ? "text-accent-strong" : ""}`}
      >
        {group.label}
        <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>
      {open && (
        <div id={menuId} className="absolute top-full left-0 mt-2 w-80 glass-strong overflow-hidden rounded-2xl">
          <ul>
            {group.links.map((l) => (
              <li key={l.href} className="border-b border-line last:border-b-0">
                <Link
                  href={l.href}
                  aria-current={isActive(pathname, l.href) ? "page" : undefined}
                  className="block px-4 py-3 hover:bg-accent-soft aria-[current=page]:bg-accent-soft"
                >
                  <span className="block font-display font-semibold tracking-tight">{l.label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{l.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
