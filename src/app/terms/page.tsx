import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage, List, Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The rules for using thedigitalwit, its calculators, generators and AI features.",
};

const UPDATED = "1 November 2026";

const SECTIONS = [
  { id: "agreement", label: "Agreeing to these terms" },
  { id: "service", label: "The service" },
  { id: "not-advice", label: "Estimates, not advice" },
  { id: "account", label: "Your account" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "your-content", label: "Your content and outputs" },
  { id: "ai", label: "AI features" },
  { id: "third-party", label: "Third-party data and names" },
  { id: "ours", label: "Our content" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "liability", label: "Limitation of liability" },
  { id: "ending", label: "Suspension and ending" },
  { id: "changes", label: "Changes to these terms" },
  { id: "law", label: "Governing law" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={
        <>
          Terms of <span className="text-accent">use.</span>
        </>
      }
      intro="The rules for using thedigitalwit. They're short, but they matter: the tools give estimates, and you decide what to do with them."
      updated={UPDATED}
      sections={SECTIONS}
    >
      <Section n={1} id="agreement" title="Agreeing to these terms">
        <p>
          These terms are an agreement between you and thedigitalwit (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the site
          you agree to them. If you use it for a company, you confirm you may accept them on its behalf. Our{" "}
          <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link> explains how we handle personal
          data.
        </p>
      </Section>

      <Section n={2} id="service" title="The service">
        <p>
          thedigitalwit is a free reference hub of calculators, generators, benchmarks and guides for digital advertising.
          We may add, change, limit or remove features at any time, and we don&apos;t promise the site will always be
          available or error-free.
        </p>
      </Section>

      <Section n={3} id="not-advice" title="Estimates, not advice">
        <p>
          Everything on the site is general information to help you think, not professional, financial or legal advice.
        </p>
        <List>
          <li>
            Calculator results, media plans, GTM strategies, media mix models and DoohSight measurements are estimates based
            on what you enter and on assumptions that may not fit your situation.
          </li>
          <li>
            Benchmarks and default values are illustrative starting points, not verified industry data for your market.
            Replace them with your own numbers wherever you can.
          </li>
          <li>
            Ad format specifications and platform policies change often. Check them against the platform&apos;s current
            documentation before you produce or buy media.
          </li>
          <li>The Governance page is a reference, not legal advice. Take legal advice for decisions that need it.</li>
        </List>
        <p>You&apos;re responsible for any decision you make, and any money you spend, based on the site.</p>
      </Section>

      <Section n={4} id="account" title="Your account">
        <p>
          You don&apos;t need an account to use the tools; it only lets you save items. To create one you must be 18 or
          older and use an email address you control. Keep access to that email and your Google or Microsoft account
          secure, since anyone with it can sign in as you. You can delete your saved items at any time and ask us to delete
          your account.
        </p>
      </Section>

      <Section n={5} id="acceptable-use" title="Acceptable use">
        <p>Please don&apos;t:</p>
        <List>
          <li>use the site to break any law, or to infringe anyone else&apos;s rights;</li>
          <li>
            send automated or bulk requests, scrape the site, or try to get around rate limits, especially on the AI and
            lookup features;
          </li>
          <li>try to break, overload or probe the security of the site, or access other people&apos;s accounts or data;</li>
          <li>use the AI box to submit harmful content, or to get the AI to do anything other than fill in the form;</li>
          <li>upload creative you don&apos;t have the right to use, or enter other people&apos;s personal data without a lawful basis;</li>
          <li>resell, frame or present the site or its content as your own service.</li>
        </List>
      </Section>

      <Section n={6} id="your-content" title="Your content and outputs">
        <p>
          You own what you put in, such as numbers, descriptions and creative files, and you own the outputs you create:
          plans, reports, exports and saved items. You&apos;re free to use outputs in your own work, including commercially.
          You give us permission only to store and process your content as needed to run the features you use, for example
          keeping a saved item so you can open it later.
        </p>
      </Section>

      <Section n={7} id="ai" title="AI features">
        <p>
          The &ldquo;Describe your case&rdquo; boxes use a third-party AI service to turn your description into form values.
          AI can misread or invent details, so check every value it fills in before relying on the result. Don&apos;t enter
          confidential information or personal data about other people. When the AI isn&apos;t available, a simpler
          built-in reader is used instead.
        </p>
      </Section>

      <Section n={8} id="third-party" title="Third-party data and names">
        <p>
          Some tools show data from public third-party sources, such as Google Trends, news feeds, Reddit, Bluesky, Hacker
          News, GDELT and Wikidata. We don&apos;t control that data and can&apos;t guarantee it is accurate, complete or
          current, and those sources&apos; own terms apply to it. Links to other websites are for convenience; we&apos;re not
          responsible for their content.
        </p>
        <p>
          Platform and company names, such as Google, Meta, TikTok or Amazon, are trademarks of their owners and are used
          only to describe formats and policies. thedigitalwit isn&apos;t affiliated with or endorsed by them.
        </p>
      </Section>

      <Section n={9} id="ours" title="Our content">
        <p>
          The site&apos;s design, code, text, guides and graphics belong to thedigitalwit or its licensors. You may use the
          tools and share links to the site, but please don&apos;t copy substantial parts of the site or its content for
          another product or publication without permission.
        </p>
      </Section>

      <Section n={10} id="disclaimer" title="Disclaimer">
        <p>
          The site is provided free, &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the extent the law allows, we
          make no promises about it, express or implied, including that it is accurate, fit for a particular purpose,
          uninterrupted or free of errors or harmful components.
        </p>
      </Section>

      <Section n={11} id="liability" title="Limitation of liability">
        <p>
          To the extent the law allows, thedigitalwit isn&apos;t liable for any indirect or consequential loss, or for lost
          profits, revenue, ad spend, data or business opportunity, arising from your use of the site or reliance on its
          results. Our total liability for any claim relating to the site is limited to USD 100.
        </p>
        <p>
          Nothing in these terms limits liability that can&apos;t be limited by law, such as for fraud, or takes away rights
          you have as a consumer under the laws of the country where you live.
        </p>
      </Section>

      <Section n={12} id="ending" title="Suspension and ending">
        <p>
          You can stop using the site at any time. We may suspend or close an account, or block access, if these terms are
          broken or to protect the site and its users. Sections 6 and 9 to 14 continue to apply after use ends.
        </p>
      </Section>

      <Section n={13} id="changes" title="Changes to these terms">
        <p>
          We may update these terms as the site changes. We&apos;ll update the date above and, for significant changes,
          give notice on the site or by email to account holders before they take effect. Continuing to use the site after
          that means you accept the updated terms.
        </p>
      </Section>

      <Section n={14} id="law" title="Governing law">
        <p>
          These terms are governed by the laws of the United Arab Emirates, and the courts of the United Arab Emirates have
          jurisdiction over disputes. If you&apos;re a consumer, you also keep the protection of the mandatory laws of the
          country where you live, and may bring a claim in its courts. If any part of these terms can&apos;t be enforced, the
          rest still applies.
        </p>
      </Section>

      <Section n={15} id="contact" title="Contact">
        <p>
          Questions about these terms, or a problem with the site? Email <ContactEmail />.
        </p>
      </Section>
    </LegalPage>
  );
}
