import type { Metadata } from "next";
import { ContextualSignal } from "@/components/tools/ContextualSignal";
import { PageIntro } from "@/components/tools/PageIntro";

export const metadata: Metadata = {
  title: "Contextual Signal Generator",
  description:
    "Enter a brand, product or topic to see the current context around it: recent news, social sentiment and search-interest trends in one view. Uses free public data sources.",
};

export default function ContextualSignalPage() {
  return (
    <>
      <PageIntro eyebrow="Contextual Signal Generator" title="What's the" accent="context?">
        <p>Type a brand, product or topic and see what's being said about it right now: news, social sentiment and search interest, in one view.</p>
      </PageIntro>
      <ContextualSignal />
    </>
  );
}
