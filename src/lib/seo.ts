import type { Metadata } from "next";
import { calculatorHref, getCategory, oneLiner, SIDES, type Side } from "./calculators/data";
import type { Calculator } from "./calculators/types";
import { ALL_PAGES, SITE, SITE_URL } from "./site";

// Search and share metadata shared by every page, plus schema.org JSON-LD builders.

const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE.name}: free ad KPI calculators and media tools` };

export const BASE_OPEN_GRAPH = { type: "website", siteName: SITE.name, locale: "en_US" } as const;

/**
 * Adds the canonical URL, Open Graph and Twitter card fields to a page's metadata.
 * A page-level `openGraph` replaces the layout's wholesale (image included), so it is rebuilt in full here.
 */
export function pageMetadata(path: string, meta: Metadata, { noindex = false } = {}): Metadata {
  return {
    ...meta,
    alternates: { canonical: path },
    openGraph: { ...BASE_OPEN_GRAPH, url: path, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

const abs = (path: string) => (path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`);

const PUBLISHER = { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE.name, url: `${SITE_URL}/`, logo: `${SITE_URL}/icon.svg` };

const FREE_OFFER = { "@type": "Offer", price: "0", priceCurrency: "USD" };

export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      PUBLISHER,
      { "@type": "WebSite", "@id": `${SITE_URL}/#site`, name: SITE.name, url: `${SITE_URL}/`, description: SITE.tagline, publisher: { "@id": PUBLISHER["@id"] }, inLanguage: "en" },
    ],
  };
}

function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

function webApp(name: string, path: string, description: string) {
  return {
    "@type": "WebApplication",
    name,
    url: abs(path),
    description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web browser)",
    isAccessibleForFree: true,
    offers: FREE_OFFER,
    publisher: { "@id": PUBLISHER["@id"] },
  };
}

export function calculatorJsonLd(side: Side, calc: Calculator) {
  const meta = SIDES[side];
  const path = calculatorHref(side, calc.id);
  return {
    "@context": "https://schema.org",
    "@graph": [
      { ...webApp(`${calc.name} calculator`, path, oneLiner(calc)), applicationSubCategory: getCategory(side, calc.cat).label },
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: `${meta.label} calculators`, path: meta.hub },
        { name: calc.name, path },
      ]),
    ],
  };
}

/** For the tool pages listed in the site navigation (GTM Generator, Media Mix Model, ...). */
export function toolJsonLd(path: string) {
  const link = ALL_PAGES.find((p) => p.href === path);
  if (!link) throw new Error(`No nav entry for ${path}`);
  return {
    "@context": "https://schema.org",
    "@graph": [webApp(link.label, path, link.blurb), breadcrumbs([{ name: "Home", path: "/" }, { name: link.label, path }])],
  };
}
