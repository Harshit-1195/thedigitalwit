import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage, List, Section, Sub } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/privacy", {
  title: "Privacy policy",
  description: "What data thedigitalwit collects, why, who processes it, how long it is kept, and your rights wherever you live.",
});

const UPDATED = "1 November 2026";

const SECTIONS = [
  { id: "summary", label: "The short version" },
  { id: "who", label: "Who we are" },
  { id: "collect", label: "What we collect" },
  { id: "storage", label: "Cookies and browser storage" },
  { id: "use", label: "How and why we use it" },
  { id: "providers", label: "Who processes it" },
  { id: "transfers", label: "International transfers" },
  { id: "retention", label: "How long we keep it" },
  { id: "rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "security", label: "Security" },
  { id: "changes", label: "Changes to this policy" },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={
        <>
          Privacy, <span className="text-accent">plainly.</span>
        </>
      }
      intro="What thedigitalwit collects, why, who else handles it, and how to see or delete it. It applies to visitors everywhere."
      updated={UPDATED}
      sections={SECTIONS}
    >
      <Section n={1} id="summary" title="The short version">
        <List>
          <li>Every tool works without an account. If you don&apos;t sign in, we don&apos;t keep any personal data about you.</li>
          <li>If you sign in, we keep your email address and the items you choose to save, so you can open them again.</li>
          <li>
            Files and data you load into Creative Studio, the Media Mix Model and the calculators stay in your browser. They
            are not uploaded.
          </li>
          <li>
            Text you type into a &ldquo;Describe your case&rdquo; box is sent to our AI provider to fill in the form. Search
            terms in Contextual Signal and DoohSight are sent to public data sources.
          </li>
          <li>No advertising or analytics trackers, no selling of data, and no sharing it for ads.</li>
        </List>
      </Section>

      <Section n={2} id="who" title="Who we are">
        <p>
          thedigitalwit (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs this website and is responsible for your personal data
          as the controller (in India, the data fiduciary). For anything about privacy, including requests to use the
          rights below, email <ContactEmail />.
        </p>
      </Section>

      <Section n={3} id="collect" title="What we collect">
        <Sub title="When you browse without an account">
          <p>
            Our hosting provider records standard request logs, such as IP address, browser type, the page requested and the
            time, to deliver the site and protect it from abuse. Our servers also hold your IP address in memory for about a
            minute to limit how often the AI and data-lookup features can be called. It is not written to a database.
          </p>
        </Sub>
        <Sub title="When you create an account">
          <List>
            <li>
              <strong>Your email address</strong>, and an account ID created by our sign-in provider.
            </li>
            <li>
              <strong>If you sign in with Google or Microsoft:</strong> the basic profile those services share, typically
              your name, email address and profile picture. We never see your Google or Microsoft password.
            </li>
            <li>
              <strong>Items you save:</strong> calculator scenarios, media plans and GTM plans, including their title, the
              page they came from and the values you entered.
            </li>
          </List>
        </Sub>
        <Sub title="When you use the AI box">
          <p>
            The text you type into a &ldquo;Describe your case&rdquo; box is sent through our server to Anthropic, which
            reads it and returns form values. We don&apos;t store that text. Please don&apos;t include personal or
            confidential information about other people.
          </p>
        </Sub>
        <Sub title="When you look up a topic or market">
          <p>
            Search terms you enter in Contextual Signal and DoohSight are sent from our server to public sources: Google
            Trends, Google News and suggestions, Bing News, Reddit, Bluesky, Hacker News, GDELT and Wikidata. They receive the
            search term, not your IP address or account. Results are cached in server memory for a short time.
          </p>
        </Sub>
        <Sub title="What stays on your device">
          <p>
            Creative files you preview, spreadsheets or pasted data in the Media Mix Model, and numbers you type into the
            calculators are processed in your browser. We don&apos;t receive them unless you choose to save an item while
            signed in.
          </p>
        </Sub>
      </Section>

      <Section n={4} id="storage" title="Cookies and browser storage">
        <p>
          We use only storage that is needed for the site to work or that you would expect it to remember. We set no
          advertising, analytics or cross-site tracking cookies, so there is nothing to opt in to.
        </p>
        <List>
          <li>
            <strong>Sign-in cookies</strong> (names starting <code>sb-</code>), set only when you sign in, to keep you signed
            in.
          </li>
          <li>
            <strong>Browser storage</strong> for conveniences: tool settings and drafts (for example DoohSight and Media Mix
            Model keys starting <code>doohsight-</code> or <code>mmm-</code>), the last email you used to sign in, an
            unsaved item kept while you sign in, and whether you&apos;ve closed the privacy notice (keys starting{" "}
            <code>tdw:</code>).
          </li>
        </List>
        <p>
          Browser storage never leaves your device. Clear it at any time in your browser settings; the site still works, it
          just forgets your settings.
        </p>
      </Section>

      <Section n={5} id="use" title="How and why we use it">
        <p>We use personal data only for these purposes, and never to build advertising profiles.</p>
        <List>
          <li>
            <strong>To run your account and saved items</strong>, because you asked us to (performance of a contract).
          </li>
          <li>
            <strong>To provide the AI and lookup features</strong> when you use them (performance of a contract, or our
            legitimate interest in providing the features you request).
          </li>
          <li>
            <strong>To keep the site secure and available</strong>, including rate limits and abuse prevention (legitimate
            interests).
          </li>
          <li>
            <strong>To reply when you contact us</strong>, and to meet legal obligations.
          </li>
        </List>
        <p>
          Where a law relies on consent instead, such as India&apos;s Digital Personal Data Protection Act, you give it by
          creating an account or using a feature, and you can withdraw it at any time by deleting your account or emailing
          us.
        </p>
      </Section>

      <Section n={6} id="providers" title="Who processes it">
        <p>
          We use a small number of service providers who process data on our behalf, under their own security and data
          protection terms. We don&apos;t sell personal data or share it for cross-context behavioural advertising.
        </p>
        <List>
          <li>
            <strong>Vercel</strong>: website hosting and request logs.
          </li>
          <li>
            <strong>Supabase</strong>: sign-in, sign-in emails and the database for saved items.
          </li>
          <li>
            <strong>Anthropic</strong>: reads &ldquo;Describe your case&rdquo; text. Under its commercial terms, Anthropic
            doesn&apos;t use API inputs to train its models by default and keeps them only for a limited period.
          </li>
          <li>
            <strong>Google or Microsoft</strong>: only if you choose to sign in with them.
          </li>
          <li>
            <strong>The public data sources</strong> listed above, which receive search terms only.
          </li>
        </List>
        <p>We may also disclose data if the law requires it, or to protect the rights and safety of users or the site.</p>
      </Section>

      <Section n={7} id="transfers" title="International transfers">
        <p>
          Our providers may process data in the United States and other countries outside the one you live in. Where data
          leaves the EU, UK or another region with transfer rules, we rely on the safeguards our providers offer, such as
          the European Commission&apos;s Standard Contractual Clauses, the UK addendum or adequacy decisions.
        </p>
      </Section>

      <Section n={8} id="retention" title="How long we keep it">
        <List>
          <li>
            <strong>Account and saved items:</strong> until you delete them or ask us to delete your account. You can delete
            saved items yourself from <Link href="/saved" className="underline underline-offset-4">My saved items</Link>.
          </li>
          <li>
            <strong>Request logs:</strong> for the short period set by our hosting provider, usually days to a few weeks.
          </li>
          <li>
            <strong>AI box text and search terms:</strong> not stored by us. Server memory caches clear within minutes or
            hours.
          </li>
          <li>
            <strong>Emails to us:</strong> as long as needed to deal with your message, and any legal follow-up.
          </li>
        </List>
      </Section>

      <Section n={9} id="rights" title="Your rights">
        <p>
          Wherever you live, you can ask us to show you, correct or delete the personal data we hold about you, including
          deleting your whole account. Email <ContactEmail /> from the address on your account. We may ask you to confirm
          it&apos;s you, and we&apos;ll reply within 30 days, or sooner if your local law requires it. Using these rights is
          free.
        </p>
        <Sub title="European Union and United Kingdom (GDPR, UK GDPR)">
          <p>
            You can also restrict or object to our processing, receive your data in a portable format, and withdraw consent
            where we rely on it. You may complain to your local data protection authority; in the UK that is the
            Information Commissioner&apos;s Office (ICO).
          </p>
        </Sub>
        <Sub title="United States (California and other state laws)">
          <p>
            You have the right to know what we collect, and to delete or correct it, without discrimination for using these
            rights. We don&apos;t sell or share personal data and don&apos;t use sensitive personal data, so there is
            nothing to opt out of; we treat Global Privacy Control signals as an opt-out anyway. You may use an authorised
            agent.
          </p>
        </Sub>
        <Sub title="India (Digital Personal Data Protection Act 2023)">
          <p>
            You can access a summary of your data, correct, complete or erase it, withdraw consent and nominate someone to
            act for you. Email us to raise a grievance; if you&apos;re not satisfied with our response, you may approach the
            Data Protection Board of India.
          </p>
        </Sub>
        <Sub title="United Arab Emirates (Federal Decree-Law No. 45 of 2021)">
          <p>
            You can request information about and a copy of your data, correct or erase it, and restrict or object to its
            processing. You may complain to the UAE Data Office.
          </p>
        </Sub>
        <Sub title="Everywhere else">
          <p>
            We&apos;ll honour any equivalent rights your local law gives you. Email us and tell us where you&apos;re based.
          </p>
        </Sub>
      </Section>

      <Section n={10} id="children" title="Children">
        <p>
          thedigitalwit is a professional reference for advertising work. It isn&apos;t aimed at children, and you must be
          18 or older to create an account. If you believe a child has created an account, email us and we&apos;ll delete
          it.
        </p>
      </Section>

      <Section n={11} id="security" title="Security">
        <p>
          The site is served over HTTPS. Saved items are protected in the database so each account can read only its own
          items, and sign-in uses one-time email codes or Google and Microsoft, so we never hold passwords. No system is
          perfectly secure; if we learn of a breach that affects you, we&apos;ll tell you and the relevant authorities as
          the law requires.
        </p>
      </Section>

      <Section n={12} id="changes" title="Changes to this policy">
        <p>
          If we change how we handle data, we&apos;ll update this page and its date. For significant changes, such as a new
          kind of data or a new purpose, we&apos;ll also give notice on the site, or by email if you have an account, before
          the change takes effect. See also our <Link href="/terms" className="underline underline-offset-4">terms of use</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
