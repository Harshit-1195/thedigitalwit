import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search engines and AI assistants are all welcome; only account and API routes are off limits.
const DISALLOW = ["/saved", "/auth/", "/api/"];

// Named explicitly so the welcome is unambiguous to AI crawlers that look for their own entry.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
