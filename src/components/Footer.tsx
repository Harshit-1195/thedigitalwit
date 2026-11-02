import Link from "next/link";
import { NAV_GROUPS, PILLARS, SITE } from "@/lib/site";
import { Wordmark } from "./Wordmark";

export function Footer() {
  const columns = [
    {
      label: "Calculators",
      links: [
        { href: "/", label: "Home" },
        { href: PILLARS.buy.href, label: "Buy-Side" },
        { href: PILLARS.sell.href, label: "Sell-Side" },
      ],
    },
    ...NAV_GROUPS.map((g) => ({ label: g.label, links: g.links })),
    { label: "Account", links: [{ href: "/login", label: "Log in" }, { href: "/saved", label: "My saved items" }] },
  ];

  return (
    <footer className="focus-on-dark mt-16 rounded-t-[2.5rem] bg-ink text-white">
      <div className="wrap grid gap-12 py-16 lg:grid-cols-[1fr_2fr] lg:gap-10 lg:py-20">
        <div>
          <Link href="/" aria-label="thedigitalwit home">
            <Wordmark className="text-3xl! sm:text-4xl!" />
          </Link>
          <p className="mt-4 max-w-xs text-white/70">{SITE.tagline} Free to use. Log in only to save your work.</p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.label}>
              <p className="eyebrow mb-3 text-white/50">{col.label}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/90 underline-offset-4 hover:text-white hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

      </div>
      <div className="border-t border-white/15">
        <div className="wrap flex flex-col gap-2 py-5 text-sm text-white/60 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} thedigitalwit</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            <li>
              <Link href="/privacy" className="underline-offset-4 hover:text-white hover:underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="underline-offset-4 hover:text-white hover:underline">
                Terms
              </Link>
            </li>
            <li>
              <a href={`mailto:${SITE.contactEmail}`} className="underline-offset-4 hover:text-white hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
