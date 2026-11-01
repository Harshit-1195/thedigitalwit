"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAuthConfigured, SUPABASE_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/** Browser Supabase client, or null when credentials haven't been set yet. */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!isAuthConfigured) return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
