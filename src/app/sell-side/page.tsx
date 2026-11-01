import type { Metadata } from "next";
import { HubPage } from "@/components/hub/HubPage";
import { COUNTS } from "@/lib/calculators/data";

export const metadata: Metadata = {
  title: "Sell-side calculators",
  description: `${COUNTS.sellSide} free KPI calculators for publishers and monetization teams.`,
};

export default function SellSideHub() {
  return <HubPage side="sell" />;
}
