import type { Metadata } from "next";
import { MediaPlanGenerator } from "@/components/media-plan/MediaPlanGenerator";
import { PageIntro } from "@/components/tools/PageIntro";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/media-plan-generator", {
  title: "Media Plan Generator",
  description:
    "Build a graded, budgeted, cross-channel media plan across social, programmatic display, native, CTV, audio, DOOH and YouTube, with timeline, currencies, markets and charts.",
});

export default function MediaPlanGeneratorPage() {
  return (
    <>
      <JsonLd data={toolJsonLd("/media-plan-generator")} />
      <PageIntro eyebrow="Strategy" title="Media plan" accent="generator.">
        <p>Set a budget, markets and dates, split it across seven channels, stagger the flights, then generate a graded plan with charts and a summary you can print or export.</p>
      </PageIntro>
      <MediaPlanGenerator />
    </>
  );
}
