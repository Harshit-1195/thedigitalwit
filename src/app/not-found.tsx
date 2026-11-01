import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap py-20 sm:py-28">
      <p className="eyebrow text-red">404</p>
      <h1 className="display-xl mt-6">
        Zero
        <br />
        <span className="text-red">impressions.</span>
      </h1>
      <p className="mt-8 max-w-xl text-lg text-muted">This page didn&apos;t serve. Try the calculators instead.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="inline-flex h-12 items-center bg-red px-6 font-display font-semibold text-white hover:bg-red-strong rounded-full">
          Back to home
        </Link>
        <Link href="/buy-side" className="inline-flex h-12 items-center glass rounded-full px-6 font-display font-semibold hover:bg-white">
          Buy-side
        </Link>
        <Link href="/sell-side" className="inline-flex h-12 items-center glass rounded-full px-6 font-display font-semibold hover:bg-white">
          Sell-side
        </Link>
      </div>
    </section>
  );
}
