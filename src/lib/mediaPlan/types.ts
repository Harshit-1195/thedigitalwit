export type Funnel = "Upper" | "Mid" | "Lower" | "Upper/Mid";
export type Objective = "Full-funnel" | "Awareness" | "Consideration" | "Conversion";

export type ChannelKey = "social" | "progDisplay" | "native" | "ctv" | "audio" | "dooh" | "youtube";

export type Channel = {
  key: ChannelKey;
  name: string;
  color: string;
  /** USD cost per thousand impressions. */
  cpm: number;
  funnel: Funnel;
  /** Average frequency, used to turn impressions into reach. */
  freq: number;
  /** Share of budget, 0–100. */
  pct: number;
  /** Flight start and end as percentages of the campaign window. */
  start: number;
  end: number;
};

export type Currency = { code: string; label: string; rate: number };

export type GradeFactor = { label: string; score: number; max: number; note: string };
export type Letter = "A" | "B" | "C" | "D" | "F";
export type Grade = { total: number; letter: Letter; breakdown: GradeFactor[] };

export type CampaignSetup = {
  campaignName: string;
  objective: Objective;
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  geos: string[];
};
