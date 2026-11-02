// Pure helpers for the login flow, kept separate so they can be unit-tested.

/** Only same-site paths are allowed as a post-login destination (no open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/saved"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/^\/(login|auth)(\/|$|\?)/.test(next)) return fallback;
  return next;
}

export type LoginError = "link_expired" | "access_denied" | "rate_limited" | "invalid_code" | "provider_error" | "email_failed" | "unknown";

/** Maps Supabase / OAuth error codes and messages onto the states the login page shows. */
export function classifyAuthError(code?: string | null, message?: string | null): LoginError {
  const c = (code ?? "").toLowerCase();
  const m = (message ?? "").toLowerCase();
  if (c === "otp_expired" || c === "flow_state_expired" || /expired|invalid or has expired/.test(m)) return "link_expired";
  if (c === "over_email_send_rate_limit" || c === "over_request_rate_limit" || /security purposes|rate limit/.test(m)) return "rate_limited";
  if (/error sending .*email/.test(m)) return "email_failed";
  if (c === "otp_disabled" || /token|otp|code/.test(m)) return "invalid_code";
  if (c === "access_denied") return "access_denied";
  if (c.startsWith("provider") || /provider/.test(m)) return "provider_error";
  return "unknown";
}

export type Providers = { google: boolean; azure: boolean };

/** Reads which OAuth providers are switched on from Supabase's public /auth/v1/settings response. */
export function enabledProviders(settings: unknown): Providers {
  const ext = (settings as { external?: Record<string, unknown> } | null)?.external ?? {};
  return { google: ext.google === true, azure: ext.azure === true };
}

export const RESEND_COOLDOWN_SECONDS = 60;

/** Reads "…only request this after 42 seconds" from a rate-limit message. */
export function cooldownFrom(message?: string | null): number {
  const n = Number((message ?? "").match(/after (\d+) seconds?/i)?.[1]);
  return Number.isFinite(n) && n > 0 ? n : RESEND_COOLDOWN_SECONDS;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
