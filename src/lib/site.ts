// Single source for navigation. Header, footer, home index and (Phase 4)
// header search all read from here, so a page is added in one place.

export type NavLink = {
  href: string;
  label: string;
  blurb: string;
};

export type NavGroup = {
  label: string;
  links: NavLink[];
};

/** Public address of the site, used for link previews, the sitemap and robots.txt. */
export const SITE_URL = (
  // The .env.example placeholder counts as unset.
  (process.env.NEXT_PUBLIC_SITE_URL?.includes("your-domain") ? "" : process.env.NEXT_PUBLIC_SITE_URL) ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE = {
  name: "thedigitalwit",
  tagline: "The free reference hub for digital advertising.",
} as const;

export const PILLARS = {
  buy: {
    href: "/buy-side",
    label: "Buy-Side",
    blurb: "KPI calculators for media buyers, across every channel you spend in.",
  },
  sell: {
    href: "/sell-side",
    label: "Sell-Side",
    blurb: "KPI calculators for publishers and monetization teams.",
  },
} as const;

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Strategy",
    links: [
      {
        href: "/gtm-generator",
        label: "GTM Generator",
        blurb: "A full go-to-market strategy: positioning, channel mix and stack, 26-week roadmap, org model and risks.",
      },
      {
        href: "/media-plan-generator",
        label: "Media Plan Generator",
        blurb: "A graded seven-channel plan with budgets, flights, markets, CAC or ROAS targets, charts and export.",
      },
    ],
  },
  {
    label: "Tools",
    links: [
      {
        href: "/creative-studio",
        label: "Creative Studio",
        blurb: "Preview a creative in 50+ ad formats, score and export it, and look up sizes and file specs for every format.",
      },
      {
        href: "/doohsight",
        label: "DoohSight",
        blurb: "Measure a DOOH or pDOOH campaign beyond impressions: attention, footfall, ROI, lift and confidence.",
      },
      {
        href: "/contextual-signal",
        label: "Contextual Signal",
        blurb: "News, social sentiment and search interest around any brand or topic, from free public sources.",
      },
      {
        href: "/media-mix-model",
        label: "Media Mix Model",
        blurb: "Channel ROI with uncertainty ranges, response curves, a budget optimizer and scenarios, fitted in your browser.",
      },
    ],
  },
  {
    label: "Knowledge",
    links: [
      {
        href: "/governance",
        label: "Governance",
        blurb: "AI in advertising: disclosure, platform policy, data and consent.",
      },
    ],
  },
];

// Every top-level page, for the footer and (Phase 4) search.
export const ALL_PAGES: NavLink[] = [
  { href: "/", label: "Home", blurb: SITE.tagline },
  { href: PILLARS.buy.href, label: "Buy-Side calculators", blurb: PILLARS.buy.blurb },
  { href: PILLARS.sell.href, label: "Sell-Side calculators", blurb: PILLARS.sell.blurb },
  ...NAV_GROUPS.flatMap((g) => g.links),
  { href: "/login", label: "Log in", blurb: "Sign in to save scenarios and plans." },
  { href: "/saved", label: "My saved items", blurb: "Your saved calculator scenarios, media plans and GTM plans." },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
