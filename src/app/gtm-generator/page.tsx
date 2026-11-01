import type { Metadata } from "next";
import { GtmGenerator } from "@/components/tools/GtmGenerator";
import { PageIntro } from "@/components/tools/PageIntro";

export const metadata: Metadata = {
  title: "GTM Strategy Generator",
  description:
    "Choose your industry, geography, goal, company stage and budget to get a go-to-market plan: positioning, channel mix, adtech and martech stack, 26-week roadmap with decision gates, org model and risk register. Runs entirely in your browser.",
};

export default function GtmGeneratorPage() {
  return (
    <>
      <PageIntro eyebrow="Strategy" title="GTM" accent="generator.">
        <p>Five choices in, a full go-to-market strategy out: positioning, channel mix and stack, a 26-week roadmap with decision gates, and the risks to watch.</p>
      </PageIntro>
      <GtmGenerator />
    </>
  );
}
