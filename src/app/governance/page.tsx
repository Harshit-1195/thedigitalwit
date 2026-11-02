import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/governance", {
  title: "Governance: AI in advertising",
  description:
    "How AI is used in media buying, disclosure norms, generative-creative policy by platform, and data and consent basics.",
});

const LAST_REVIEWED = "October 2026";

const SECTIONS = [
  { id: "ai-in-media-buying", label: "AI in media buying" },
  { id: "disclosure", label: "Disclosure norms" },
  { id: "platform-policy", label: "Generative creative by platform" },
  { id: "data-consent", label: "Data and consent basics" },
  { id: "checklist", label: "Team checklist" },
];

// Platform rules change often; every card carries a verify flag.
const PLATFORMS: { name: string; where: string; points: string[] }[] = [
  {
    name: "Google Ads & YouTube",
    where: "Google Ads Policy Center; YouTube Help (altered or synthetic content)",
    points: [
      "Election ads must clearly disclose synthetic or digitally altered content that realistically depicts people or events.",
      "YouTube requires creators to disclose realistic altered or synthetic content; ads remain subject to Google Ads policies.",
      "Google's own generative asset tools mark some generated images (for example with SynthID). Review every generated asset before it serves.",
      "Misrepresentation, unreliable-claims and impersonation policies apply to AI creative exactly as to any other creative.",
    ],
  },
  {
    name: "Meta (Facebook, Instagram)",
    where: "Meta Advertising Standards; Meta Business Help Center",
    points: [
      "Political, electoral and social-issue ads must disclose photorealistic images, video or realistic audio that was digitally created or altered.",
      "Meta may label content it detects as AI-generated or AI-edited.",
      "Advantage+ generative features create variations of your creative automatically. Check settings, and review outputs for brand and claim accuracy.",
    ],
  },
  {
    name: "TikTok",
    where: "TikTok Advertising Policies; TikTok Community Guidelines",
    points: [
      "Realistic AI-generated content must be labelled. TikTok also reads Content Credentials (C2PA) to auto-label some AI content.",
      "Political ads are not allowed on TikTok.",
      "Using AI likenesses of public figures to imply endorsement is prohibited.",
    ],
  },
  {
    name: "LinkedIn",
    where: "LinkedIn Advertising Policies",
    points: [
      "Shows Content Credentials (C2PA) on images that carry them, so provenance metadata in your files may be visible to viewers.",
      "Deceptive or misleading content rules apply to AI creative; B2B claims and testimonials need substantiation.",
    ],
  },
  {
    name: "Amazon Ads",
    where: "Amazon Ads creative acceptance policies",
    points: [
      "Offers generative image and video tools for sponsored ads. Generated scenes must not misrepresent the product, its size, contents or results.",
      "All creative, generated or not, goes through Amazon's creative acceptance review.",
    ],
  },
  {
    name: "Microsoft Advertising",
    where: "Microsoft Advertising Policies",
    points: [
      "Offers Copilot-generated ad assets; editorial policies apply to all assets you approve.",
      "Political and election-related ads are not accepted.",
    ],
  },
];

