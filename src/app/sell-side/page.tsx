import type { Metadata } from "next";
import { HubPage } from "@/components/hub/HubPage";
import { COUNTS } from "@/lib/calculators/data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/sell-side", {
  title: "Sell-side KPI calculators: RPM, eCPM, fill rate and more",
  description: `${COUNTS.sellSide} free KPI calculators for publishers and monetization teams.`,
});

export default function SellSideHub() {
  return <HubPage side="sell" />;
}
