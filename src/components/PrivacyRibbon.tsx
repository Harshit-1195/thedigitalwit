"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Small bottom ribbon saying the site doesn't track anyone. Informational only:
// there are no optional cookies to consent to (see /privacy). Closing it is remembered on this device.

const KEY = "tdw:privacy-ribbon";

export function PrivacyRibbon() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "closed") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "closed");
    } catch {}
  };

  return (
    <div
      role="region"
      aria-label="Privacy notice"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-5xl items-center gap-3 rounded-2xl bg-ink/90 sm:rounded-full py-2 pr-2 pl-4 text-xs text-white shadow-lg backdrop-blur sm:text-sm"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <p className="min-w-0 flex-1">
        <span className="font-semibold">No tracking, no ad cookies.</span> Your work stays in your browser; we store your email
        and saved items only if you sign in.{" "}
        <Link href="/privacy" className="whitespace-nowrap underline underline-offset-2 hover:text-white/80">
          Details
        </Link>
      </p>
      <button
        type="button"
        onClick={close}
        className="shrink-0 rounded-full bg-white px-3 py-1.5 font-display font-semibold text-ink hover:bg-white/85"
      >
        Got it
      </button>
    </div>
  );
}
