"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

const btn = "inline-flex h-10 shrink-0 items-center bg-accent px-5 font-display text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong rounded-full";

/** Desktop header: "Log in", or an account menu once signed in. `className` positions the wrapper. */
export function AccountMenu({ className = "" }: { className?: string }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <div className={className}>
        <Link href="/login" className={btn}>
          Log in
        </Link>
      </div>
    );
  }

  const email = user.email ?? "Account";
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 glass rounded-full px-2 font-display text-sm font-semibold hover:bg-white"
      >
        <span aria-hidden className="grid size-6 place-items-center bg-accent text-xs text-on-accent uppercase">
          {email.charAt(0)}
        </span>
        <span className="max-w-32 truncate">Account</span>
      </button>
      {open && (
        <div id={menuId} className="absolute top-full right-0 z-50 mt-2 w-64 glass-strong overflow-hidden rounded-2xl">
          <p className="truncate border-b border-line px-4 py-3 text-sm text-muted" title={email}>
            {email}
          </p>
          <Link href="/saved" onClick={() => setOpen(false)} className="block px-4 py-3 font-display font-semibold hover:bg-accent-soft">
            My saved items
          </Link>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push("/");
              router.refresh();
            }}
            className="block w-full border-t border-line px-4 py-3 text-left font-display font-semibold hover:bg-accent-soft"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/** Mobile menu: same choices as a stacked list. */
export function MobileAccount() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  if (!user) {
    return (
      <Link href="/login" className="inline-flex h-12 items-center justify-center bg-red font-display font-semibold text-white hover:bg-red-strong rounded-full">
        Log in
      </Link>
    );
  }
  return (
    <div className="border-t-2 border-ink pt-4">
      <p className="truncate text-sm text-muted">Signed in as {user.email}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/saved" className="inline-flex h-12 items-center justify-center bg-red font-display font-semibold text-white hover:bg-red-strong rounded-full">
          My saved items
        </Link>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="glass h-12 rounded-full font-display font-semibold"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
