// Response shape of GET /api/context, shared by the route and the UI.

export type Sentiment = "positive" | "neutral" | "negative";
export type Source = "news" | "social" | "trends" | "keywords";

export interface Overview {
  /** 0–100: share of positive among scored (non-neutral) items. null when nothing was scored. */
  sentimentScore: number | null;
  /** Social posts sampled across Reddit, Hacker News and Bluesky. */
  mentions: number;
  /** % change in search interest, last 7 days vs the 7 before. null without trends data. */
  mentionsDelta: number | null;
  /** Average Google Trends interest over the last 7 days, relative 0–100. */
  searchInterest: number | null;
  trendDirection: "rising" | "falling" | "steady" | null;
}

export interface NewsItem {
  title: string;
  source: string;
  time: string | null;
  sentiment: Sentiment;
  snippet: string | null;
  url: string;
}

export interface SocialPost {
  platform: "Reddit" | "Hacker News" | "Bluesky";
  title: string;
  text: string | null;
  time: string | null;
  /** Upvotes, points or likes; null when the source doesn't report one (Reddit RSS). */
  score: number | null;
  sentiment: Sentiment;
  url: string;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface RelatedTerm {
  query: string;
  /** Relative score 0–100, or "Breakout" for rising terms that grew more than 5,000%. */
  value: number | "Breakout";
}

export interface ContextResponse {
  keyword: string;
  cached: boolean;
  generatedAt: string;
  overview: Overview;
  news: NewsItem[];
  social: { breakdown: Record<Sentiment, number>; posts: SocialPost[] };
  trend: TrendPoint[];
  /** Google Trends related and rising searches (empty when Trends is unavailable). */
  related: { top: RelatedTerm[]; rising: RelatedTerm[] };
  /** Google search suggestions: what people type after the keyword, and "keyword vs …" comparisons. */
  keywords: { suggestions: string[]; comparisons: string[] };
  unavailable: Source[];
}

export interface ErrorResponse {
  error: string;
}
