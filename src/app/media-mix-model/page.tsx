import type { Metadata } from "next";
import { MediaMixModel } from "@/components/mmm/MediaMixModel";
import { PageIntro } from "@/components/tools/PageIntro";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

const description =
  "Free media mix modeling tool: measure the ROI of every marketing channel, see where spend saturates, and get an optimized budget split. Runs in your browser; your data never leaves your device.";

export const metadata: Metadata = pageMetadata("/media-mix-model", {
  title: "Media Mix Model: free MMM tool for channel ROI",
  description,
});

export default function MediaMixModelPage() {
  return (
    <>
      <JsonLd data={toolJsonLd("/media-mix-model")} />
      <PageIntro eyebrow="Tools · Media mix modeling" title="See what every channel" accent="really earns.">
        <p>ROI with honest ranges, where each channel saturates, and the budget split that earns more. Runs on a sample straight away; bring your own weekly data when you&apos;re ready.</p>
      </PageIntro>
      <MediaMixModel />
    </>
  );
}