export default function GovernancePage() {
  return (
    <>
      <section className="wrap pt-12 pb-10 sm:pt-16 lg:pt-20">
        <p className="eyebrow text-accent">Knowledge</p>
        <h1 className="mt-4 max-w-5xl text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
          AI in advertising, <span className="text-accent">governed.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted sm:text-xl">
          A working reference for how AI shows up in media buying, what you have to disclose, what each platform allows
          for generated creative, and the data and consent rules underneath it all.
        </p>
        <div className="mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl border-l-4 border-accent bg-accent-soft/85 backdrop-blur px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-4">
          <span className="font-display font-semibold">Last reviewed {LAST_REVIEWED}.</span>
          <span>
            This is a first-draft reference, not legal advice. Anything platform-specific is marked{" "}
            <Verify inline /> because these rules change.
          </span>
        </div>
      </section>

      <div className="wrap grid gap-10 border-t-2 border-ink pt-10 pb-20 lg:grid-cols-[15rem_1fr] lg:gap-16">
        <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-muted">On this page</p>
          <ol className="mt-3 border-t border-line">
            {SECTIONS.map((s, i) => (
              <li key={s.id} className="border-b border-line">
                <a href={`#${s.id}`} className="flex gap-3 py-2.5 font-display text-sm font-semibold hover:text-accent">
                  <span className="text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="max-w-3xl space-y-16 leading-relaxed">
          <Section n={1} id="ai-in-media-buying" title="AI in media buying">
            <p>
              AI already makes most of the moment-to-moment decisions in a modern media plan. The question for a team is
              rarely whether to use it, but which decisions you are handing over and how you will know if they go wrong.
            </p>
            <Sub title="Where it shows up">
              <ul className="list-square space-y-2 pl-5">
                <li>
                  <strong>Bidding and pacing:</strong> automated bid strategies set a price for every auction against a CPA,
                  ROAS or reach goal.
                </li>
                <li>
                  <strong>Audience modelling:</strong> lookalikes, predicted value and &ldquo;broad&rdquo; targeting let the
                  platform choose who sees the ad.
                </li>
                <li>
                  <strong>Campaign automation:</strong> all-in-one campaign types (for example Performance Max or
                  Advantage+) decide placements, audiences and creative mix together.
                </li>
                <li>
                  <strong>Creative generation:</strong> headlines, image variations, backgrounds, voice-overs and resizes
                  generated on the fly.
                </li>
                <li>
                  <strong>Measurement:</strong> modelled conversions, data-driven attribution and media mix models fill the
                  gaps left by lost signal.
                </li>
                <li>
                  <strong>Agentic buying:</strong> emerging tools that can draft plans, set up campaigns and move budget with
                  limited human review.
                </li>
              </ul>
            </Sub>
            <Sub title="Questions to ask before you hand a decision over">
              <ul className="list-square space-y-2 pl-5">
                <li>What objective is the system optimising, and does it match the business outcome you care about?</li>
                <li>Which of your data does it use, and can the vendor use that data to train models for others?</li>
                <li>What reporting do you lose? Automated campaign types often hide placement or query detail.</li>
                <li>Who reviews outputs (bids, audiences, creative) and how often, and what is the kill switch?</li>
                <li>How will you test it? Hold-outs and incrementality tests beat platform-reported lift.</li>
              </ul>
            </Sub>
          </Section>

          <Section n={2} id="disclosure" title="Disclosure norms">
            <p>
              No single rule covers every market, but the direction is consistent: tell people when AI has created or
              materially altered something that looks real, and never use it to fake evidence.
            </p>
            <Sub title="Principles that hold almost everywhere">
              <ul className="list-square space-y-2 pl-5">
                <li>
                  <strong>Realistic depictions need a label.</strong> Synthetic people, voices or events that a viewer could
                  mistake for real should be disclosed, especially in political and social-issue ads.
                </li>
                <li>
                  <strong>No fake proof.</strong> AI-generated testimonials, reviews, &ldquo;customer&rdquo; photos or
                  before-and-after images presented as genuine are deceptive advertising in most jurisdictions.
                </li>
                <li>
                  <strong>Endorsements stay real.</strong> Do not imply that a real person, creator or public figure endorses
                  you through a synthetic likeness or cloned voice without their permission.
                </li>
                <li>
                  <strong>Keep provenance metadata.</strong> Content Credentials (C2PA) are increasingly read and displayed by
                  platforms. Stripping them can look worse than keeping them.
                </li>
              </ul>
            </Sub>
            <Sub title="Regulatory anchors">
              <ul className="list-square space-y-2 pl-5">
                <li>
                  <strong>United States:</strong> the FTC treats deceptive AI claims and AI-generated fake reviews and
                  testimonials as unfair or deceptive practices. Several states have rules on synthetic media in election
                  ads. <Verify inline />
                </li>
                <li>
                  <strong>European Union:</strong> the AI Act adds transparency duties, including labelling deepfakes and
                  marking AI-generated content, phased in over several years. <Verify inline />
                </li>
                <li>
                  <strong>United Kingdom:</strong> the ASA and CAP Code apply in full to AI-generated ads. The test is
                  whether the ad misleads, not how it was made. <Verify inline />
                </li>
              </ul>
            </Sub>
          </Section>

          <Section n={3} id="platform-policy" title="Generative creative by platform">
            <p>
              A summary of how the major ad platforms treat AI-generated or AI-altered creative. Treat each card as a
              pointer to the source, not as the source.
            </p>
            <div className="mt-6 grid gap-4">
              {PLATFORMS.map((p) => (
                <section key={p.name} className="glass rounded-3xl p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">{p.name}</h3>
                    <Verify />
                  </div>
                  <ul className="list-square mt-4 space-y-2 pl-5">
                    {p.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                  <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
                    <span className="font-semibold text-ink">Check:</span> {p.where}
                  </p>
                </section>
              ))}
            </div>
          </Section>

          <Section n={4} id="data-consent" title="Data and consent basics">
            <p>
              AI systems are only as compliant as the data you feed them. These are the basics every buyer and seller
              should be fluent in.
            </p>
            <Sub title="Europe and the UK">
              <ul className="list-square space-y-2 pl-5">
                <li>
                  <strong>GDPR / UK GDPR:</strong> every use of personal data needs a lawful basis. For ad targeting and
                  measurement that is usually consent.
                </li>
                <li>
                  <strong>ePrivacy (cookie) rules:</strong> storing or reading identifiers on a device needs prior consent
                  unless strictly necessary.
                </li>
                <li>
                  <strong>IAB Europe TCF:</strong> the industry framework for passing consent signals through the
                  programmatic chain. Vendors must respect the signals they receive. <Verify inline />
                </li>
                <li>
                  <strong>Google Consent Mode:</strong> required for EEA and UK traffic if you want Google&apos;s ads
                  measurement and personalisation to keep working. <Verify inline />
                </li>
              </ul>
            </Sub>
            <Sub title="United States">
              <ul className="list-square space-y-2 pl-5">
                <li>
                  <strong>State privacy laws:</strong> California (CCPA/CPRA) and a growing list of states give people the
                  right to opt out of the &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of data for targeted ads.{" "}
                  <Verify inline />
                </li>
                <li>
                  <strong>Global Privacy Control:</strong> a browser opt-out signal that several states require businesses
                  to honour.
                </li>
                <li>
                  <strong>IAB GPP:</strong> the Global Privacy Platform carries US state and other privacy signals through the
                  ad chain.
                </li>
                <li>
                  <strong>Sensitive data:</strong> health, children&apos;s (COPPA, under 13), precise location and similar
                  categories carry stricter rules. Some, such as Washington&apos;s My Health My Data Act, reach well beyond
                  traditional healthcare. <Verify inline />
                </li>
              </ul>
            </Sub>
            <Sub title="Everywhere">
              <ul className="list-square space-y-2 pl-5">
                <li>Hashed emails and device IDs are still personal data. Hashing is not anonymisation.</li>
                <li>
                  Clean rooms reduce data exposure but don&apos;t replace consent. Check what was consented to before
                  you match.
                </li>
                <li>Uploading customer lists to train or seed AI audiences is a use of that data; your privacy notice must cover it.</li>
              </ul>
            </Sub>
          </Section>

          <Section n={5} id="checklist" title="Team checklist">
            <ol className="mt-2 divide-y divide-line border-y-2 border-ink">
              {[
                "Keep a register of every AI tool and automated campaign type in use, with an owner for each.",
                "Write down which data each tool receives and confirm your contracts and privacy notice cover that use.",
                "Require human review of generated creative for claims, likeness and brand safety before launch.",
                "Label realistic synthetic content, and always in political or social-issue ads.",
                "Never publish AI-generated reviews, testimonials or customer imagery as if they were genuine.",
                "Preserve Content Credentials on generated assets.",
                "Test automated buying against a hold-out at least once a quarter.",
                "Re-check platform policies before each major launch. They change faster than this page.",
              ].map((item, i) => (
                <li key={item} className="flex gap-4 py-3">
                  <span className="w-6 shrink-0 font-display font-semibold text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm text-muted">
              Building creative? Check sizes in the{" "}
              <Link href="/creative-studio#specs" className="font-semibold text-accent hover:text-accent-strong">
                Creative Studio specs library
              </Link>{" "}
              and preview placements in{" "}
              <Link href="/creative-studio" className="font-semibold text-accent hover:text-accent-strong">
                Creative Studio
              </Link>
              .
            </p>
          </Section>
        </article>
      </div>
    </>
  );
}

function Section({ n, id, title, children }: { n: number; id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`}>
      <p className="eyebrow text-accent">{String(n).padStart(2, "0")}</p>
      <h2 id={`${id}-h`} className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-extrabold">
        {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pt-2">
      <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.02em]">{title}</h3>
      {children}
    </div>
  );
}

function Verify({ inline = false }: { inline?: boolean }) {
  return (
    <span
      className={`rounded-full border border-accent bg-accent-soft font-semibold whitespace-nowrap text-accent-strong ${
        inline ? "mx-0.5 inline-block px-1.5 py-px align-baseline text-xs" : "inline-flex px-2 py-1 text-xs"
      }`}
    >
      Verify against current platform policy
    </span>
  );
}
