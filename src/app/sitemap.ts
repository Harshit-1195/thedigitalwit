import type { MetadataRoute } from "next";
import { calculatorHref, SIDES, type Side } from "@/lib/calculators/data";
import { ALL_PAGES, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ALL_PAGES.filter((p) => p.href !== "/saved" && p.href !== "/login").map((p) => p.href);
  const calculators = (["buy", "sell"] as Side[]).flatMap((side) => SIDES[side].calculators.map((c) => calculatorHref(side, c.id)));
  return [...pages, ...calculators].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path.includes("/calculators/") ? 0.6 : 0.8,
  }));
}
