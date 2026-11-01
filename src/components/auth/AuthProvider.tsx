"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isAuthConfigured } from "@/lib/supabase/config";
import { getBrowserSupabase } from "@/lib/supabase/client";

type AuthState = { user: User | null; loading: boolean; configured: boolean; signOut: () => Promise<void> };

const AuthContext = createContext<AuthState>({ user: null, loading: false, configured: false, signOut: async () => {} });

/** Tracks the signed-in user for the header, login page and save buttons. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isAuthConfigured);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await getBrowserSupabase()?.auth.signOut();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, configured: isAuthConfigured, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
