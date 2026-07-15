// ============================================================
//  SP Landing — strategypresentation.com
//  apps/studio/src/app/home/page.tsx
//
//  Public product landing page (served at "/" on marketing
//  hosts via the proxy rewrite; reachable at /home everywhere).
// ============================================================

import DemoWidget from "./DemoWidget";

const TEMPLATES = [
  { id: "summit", name: "Summit", blurb: "Light boardroom — cream, navy, antique gold." },
  { id: "signal", name: "Signal", blurb: "Dark modern SaaS — near-black, electric blue." },
  { id: "editorial", name: "Editorial", blurb: "Magazine spread — stark white, didone display." },
  { id: "monospace", name: "Monospace", blurb: "Technical — terminal grid, phosphor green." },
  { id: "gallery", name: "Gallery", blurb: "Airy and minimal — oversized type, terracotta." },
  { id: "beacon", name: "Beacon", blurb: "Warm and mission-driven — parchment, deep teal." },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Where does the deck's data come from?",
    a: "Every deck is built from a WebsiteCreditScore scan: an AI research agent that reads the public record — your site, reviews, press, registries, technical signals — and scores ten weighted dimensions with cited sources. Nothing is invented; if we don't have a real scan, we say so and show you a clearly-labeled sample instead.",
  },
  {
    q: "Are the decks really accessible?",
    a: "Yes — every template ships WCAG 2.1 AA: audited color contrast, full keyboard navigation, screen-reader-friendly structure, text alternatives for every chart, and all motion disabled when your system asks for reduced motion. We test each template with axe on every change.",
  },
  {
    q: "Can I present offline, or send it as a file?",
    a: "Each deck is one self-contained HTML file with zero external requests — it works from a laptop with no internet, embeds nowhere-to-leak, and prints cleanly to PDF straight from the browser.",
  },
  {
    q: "What does it cost?",
    a: "Previewing your deck is free. The full engagement — your own Brainztem instance with the automations on the deck's build sheet — is $10,500, paid across four delivery milestones. You only ever pay behind delivered work.",
  },
  {
    q: "I'm pitching internally, not raising. Is this for me?",
    a: "That's half of why it exists. Walking into a budget meeting with a scored, sourced, third-party view of the problem — plus a costed plan — is the difference between an opinion and a case.",
  },
  {
    q: "Can it match my brand?",
    a: "The six house templates are tuned for contrast and credibility out of the box. Full re-branding (your fonts, colors, and voice, with quarterly regeneration) ships with Strategy Presentation Pro as part of the engagement.",
  },
];

// Structured data for AEO/LLM-citation visibility: the product as a
// SoftwareApplication (with the free-trial offer) and the on-page FAQ.
const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Strategy Presentation",
    description:
      "Turns a WebsiteCreditScore credibility scan into an evidence-backed, WCAG-AA-accessible pitch deck in six templates.",
    url: "https://www.strategypresentation.com/",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD", description: "Free demo deck from a live scan" },
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

