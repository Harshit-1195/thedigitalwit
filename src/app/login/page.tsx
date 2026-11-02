import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/login", {
  title: "Log in",
  description: "Log in with Google, Microsoft or email to save calculator scenarios, media plans and GTM plans.",
}, { noindex: true });

export default function LoginPage() {
  return (
    <section className="wrap grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_28rem] lg:gap-16 lg:py-20">
      <div>
        <p className="eyebrow text-accent">Account</p>
        <h1 className="mt-4 text-[clamp(3rem,9vw,7rem)] leading-[0.88] font-extrabold tracking-[-0.055em]">
          Log in.
          <br />
          <span className="text-accent">Keep your work.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
          Every calculator and tool works without an account. Logging in only lets you save calculator scenarios, media
          plans and GTM plans, and come back to them later.
        </p>
        <ul className="mt-8 max-w-xl divide-y divide-line border-y-2 border-ink">
          {["Free. No card, no trial.", "One account across Google, Microsoft and email.", "Delete anything you save, any time."].map((t, i) => (
            <li key={t} className="flex gap-4 py-3">
              <span className="font-display font-semibold text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:pt-6">
        <LoginPanel />
      </div>
    </section>
  );
}
