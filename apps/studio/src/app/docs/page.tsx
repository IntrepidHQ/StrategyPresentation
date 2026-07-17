// ============================================================
//  SP Docs — How Strategy Presentation works
//  apps/studio/src/app/docs/page.tsx
//
//  One long white sheet on the blueprint-blue drafting table
//  (same register as /blog): what SP is, the WCS → deck
//  pipeline, the template register, tiers, and how to get a
//  deck of your own. Server-rendered, zero client JS.
// ============================================================

import type { Metadata } from "next";
import { BlogFooter, BlogHeader } from "../blog/chrome";

const TITLE = "Docs — How Strategy Presentation works";
const DESCRIPTION =
  "How Strategy Presentation turns a WebsiteCreditScore credibility scan into a client-ready strategy deck: the webhook pipeline, the eight templates, tiers, and how to request a deck.";
const BASE = "https://www.strategypresentation.com";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/docs` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/docs`,
    siteName: "Strategy Presentation",
    type: "website",
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

// The real template register — mirrors TEMPLATE_IDS in lib/deck/deck-model.ts.
const TEMPLATES = [
  { id: "summit", name: "Summit", blurb: "Light boardroom — cream, navy, antique gold. The classic pick for conservative rooms." },
  { id: "signal", name: "Signal", blurb: "Dark modern SaaS — near-black, electric blue. The default when no template is specified." },
  { id: "editorial", name: "Editorial", blurb: "Magazine spread — stark white, didone display type." },
  { id: "monospace", name: "Monospace", blurb: "Technical — terminal grid, phosphor green. For engineering-led audiences." },
  { id: "gallery", name: "Gallery", blurb: "Airy and minimal — oversized type, terracotta accents." },
  { id: "beacon", name: "Beacon", blurb: "Warm and mission-driven — parchment, deep teal. A natural fit for the nonprofit tier." },
  { id: "voltage", name: "Voltage", blurb: "Electric blue brutalism — cream slabs, ink splashes." },
  { id: "blueprint", name: "Blueprint", blurb: "The drafting sheet — blueprint grid, white line-work. The look of this very site." },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Do I need a WebsiteCreditScore scan before I can get a deck?",
    a: "Yes — the scan is the deck's evidence base. Every slide is built from the scan's ten scored dimensions and cited sources, so there is no deck without a scan. Run one free at websitecreditscore.com; the demo on our homepage shows a clearly-labeled sample if your site hasn't been scanned yet.",
  },
  {
    q: "Where is my deck hosted?",
    a: "Each client deck is published at its own subdomain — {clientslug}.strategypresentation.com — as a single self-contained HTML file: no external requests, no tracking, no login. You can also download it and present offline or email it as a file.",
  },
  {
    q: "What happens if the same scan is sent twice?",
    a: "Nothing bad — deck creation is idempotent by client slug. If a strategy already exists for that slug, the pipeline returns the existing deck instead of creating a duplicate, so retries and re-fired webhooks are safe.",
  },
  {
    q: "How is the webhook secured?",
    a: "Every payload from WebsiteCreditScore is signed with HMAC SHA-256 over the raw body, delivered in the X-WCS-Signature header alongside an X-WCS-Timestamp. Signatures are verified against a shared secret, and payloads older than five minutes are rejected to block replays.",
  },
  {
    q: "What's the difference between the standard and nonprofit tiers?",
    a: "Both tiers get the same scan-to-deck pipeline and template register. The tier shapes the engagement catalog behind the deck's build sheet — the nonprofit tier unlocks nonprofit-only line items like grant research and drafting, and frames the argument for boards and donors rather than commercial growth.",
  },
  {
    q: "Are the decks accessible?",
    a: "Yes. Every template ships WCAG 2.1 AA: audited color contrast, full keyboard navigation, screen-reader-friendly structure, and all motion disabled under prefers-reduced-motion. Templates are tested with axe on every change.",
  },
];

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/docs`,
    publisher: { "@type": "Organization", name: "Strategy Presentation", url: `${BASE}/` },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Docs", item: `${BASE}/docs` },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function DocsPage() {
  return (
    <div className="bp">
      {JSON_LD.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      <a className="bp-skip" href="#main">Skip to content</a>
      <BlogHeader current="docs" />

      <main id="main" className="bp-main bp-main-article">
        <nav aria-label="Breadcrumb" className="bp-crumbs">
          <a href="/home">Home</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Docs</span>
        </nav>

        <header className="bp-hero">
          <p className="bp-eyebrow">Documentation · strategypresentation.com</p>
          <h1>How it works.</h1>
          <p className="bp-lede">
            From a credibility scan to a client-ready strategy deck — the whole pipeline, on one sheet.
          </p>
        </header>

        <article className="bp-sheet">
          <div className="bp-answer">
            <p className="bp-answer-label">In one paragraph</p>
            <p>
              Strategy Presentation turns a <strong>WebsiteCreditScore</strong> credibility scan into an
              evidence-backed, client-ready strategy presentation deck — automatically built, styled in
              one of eight templates, and hosted at its own subdomain:{" "}
              <code>{"{clientslug}"}.strategypresentation.com</code>. Nothing on a slide is invented;
              every claim traces back to the scan&apos;s cited sources.
            </p>
          </div>

          <div className="bp-body">
            <h2>What Strategy Presentation is</h2>
            <p>
              Every deck starts as a{" "}
              <a href="https://www.websitecreditscore.com" rel="noopener" target="_blank">WebsiteCreditScore</a>{" "}
              scan: an AI research agent reads a website&apos;s public record — legitimacy, reputation,
              design, UX, technical health — and grades ten weighted dimensions with cited sources.
              Strategy Presentation is the presentation layer on top of that research: it converts the
              scan into a boardroom-grade pitch deck that shows a business exactly where it stands,
              what needs fixing, and what fixing it is worth.
            </p>
            <p>
              The output is one self-contained HTML file per client — responsive, WCAG 2.1 AA
              accessible, presentable offline, and auto-hosted at{" "}
              <code>{"{clientslug}"}.strategypresentation.com</code>.
            </p>

            <h2>The pipeline</h2>
            <ol>
              <li>
                <strong>A WCS scan completes.</strong>{" "}WebsiteCreditScore finishes grading a site&apos;s
                ten dimensions and assembles the report: overall score and grade, red and green flags,
                and a minimum of twelve cited sources.
              </li>
              <li>
                <strong>WCS fires a signed webhook.</strong> The report is POSTed to SP Studio signed
                with <strong>HMAC SHA-256</strong> over the raw body. The signature travels in the{" "}
                <code>X-WCS-Signature</code> header with an <code>X-WCS-Timestamp</code>; anything
                outside a <strong>±5 minute</strong> window is rejected as a replay.
              </li>
              <li>
                <strong>SP Studio builds the deck.</strong> The payload — report, client name, client
                slug, tier, and optional template — is validated, and the studio assembles the deck
                model: narrative, evidence slides, and the engagement build sheet.
              </li>
              <li>
                <strong>Delivery is idempotent by client slug.</strong>{" "}If a deck already exists for
                the slug, the pipeline returns it rather than creating a duplicate — webhook retries
                are always safe. The finished deck publishes to the client&apos;s subdomain.
              </li>
            </ol>

            <h2>The template register</h2>
            <p>
              Eight looks, one argument. Every template renders the same evidence-backed deck model,
              so switching styles never changes the substance. Preview them all live on the{" "}
              <a href="/home#templates">landing page gallery</a> — the previews are real decks, not
              pictures.
            </p>
            <ul>
              {TEMPLATES.map((t) => (
                <li key={t.id}>
                  <strong>{t.name}</strong> (<code>{t.id}</code>) — {t.blurb}
                </li>
              ))}
            </ul>

            <h2>Tiers</h2>
            <p>
              Every deck is created under one of two tiers, set by the webhook payload:
            </p>
            <ul>
              <li>
                <strong>Standard</strong> — for commercial businesses. The deck frames the scan as a
                growth argument: where credibility is leaking revenue, and what the fix is worth.
              </li>
              <li>
                <strong>Nonprofit</strong> — for mission-driven organizations. Same pipeline and
                evidence, but the build sheet unlocks nonprofit-only work (grant research and
                drafting, for one) and the argument speaks to boards, donors, and grant-readiness
                instead of commercial growth.
              </li>
            </ul>

            <h2>See it, or get one</h2>
            <p>
              The fastest way to understand the product is the{" "}
              <a href="/home#demo">live demo</a>: paste a URL and watch an evidence-backed pitch
              assemble. If we&apos;ve scanned the site you get a real deck from real data; otherwise a
              clearly-labeled sample. Free, no signup.
            </p>
            <p>To request a deck of your own:</p>
            <ul>
              <li>
                <strong>Run a scan</strong> at{" "}
                <a href="https://www.websitecreditscore.com" rel="noopener" target="_blank">websitecreditscore.com</a>{" "}
                — a completed scan feeds the pipeline directly.
              </li>
              <li>
                <strong>Or email us</strong> at{" "}
                <a href="mailto:seekercray@gmail.com">seekercray@gmail.com</a> with your website and
                we&apos;ll take it from there.
              </li>
            </ul>
          </div>

          <section className="bp-faq" aria-labelledby="docs-faq-h">
            <h2 id="docs-faq-h">Frequently asked questions</h2>
            {FAQ.map((f) => (
              <div className="bp-faq-item" key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>

          <aside className="bp-article-cta" aria-label="Try the live demo">
            <div>
              <p className="bp-article-cta-title">See your own deck.</p>
              <p>Paste a URL and watch an evidence-backed pitch assemble from your public record. Free, no signup.</p>
            </div>
            <a className="bp-btn" href="/home#demo">Open the live demo</a>
          </aside>
        </article>

        <BlogFooter />
      </main>
    </div>
  );
}
