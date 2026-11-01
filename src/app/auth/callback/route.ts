import { NextResponse, type NextRequest } from "next/server";
import { classifyAuthError, safeNext } from "@/lib/auth/helpers";
import { isAuthConfigured } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";

// Google and Microsoft return here with ?code=… (PKCE) after sign-in.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const fail = (error: string) => NextResponse.redirect(new URL(`/login?error=${error}&next=${encodeURIComponent(next)}`, url.origin));

  if (!isAuthConfigured) return fail("unknown");
  const providerError = url.searchParams.get("error");
  if (providerError) return fail(classifyAuthError(url.searchParams.get("error_code") ?? providerError, url.searchParams.get("error_description")));

  const code = url.searchParams.get("code");
  if (!code) return fail("unknown");
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail(classifyAuthError(error.code, error.message));
  return NextResponse.redirect(new URL(next, url.origin));
}
