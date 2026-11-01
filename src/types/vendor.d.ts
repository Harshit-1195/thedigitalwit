// Minimal types for two untyped packages used by /api/context.

declare module "sentiment" {
  export default class Sentiment {
    analyze(text: string): { score: number; comparative: number };
  }
}

declare module "google-trends-api" {
  type Options = { keyword: string; startTime?: Date; endTime?: Date; geo?: string; hl?: string };
  const googleTrends: {
    interestOverTime(o: Options): Promise<string>;
    relatedQueries(o: Options): Promise<string>;
  };
  export default googleTrends;
}
