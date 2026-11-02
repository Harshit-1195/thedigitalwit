import type { Metadata } from "next";
import { DoohSight } from "@/components/tools/DoohSight";
import { PageIntro } from "@/components/tools/PageIntro";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/doohsight", {
  title: "DoohSight: DOOH and pDOOH campaign measurement",
  description:
    "An interactive DOOH & pDOOH measurement dashboard that computes the attention, footfall, cross-channel, ROI, brand, and statistical-confidence metrics traditional out-of-home reporting leaves out.",
});

export default function DoohSightPage() {
  return (
    <>
      <JsonLd data={toolJsonLd("/doohsight")} />
      <PageIntro eyebrow="DoohSight · DOOH measurement" title="Prove what DOOH" accent="really did.">
        <p>Plays and impressions only say a campaign ran. Enter your DOOH or pDOOH results and see attention, footfall, halo, ROI, brand lift and statistical confidence, scored in one place.</p>
      </PageIntro>
      <DoohSight />
    </>
  );
}
