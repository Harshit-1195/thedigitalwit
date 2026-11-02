import type { Metadata } from "next";
import { SpecsLibrary } from "@/components/specs/SpecsLibrary";
import { CreativeStudio } from "@/components/studio/CreativeStudio";
import { JsonLd } from "@/components/JsonLd";
import { CREATIVE_SPECS, SPEC_FORMATS, SPECS_LAST_REVIEWED } from "@/lib/creative-specs";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/creative-studio", {
  title: "Creative Studio: ad format previews, mockups and specs",
  description:
    "Preview a creative in 50+ IAB and platform ad formats with delivery scores, editable mockups and HTML5, VAST and image export, and look up sizes and file specs for every format.",
});

/**
 * The preview tool is a self-contained app (public/tools/creative-studio.html, built by `npm run build:studio`)
 * in a same-origin frame, so its page-wide keyboard and pointer handlers and its styles stay isolated.
 * The specs library (formerly /creative-specs) is the second tab.
 */
export default function CreativeStudioPage() {
  const verifyCount = CREATIVE_SPECS.filter((s) => s.verify).length;
  return (
    <>
      <JsonLd data={toolJsonLd("/creative-studio")} />
      <CreativeStudio
        specs={
          <>
            <section className="wrap pt-10 pb-8 sm:pt-14">
              <p className="eyebrow text-accent">Creative Studio · Specs library</p>
              <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
                <h2 className="text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
                  Creative <span className="text-accent">specs.</span>
                </h2>
                <div className="max-w-lg space-y-3 text-muted">
                  <p className="text-lg sm:text-xl">
                    {CREATIVE_SPECS.length} ad units across {SPEC_FORMATS.length} formats: sizes, file types, weights and durations in one place.
                  </p>
                  <p className="text-sm">
                    IAB standard units are stable. The {verifyCount} units marked <strong className="text-accent">verify</strong> are platform- or publisher-specific and change
                    often, so confirm them with the current spec sheet before you traffic. Last reviewed {SPECS_LAST_REVIEWED}.
                  </p>
                </div>
              </div>
            </section>
            <SpecsLibrary specs={CREATIVE_SPECS} formats={SPEC_FORMATS} />
          </>
        }
      />
    </>
  );
}
