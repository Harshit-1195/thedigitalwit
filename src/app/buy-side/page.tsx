import type { Metadata } from "next";
import { HubPage } from "@/components/hub/HubPage";
import { COUNTS } from "@/lib/calculators/data";

export const metadata: Metadata = {
  title: "Buy-side calculators",
  description: `${COUNTS.buySide} free KPI calculators for media buyers across ${COUNTS.buyVerticals} verticals.`,
};

export default function BuySideHub() {
  return <HubPage side="buy" />;
}
