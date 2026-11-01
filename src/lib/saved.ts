"use client";

import { getBrowserSupabase } from "./supabase/client";

export type SavedKind = "calculator" | "media_plan" | "gtm_plan";

export type SavedItem<P = unknown> = {
  id: string;
  kind: SavedKind;
  title: string;
  path: string;
  payload: P;
  created_at: string;
};

export const KIND_LABEL: Record<SavedKind, string> = {
  calculator: "Calculator scenarios",
  media_plan: "Media plans",
  gtm_plan: "GTM plans",
};

const TABLE = "saved_items";
const PENDING_KEY = "tdw:pending-save";

function db() {
  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error("Saving isn't set up on this site yet.");
  return supabase.from(TABLE);
}

export async function saveItem(item: { kind: SavedKind; title: string; path: string; payload: unknown }): Promise<SavedItem> {
  const { data, error } = await db().insert(item).select().single();
  if (error) throw new Error(error.message);
  return data as SavedItem;
}

export async function listSaved(): Promise<SavedItem[]> {
  const { data, error } = await db().select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as SavedItem[];
}

export async function getSaved(id: string): Promise<SavedItem | null> {
  const { data, error } = await db().select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as SavedItem | null;
}

export async function deleteSaved(id: string): Promise<void> {
  const { error } = await db().delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* Work in progress survives the trip through the login page (including the
   full-page OAuth redirect) in sessionStorage, then saves on return. */

type Pending = { kind: SavedKind; title: string; path: string; payload: unknown };

export function stashPending(p: Pending) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
    // Storage unavailable (private mode): the user just re-saves after login.
  }
}

export function takePending(path: string): Pending | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pending;
    if (p.path !== path) return null;
    sessionStorage.removeItem(PENDING_KEY);
    return p;
  } catch {
    return null;
  }
}
