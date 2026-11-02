import type { Metadata } from "next";
import { HubPage } from "@/components/hub/HubPage";
import { COUNTS } from "@/lib/calculators/data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/buy-side", {
  title: "Buy-side KPI calculators: CPM, CPC, CPA, ROAS and more",
  description: `${COUNTS.buySide} free KPI calculators for media buyers across ${COUNTS.buyVerticals} verticals.`,
});

export default function BuySideHub() {
  return <HubPage side="buy" />;
}
