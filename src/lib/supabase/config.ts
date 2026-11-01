// Supabase settings come from environment variables (see .env.example).
// Until real values are supplied the site runs normally and sign-in shows a
// "not configured yet" notice instead of failing.

const PLACEHOLDER = /your-project|placeholder|^$/i;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isAuthConfigured = !PLACEHOLDER.test(SUPABASE_URL) && !PLACEHOLDER.test(SUPABASE_KEY);
