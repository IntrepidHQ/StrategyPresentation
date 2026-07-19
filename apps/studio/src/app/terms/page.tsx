// ============================================================
//  SP Terms of Service — apps/studio/src/app/terms/page.tsx
//  One blueprint sheet, same register as /docs. Server-rendered.
//  Baseline terms — have counsel review before relying on them.
// ============================================================

import type { Metadata } from "next";
import { BlogFooter, BlogHeader } from "../blog/chrome";

const TITLE = "Terms of Service — Strategy Presentation";
const DESCRIPTION =
  "The terms for using Strategy Presentation: what the service does, acceptable use, payment, intellectual property, disclaimers, and liability.";
const BASE = "https://www.strategypresentation.com";
const UPDATED = "January 2026";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/terms` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}/terms`, siteName: "Strategy Presentation", type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function TermsPage() {
  return (
    <div className="bp">
      <a className="bp-skip" href="#main">Skip to content</a>
      <BlogHeader />

      <main id="main" className="bp-main bp-main-article">
        <nav aria-label="Breadcrumb" className="bp-crumbs">
          <a href="/home">Home</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Terms</span>
        </nav>

        <header className="bp-hero">
          <p className="bp-eyebrow">Terms · strategypresentation.com</p>
          <h1>Terms of Service</h1>
          <p className="bp-lede">Last updated {UPDATED}. The agreement between you and Strategy Presentation.</p>
        </header>

        <article className="bp-sheet">
          <div className="bp-body">
            <h2>Acceptance</h2>
            <p>
              By using strategypresentation.com or any deck we host for you, you agree to these terms. If you use
              the service for an organization, you confirm you are authorized to accept on its behalf.
            </p>

            <h2>What the service does</h2>
            <p>
              Strategy Presentation converts a{" "}
              <a href="https://www.websitecreditscore.com" rel="noopener" target="_blank">WebsiteCreditScore</a>{" "}
              credibility scan into a strategy presentation deck. Decks are assembled with AI from the scan&apos;s
              cited sources. They are decision-support materials, not professional, legal, or financial advice —
              verify anything material before acting on it.
            </p>

            <h2>Acceptable use</h2>
            <p>
              Don&apos;t use the service to break the law, infringe others&apos; rights, submit sites you have no
              legitimate reason to analyze, attempt to disrupt or reverse-engineer the service, or resell it
              except under a partner arrangement agreed with us.
            </p>

            <h2>Payment</h2>
            <p>
              Paid tiers are billed through Stripe at the price shown when you order. Unless stated otherwise or
              required by law, fees are for work performed. For billing questions or refund requests, contact{" "}
              <a href="mailto:seekercray@gmail.com">seekercray@gmail.com</a>.
            </p>

            <h2>Intellectual property</h2>
            <p>
              You own your business inputs and the deck output produced for you. We retain ownership of the
              platform, templates, and underlying software. Third-party assets (e.g. fonts, sample models) remain
              under their own licenses, credited where used.
            </p>

            <h2>Disclaimers &amp; liability</h2>
            <p>
              The service is provided &quot;as is,&quot; without warranties of any kind. To the fullest extent
              permitted by law, Strategy Presentation is not liable for indirect or consequential damages, and our
              total liability for any claim is limited to the amount you paid us for the deck at issue.
            </p>

            <h2>Changes</h2>
            <p>We may update these terms; continued use after changes means you accept them. The &quot;last updated&quot; date above reflects the current version.</p>

            <h2>Contact</h2>
            <p>Questions about these terms: <a href="mailto:seekercray@gmail.com">seekercray@gmail.com</a>.</p>
          </div>
        </article>

        <BlogFooter />
      </main>
    </div>
  );
}
