"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteSaved, KIND_LABEL, listSaved, type SavedItem, type SavedKind } from "@/lib/saved";
import { useAuth } from "./AuthProvider";

const ORDER: SavedKind[] = ["calculator", "media_plan", "gtm_plan"];
// The launch planner that created GTM plans was replaced by a strategy generator that saves nothing.
// Old plans stay listed (so they can be deleted) only while some exist.
const RETIRED: SavedKind[] = ["gtm_plan"];
const EMPTY_HINT: Record<SavedKind, { text: string; href: string; cta: string }> = {
  calculator: { text: "Solve any calculator and press Save scenario.", href: "/buy-side", cta: "Browse calculators" },
  media_plan: { text: "Build a plan in the Media Plan Generator and press Save plan.", href: "/media-plan-generator", cta: "Open Media Plan Generator" },
  gtm_plan: { text: "", href: "/gtm-generator", cta: "Open GTM Generator" },
};

export function SavedItems() {
  const { user, loading, configured } = useAuth();
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listSaved()
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [user]);

  if (loading || (user && items === null && !error)) {
    return <p className="mt-10 text-muted" aria-busy="true">Loading your saved items…</p>;
  }

  if (!configured || !user) {
    return (
      <div className="glass mt-10 max-w-xl rounded-3xl p-6">
        <p className="font-display text-xl font-bold">{configured ? "Log in to see your saved items." : "Saving isn't switched on yet."}</p>
        <p className="mt-2 text-muted">
          {configured
            ? "Your saved calculator scenarios, media plans and GTM plans live here."
            : "Once the site owner adds the Supabase keys, logged-in users can save their work here."}
        </p>
        {configured && (
          <Link href="/login?next=/saved" className="mt-5 inline-flex h-12 items-center bg-accent px-6 font-display font-semibold text-on-accent hover:bg-accent-strong rounded-full">
            Log in
          </Link>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="mt-10 rounded-xl border-2 border-accent bg-accent-soft p-4 font-semibold">
        Couldn&apos;t load your saved items: {error}
      </p>
    );
  }

  const remove = async (id: string) => {
    try {
      await deleteSaved(id);
      setItems((xs) => xs!.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete.");
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div className="mt-10 space-y-12">
      <p className="text-muted">
        Signed in as <strong className="text-ink">{user.email}</strong> · {items!.length} saved
      </p>
      {ORDER.map((kind) => {
        const group = items!.filter((i) => i.kind === kind);
        if (RETIRED.includes(kind) && !group.length) return null;
        return (
          <section key={kind} aria-labelledby={`saved-${kind}`}>
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
              <h2 id={`saved-${kind}`} className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold">
                {KIND_LABEL[kind]}
              </h2>
              <span className="font-display text-sm font-semibold text-accent tabular-nums">{String(group.length).padStart(2, "0")}</span>
            </div>
            {RETIRED.includes(kind) && (
              <p className="mt-4 text-sm text-muted">Made with the previous GTM Generator. They can no longer be opened; delete them when you no longer need them.</p>
            )}
            {group.length === 0 ? (
              <p className="mt-4 text-muted">
                Nothing saved yet. {EMPTY_HINT[kind].text}{" "}
                <Link href={EMPTY_HINT[kind].href} className="font-semibold text-accent hover:text-accent-strong">
                  {EMPTY_HINT[kind].cta} →
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {group.map((item) => (
                  <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link href={`${item.path}?saved=${item.id}`} className="font-display text-lg font-bold tracking-tight break-words hover:text-accent">
                        {item.title}
                      </Link>
                      <p className="text-sm text-muted">
                        Saved {new Date(item.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link href={`${item.path}?saved=${item.id}`} className="inline-flex h-10 items-center bg-accent px-4 font-display text-sm font-semibold text-on-accent hover:bg-accent-strong rounded-full">
                        Open
                      </Link>
                      {confirming === item.id ? (
                        <>
                          <button type="button" onClick={() => remove(item.id)} className="h-10 rounded-full border-2 border-accent bg-accent-soft px-4 font-display text-sm font-semibold text-accent-strong">
                            Yes, delete
                          </button>
                          <button type="button" onClick={() => setConfirming(null)} className="h-10 rounded-full border-2 border-line px-4 font-display text-sm font-semibold">
                            Keep
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setConfirming(item.id)} className="h-10 glass rounded-full px-4 font-display text-sm font-semibold hover:bg-white" aria-label={`Delete ${item.title}`}>
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
