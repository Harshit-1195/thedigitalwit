"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { classifyAuthError, cooldownFrom, isValidEmail, RESEND_COOLDOWN_SECONDS, safeNext, type LoginError } from "@/lib/auth/helpers";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

type View = "choose" | "sent";

const LAST_EMAIL = "tdw:last-email";

const ERROR_COPY: Record<LoginError, { title: string; body: string }> = {
  link_expired: {
    title: "That link has expired",
    body: "Sign-in links work once and only for a limited time. Enter your email to get a new one.",
  },
  access_denied: { title: "Sign-in was cancelled", body: "No problem. Pick an option below to try again." },
  rate_limited: { title: "Please wait a moment", body: "Too many emails were requested. You can send another shortly." },
  invalid_code: { title: "That code didn't work", body: "Check you're using the code from the latest email, or send a new one." },
  provider_error: { title: "Sign-in didn't finish", body: "Google or Microsoft couldn't complete sign-in. Try again, or use your email instead." },
  unknown: { title: "Something went wrong", body: "We couldn't sign you in. Please try again." },
};

export function LoginPanel() {
  const { user, loading, configured, signOut } = useAuth();
  const router = useRouter();
  const [next, setNext] = useState("/saved");
  const [view, setView] = useState<View>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<LoginError | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const emailId = useId();
  const codeId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Read ?next and ?error, plus Supabase's #error_code=… fragment.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const h = new URLSearchParams(window.location.hash.slice(1));
    setNext(safeNext(q.get("next")));
    const err = q.get("error") ?? (h.get("error") ? classifyAuthError(h.get("error_code") ?? h.get("error"), h.get("error_description")) : null);
    if (err) setError(err in ERROR_COPY ? (err as LoginError) : "unknown");
    try {
      setEmail(localStorage.getItem(LAST_EMAIL) ?? "");
    } catch {}
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => headingRef.current?.focus(), [view]);

  const redirectTo = (path: string) => `${window.location.origin}${path}?next=${encodeURIComponent(next)}`;

  const oauth = async (provider: "google" | "azure") => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo("/auth/callback"), scopes: provider === "azure" ? "email" : undefined },
    });
    if (error) {
      setError(classifyAuthError(error.code, error.message));
      setBusy(null);
    }
  };

  const sendEmail = async () => {
    const supabase = getBrowserSupabase();
    if (!supabase || cooldown > 0) return;
    if (!isValidEmail(email)) return setFieldError("Enter a valid email address, like you@company.com.");
    setBusy("email");
    setError(null);
    setFieldError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo("/auth/callback"), shouldCreateUser: true },
    });
    setBusy(null);
    try {
      localStorage.setItem(LAST_EMAIL, email.trim());
    } catch {}
    if (error) {
      const kind = classifyAuthError(error.code, error.message);
      if (kind === "rate_limited") setCooldown(cooldownFrom(error.message));
      return setError(kind);
    }
    setView("sent");
    setCode("");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const verifyCode = async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const token = code.replace(/\s/g, "");
    if (!/^\d{6,10}$/.test(token)) return setError("invalid_code");
    setBusy("code");
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "email" });
    setBusy(null);
    if (error) return setError(classifyAuthError(error.code, error.message) === "link_expired" ? "link_expired" : "invalid_code");
    router.push(next);
    router.refresh();
  };

  if (loading) return <div className="glass min-h-96 rounded-3xl" aria-busy="true" />;

  if (user) {
    return (
      <div className="glass rounded-3xl p-6 sm:p-8">
        <h2 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold outline-none">
          You&apos;re signed in.
        </h2>
        <p className="mt-2 break-words text-muted">{user.email}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={next} className="inline-flex h-12 items-center bg-accent px-6 font-display font-semibold text-on-accent hover:bg-accent-strong rounded-full">
            {next === "/saved" ? "My saved items" : "Continue"} →
          </Link>
          <button type="button" onClick={() => signOut()} className="h-12 glass rounded-full px-6 font-display font-semibold hover:bg-white">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const disabled = !configured || busy !== null;

  return (
    <div className="glass overflow-hidden rounded-3xl">
      {!configured && (
        <div className="border-b border-ink/10 bg-accent-soft/80 px-5 py-4 text-sm sm:px-8">
          <p className="font-display font-semibold">Sign-in isn&apos;t switched on yet.</p>
          <p className="mt-1">
            The site owner still needs to add the Supabase keys. Every tool works without an account in the meantime.
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="bg-ink px-5 py-4 text-white sm:px-8">
          <p className="font-display font-semibold">{ERROR_COPY[error].title}</p>
          <p className="mt-1 text-sm text-white/80">
            {error === "rate_limited" && cooldown > 0 ? `You can send another email in ${cooldown}s.` : ERROR_COPY[error].body}
          </p>
        </div>
      )}

      <div className="p-5 sm:p-8">
        {view === "choose" ? (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-[-0.03em] outline-none">
              Continue with
            </h2>
            <div className="mt-4 grid gap-3">
              <ProviderButton onClick={() => oauth("google")} disabled={disabled} busy={busy === "google"} icon={<GoogleIcon />}>
                Continue with Google
              </ProviderButton>
              <ProviderButton onClick={() => oauth("azure")} disabled={disabled} busy={busy === "azure"} icon={<MicrosoftIcon />}>
                Continue with Microsoft
              </ProviderButton>
              <p className="text-xs text-muted">Microsoft covers Outlook, Hotmail, Live and work or school accounts.</p>
            </div>

            <div className="my-6 flex items-center gap-3 text-sm text-muted" aria-hidden>
              <span className="h-px flex-1 bg-line" />
              or use your email
              <span className="h-px flex-1 bg-line" />
            </div>

            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                sendEmail();
              }}
            >
              <label htmlFor={emailId} className="block font-display text-sm font-semibold">
                Email address
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldError(null);
                }}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={fieldError ? `${emailId}-err ${emailId}-hint` : `${emailId}-hint`}
                placeholder="you@company.com"
                className="mt-2 h-12 w-full rounded-xl border-2 border-ink bg-white/70 px-3 aria-[invalid=true]:border-accent"
              />
              {fieldError && (
                <p id={`${emailId}-err`} className="mt-2 text-sm font-semibold text-accent">
                  {fieldError}
                </p>
              )}
              <p id={`${emailId}-hint`} className="mt-2 text-xs text-muted">
                We&apos;ll email you a sign-in link and a 6-digit code. New here? The same email creates your account once you
                confirm it.
              </p>
              <button
                type="submit"
                disabled={disabled || cooldown > 0}
                className="mt-4 h-12 w-full bg-accent font-display font-semibold text-on-accent hover:bg-accent-strong disabled:opacity-50 rounded-full"
              >
                {busy === "email" ? "Sending…" : cooldown > 0 ? `Send again in ${cooldown}s` : "Email me a sign-in link"}
              </button>
            </form>
            <p className="mt-6 text-xs text-muted">
              By continuing you agree to the{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
                terms of use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                privacy policy
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow text-accent">Step 2 of 2</p>
            <h2 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-extrabold tracking-[-0.04em] outline-none">
              Check your inbox.
            </h2>
            <p className="mt-3">
              We sent a sign-in link to <strong className="break-words">{email.trim()}</strong>. Open it on this device, or type
              the code from the email below.
            </p>
            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                verifyCode();
              }}
            >
              <label htmlFor={codeId} className="block font-display text-sm font-semibold">
                6-digit code
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id={codeId}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={12}
                  placeholder="123456"
                  className="h-12 min-w-0 flex-1 rounded-xl border-2 border-ink bg-white/70 px-3 font-mono text-xl tracking-[0.3em]"
                />
                <button type="submit" disabled={busy !== null} className="h-12 shrink-0 bg-accent px-5 font-display font-semibold text-on-accent hover:bg-accent-strong disabled:opacity-50 rounded-full">
                  {busy === "code" ? "Checking…" : "Verify"}
                </button>
              </div>
            </form>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
              <span className="text-muted">Didn&apos;t get it? Check spam, then</span>
              <button
                type="button"
                onClick={sendEmail}
                disabled={cooldown > 0 || busy !== null}
                className="font-display font-semibold text-accent hover:text-accent-strong disabled:text-muted"
                aria-live="polite"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : busy === "email" ? "Sending…" : "Resend email"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("choose");
                  setError(null);
                }}
                className="font-display font-semibold text-ink underline-offset-2 hover:underline"
              >
                Use a different email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProviderButton({ children, icon, onClick, disabled, busy }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; disabled: boolean; busy: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-full items-center justify-center gap-3 glass rounded-full font-display font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      {busy ? "Redirecting…" : children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
