import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { classifyAuthError, safeNext } from "@/lib/auth/helpers";
import { isAuthConfigured } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";

// The link in the sign-in email lands here:
//   /auth/confirm?token_hash=…&type=email&next=…
// Verifying the token is what activates a new account.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const fail = (error: string) => NextResponse.redirect(new URL(`/login?error=${error}&next=${encodeURIComponent(next)}`, url.origin));

  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  if (!isAuthConfigured || !tokenHash) return fail("link_expired");

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return fail(classifyAuthError(error.code, error.message));
  return NextResponse.redirect(new URL(next, url.origin));
}
