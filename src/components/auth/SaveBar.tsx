"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSaved, saveItem, stashPending, takePending, type SavedKind } from "@/lib/saved";
import { useAuth } from "./AuthProvider";

type Props<P> = {
  kind: SavedKind;
  /** Page path without query, e.g. /buy-side/calculators/cpm */
  path: string;
  /** Builds the default title and payload from the current state at click time. */
  snapshot: () => { title: string; payload: P } | null;
  /** Applies a saved or pending payload back onto the page. */
  restore: (payload: P) => void;
  label?: string;
};

type Status = { tone: "ok" | "error" | "info"; text: string; link?: boolean } | null;

/**
 * "Save" for calculators and planning tools. Signed-out users are sent to
 * log in; their work is stashed and saved automatically when they return.
 * Also restores ?saved=<id> links opened from My saved items.
 */
export function SaveBar<P>({ kind, path, snapshot, restore, label = "Save" }: Props<P>) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  const handled = useRef(false);

  // Restore from ?saved=<id>, or finish a save that started before login.
  useEffect(() => {
    if (handled.current || loading) return;
    const params = new URLSearchParams(window.location.search);
    const savedId = params.get("saved");
    const pendingFlag = params.get("restore") === "pending";
    if (!savedId && !pendingFlag) return;
    handled.current = true;
    window.history.replaceState(null, "", path);

    if (pendingFlag) {
      const pending = takePending(path);
      if (!pending) return;
      restoreRef.current(pending.payload as P);
      if (!user) return setStatus({ tone: "info", text: "Your work is restored. Log in to save it." });
      saveItem(pending)
        .then(() => setStatus({ tone: "ok", text: "Saved to My saved items.", link: true }))
        .catch((e) => setStatus({ tone: "error", text: e.message }));
      return;
    }
    if (!user) return setStatus({ tone: "info", text: "Log in to open your saved item." });
    getSaved(savedId!)
      .then((item) => {
        if (!item || item.kind !== kind) return setStatus({ tone: "error", text: "That saved item couldn't be found." });
        restoreRef.current(item.payload as P);
        setStatus({ tone: "ok", text: `Opened “${item.title}”.` });
      })
      .catch((e) => setStatus({ tone: "error", text: e.message }));
  }, [loading, user, kind, path]);

  const onSave = async () => {
    const snap = snapshot();
    if (!snap) return setStatus({ tone: "error", text: "Nothing to save yet." });
    if (!configured) return setStatus({ tone: "error", text: "Saving isn't switched on for this site yet." });
    const item = { kind, path, title: snap.title.slice(0, 120), payload: snap.payload };
    if (!user) {
      stashPending(item);
      router.push(`/login?next=${encodeURIComponent(`${path}?restore=pending`)}`);
      return;
    }
    setBusy(true);
    try {
      await saveItem(item);
      setStatus({ tone: "ok", text: "Saved to My saved items.", link: true });
    } catch (e) {
      setStatus({ tone: "error", text: e instanceof Error ? e.message : "Couldn't save." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <button
        type="button"
        onClick={onSave}
        disabled={busy}
        className="inline-flex h-11 items-center gap-2 glass rounded-full px-4 font-display text-sm font-semibold hover:bg-white disabled:opacity-60"
      >
        <svg aria-hidden width="14" height="14" viewBox="0 0 14 14">
          <path d="M2 1h8l2 2v10H2z M4 1v4h5V1 M4 13V8h6v5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {busy ? "Saving…" : user || !configured ? label : `${label} (log in)`}
      </button>
      <p role="status" className={`text-sm ${status?.tone === "error" ? "font-semibold text-accent" : "text-muted"}`}>
        {status?.text}
        {status?.link && (
          <>
            {" "}
            <Link href="/saved" className="font-semibold text-accent underline-offset-2 hover:underline">
              View
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
