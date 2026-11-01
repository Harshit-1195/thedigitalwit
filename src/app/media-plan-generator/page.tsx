import type { Metadata } from "next";
import { MediaPlanGenerator } from "@/components/media-plan/MediaPlanGenerator";
import { PageIntro } from "@/components/tools/PageIntro";

export const metadata: Metadata = {
  title: "Media Plan Generator",
  description:
    "Build a graded, budgeted, cross-channel media plan across social, programmatic display, native, CTV, audio, DOOH and YouTube, with timeline, currencies, markets and charts.",
};

export default function MediaPlanGeneratorPage() {
  return (
    <>
      <PageIntro eyebrow="Strategy" title="Media plan" accent="generator.">
        <p>Set a budget, markets and dates, split it across seven channels, stagger the flights, then generate a graded plan with charts and a summary you can print or export.</p>
      </PageIntro>
      <MediaPlanGenerator />
    </>
  );
}
