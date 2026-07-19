// ============================================================
//  SP Privacy Policy — apps/studio/src/app/privacy/page.tsx
//  One blueprint sheet, same register as /docs. Server-rendered.
//  Baseline policy — have counsel review before relying on it.
// ============================================================

import type { Metadata } from "next";
import { BlogFooter, BlogHeader } from "../blog/chrome";

const TITLE = "Privacy Policy — Strategy Presentation";
const DESCRIPTION =
  "How Strategy Presentation collects, uses, and protects information: scan inputs, account and payment data, third-party processors, retention, and your choices.";
const BASE = "https://www.strategypresentation.com";
const UPDATED = "January 2026";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/privacy` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}/privacy`, siteName: "Strategy Presentation", type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function PrivacyPage() {
  return (
    <div className="bp">
      <a className="bp-skip" href="#main">Skip to content</a>
      <BlogHeader />

      <main id="main" className="bp-main bp-main-article">
        <nav aria-label="Breadcrumb" className="bp-crumbs">
          <a href="/home">Home</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Privacy</span>
        </nav>

        <header className="bp-hero">
          <p className="bp-eyebrow">Privacy · strategypresentation.com</p>
          <h1>Privacy Policy</h1>
          <p className="bp-lede">Last updated {UPDATED}. What we collect, why, and the choices you have.</p>
        </header>

        <article className="bp-sheet">
          <div className="bp-body">
            <h2>Who we are</h2>
            <p>
              Strategy Presentation (&quot;SP&quot;, &quot;we&quot;) turns a{" "}
              <a href="https://www.websitecreditscore.com" rel="noopener" target="_blank">WebsiteCreditScore</a>{" "}
              credibility scan into a client-ready strategy deck. This policy covers strategypresentation.com and
              its deck subdomains. Questions: <a href="mailto:seekercray@gmail.com">seekercray@gmail.com</a>.
            </p>

            <h2>What we collect</h2>
            <p>
              <strong>Scan inputs</strong> — the public website URL you (or a partner) submit, and the public
              information our research reads from it. <strong>Account &amp; contact data</strong> — name and email
              when you request a deck or sign in. <strong>Payment data</strong> — processed by Stripe; we never
              see or store full card numbers. <strong>Usage data</strong> — standard server and analytics logs
              (pages viewed, approximate region, device) to keep the service reliable.
            </p>

            <h2>How we use it</h2>
            <p>
              To generate and host your deck, operate and secure the service, process payments, respond to you,
              and improve the product. We do not sell your personal information.
            </p>

            <h2>Third parties we rely on</h2>
            <p>
              We share the minimum necessary with processors that run the service: hosting and delivery (Vercel),
              payments (Stripe), the credibility scan (WebsiteCreditScore), and AI providers used to draft deck
              content. Each acts under its own terms and security controls.
            </p>

            <h2>Retention</h2>
            <p>
              We keep account, deck, and scan data for as long as your deck is active or as needed for legal and
              operational purposes, then delete or anonymize it. You can ask us to delete your data at any time.
            </p>

            <h2>Your choices</h2>
            <p>
              Email <a href="mailto:seekercray@gmail.com">seekercray@gmail.com</a> to access, correct, export, or
              delete your information, or to opt out of non-essential communications. Depending on where you live,
              you may have additional rights under laws such as the GDPR or CCPA; we honor those requests.
            </p>

            <h2>Changes</h2>
            <p>We may update this policy; material changes will be reflected by the &quot;last updated&quot; date above.</p>
          </div>
        </article>

        <BlogFooter />
      </main>
    </div>
  );
}