export default function LandingPage() {
  return (
    <div className="lp">
      {JSON_LD.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      <a className="lp-skip" href="#main">
        Skip to content
      </a>

      <div className="lp-wrap">
        <header className="lp-header">
          <a className="lp-mark" href="/home">
            Strategy<span>Presentation</span>
          </a>
          <nav aria-label="Site" className="lp-nav">
            <a href="#demo">See it in action</a>
            <a href="#templates">Templates</a>
            <a href="#audiences">Who it&apos;s for</a>
            <a href="#faq">FAQ</a>
          </nav>
        </header>
      </div>

      <main id="main">
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow">Pitch decks with receipts</p>
              <h1>
                Turn any website into a <span className="lp-gold-i">boardroom-ready</span> pitch deck.
              </h1>
              <p className="lp-sub">
                SP reads the public record — credibility, reputation, design, technical health — and
                builds an evidence-backed presentation in six polished styles. Every claim sourced.
                Every chart accessible. Ready in minutes.
              </p>
              <DemoWidget />
            </div>

            {/* Decorative — real proof, not illustration: our own six deck covers,
                scattered and blurred behind one sharp anchor, so the hero shows the
                product instead of just claiming it. Purely atmospheric; the same
                thumbnails are presented properly (with alt text) in #templates below. */}
            <div className="lp-hero-art" aria-hidden="true">
              <img className="lp-hero-art-bg lp-hero-art-1" src="/templates/summit.png" alt="" />
              <img className="lp-hero-art-bg lp-hero-art-2" src="/templates/editorial.png" alt="" />
              <img className="lp-hero-art-bg lp-hero-art-3" src="/templates/gallery.png" alt="" />
              <img className="lp-hero-art-bg lp-hero-art-4" src="/templates/beacon.png" alt="" />
              <img className="lp-hero-art-bg lp-hero-art-5" src="/templates/monospace.png" alt="" />
              <div className="lp-hero-art-sharp">
                <div className="lp-hero-chrome">
                  <span /><span /><span />
                </div>
                <img src="/templates/signal.png" alt="" />
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="how-h">
          <div className="lp-wrap">
            <p className="lp-eyebrow">How it works</p>
            <h2 id="how-h">Scan. Deck. Decide.</h2>
            <div className="lp-grid-3">
              <div className="lp-card">
                <p className="lp-step-num" aria-hidden="true">1</p>
                <h3>Scan the public record</h3>
                <p className="lp-muted">
                  A WebsiteCreditScore scan grades ten weighted dimensions — legitimacy, reputation,
                  design, UX, transparency and more — with every finding cited to a source.
                </p>
              </div>
              <div className="lp-card">
                <p className="lp-step-num" aria-hidden="true">2</p>
                <h3>Get the deck, six ways</h3>
                <p className="lp-muted">
                  The same evidence renders into six presentation styles — from conservative
                  boardroom to dark SaaS — each responsive, keyboard-navigable, WCAG 2.1 AA.
                </p>
              </div>
              <div className="lp-card">
                <p className="lp-step-num" aria-hidden="true">3</p>
                <h3>Present a plan, not a report</h3>
                <p className="lp-muted">
                  Every deck ends with a costed build sheet and a route to a 90+ score — the
                  difference between &quot;interesting analysis&quot; and a decision your audience
                  can act on.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="tpl-h" id="templates">
          <div className="lp-wrap">
            <p className="lp-eyebrow">Templates</p>
            <h2 id="tpl-h">Six styles. One standard.</h2>
            <p className="lp-sub">
              Responsive, ADA-compliant, single-file. Flip your deck between any of them with one
              click — the evidence stays, the voice changes.
            </p>
            <div className="lp-grid-3">
              {TEMPLATES.map((t) => (
                <figure className="lp-tcard" key={t.id} style={{ margin: 0 }}>
                  <img
                    alt={`${t.name} template cover — sample deck`}
                    height={720}
                    loading="lazy"
                    src={`/templates/${t.id}.png`}
                    width={1280}
                  />
                  <figcaption>
                    <strong>{t.name}</strong>
                    <p className="lp-muted" style={{ margin: "0.2rem 0 0" }}>{t.blurb}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="aud-h" id="audiences">
          <div className="lp-wrap">
            <p className="lp-eyebrow">Who it&apos;s for</p>
            <h2 id="aud-h">Two rooms. Same weapon.</h2>
            <div className="lp-grid-2">
              <div className="lp-card">
                <h3>Get your idea approved</h3>
                <p className="lp-muted">
                  You already know what your company should fix — now you need the room to agree.
                  Walk in with a third-party scored audit, the cost of inaction, and a phased plan
                  with prices attached. Opinions argue; evidence decides.
                </p>
              </div>
              <div className="lp-card">
                <h3>Raise with receipts</h3>
                <p className="lp-muted">
                  Investors triangulate you the moment you leave the room. Hand them a deck that
                  already did it: credibility score, public-record timeline, peer comparison, and a
                  sourced appendix. Diligence-shaped, from slide one.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="close-h">
          <div className="lp-wrap">
            <p className="lp-eyebrow">Beyond the deck</p>
            <h2 id="close-h">The last slide is a running system.</h2>
            <p className="lp-sub">
              A deck that ends with &quot;thanks&quot; dies in the room. SP decks end with a build
              sheet — automations and workflows delivered into your own isolated Brainztem
              instance, with an AI crew that executes the roadmap and a re-scan that proves the
              score moved. Preview free; the full build is $10,500 across four delivery milestones.
            </p>
            <p>
              <a
                className="lp-btn"
                href="https://brainztem.com/?utm_source=strategypresentation&utm_medium=landing&utm_campaign=beyond-the-deck"
                rel="noopener"
                target="_blank"
              >
                See what an instance includes
              </a>
            </p>
          </div>
        </section>

        <section className="lp-section lp-faq" aria-labelledby="faq-h" id="faq">
          <div className="lp-wrap">
            <p className="lp-eyebrow">FAQ</p>
            <h2 id="faq-h">Fair questions.</h2>
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <hr className="lp-gold-rule" />
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-row">
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} StrategyPresentation ·{" "}
            <a href="https://websitecreditscore.com" rel="noopener" target="_blank">
              Powered by WebsiteCreditScore
            </a>{" "}
            ·{" "}
            <a href="https://brainztem.com" rel="noopener" target="_blank">
              Built on Brainztem
            </a>
          </p>
          <p style={{ margin: 0 }}>
            <a href="mailto:seekercray@gmail.com">Contact</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
