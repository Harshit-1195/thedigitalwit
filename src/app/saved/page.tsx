import type { Metadata } from "next";
import { SavedItems } from "@/components/auth/SavedItems";

export const metadata: Metadata = {
  title: "My saved items",
  robots: { index: false },
};

export default function SavedPage() {
  return (
    <section className="wrap py-12 sm:py-16 lg:py-20">
      <p className="eyebrow text-accent">Account</p>
      <h1 className="mt-4 text-[clamp(2.75rem,8vw,6rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
        My saved <span className="text-accent">items.</span>
      </h1>
      <SavedItems />
    </section>
  );
}
