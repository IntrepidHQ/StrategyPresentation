// ============================================================
//  SP Landing — strategypresentation.com
//  apps/studio/src/app/home/page.tsx
//
//  The landing IS a presentation: six full-viewport scroll-snap
//  slides in the Blueprint brand — one electric blue drafting
//  sheet, white line-work, particle chess pieces, paper grain.
//  Copy speaks to the small-business owner debating their first
//  hire; the answer it presents is Brainztem.
//  See .claude/skills/design-mind/SKILL.md (Brand v2).
// ============================================================

import DemoWidget from "./DemoWidget";
import { SlideCounter } from "./SlideCounter";
import { TemplateGallery } from "./TemplateGallery";
import { particlePiece, particleRoyalty } from "./chess-art";
import { CheckerWave } from "./CheckerWave";
import { PieceScene } from "./PieceScene";
import { KingMark, NoteLifeBack, NoteWorkDone } from "./doodles";
import { ChessHero } from "./ChessHero";

const TEMPLATES = [
  { id: "blueprint", name: "Blueprint", blurb: "The drafting sheet — blueprint grid, white line-work." },
  { id: "voltage", name: "Voltage", blurb: "Electric blue brutalism, cream slabs, ink splashes." },
  { id: "summit", name: "Summit", blurb: "Light boardroom — cream, navy, antique gold." },
  { id: "signal", name: "Signal", blurb: "Dark modern SaaS — near-black, electric blue." },
  { id: "editorial", name: "Editorial", blurb: "Magazine spread — stark white, didone display." },
  { id: "monospace", name: "Monospace", blurb: "Technical — terminal grid, phosphor green." },
  { id: "gallery", name: "Gallery", blurb: "Airy and minimal — oversized type, terracotta." },
  { id: "beacon", name: "Beacon", blurb: "Warm and mission-driven — parchment, deep teal." },
];

const FAQ: { q: string; a: string; href?: string; linkText?: string }[] = [
  {
    q: "Why not just make the hire?",
    a: "Sometimes you should. But a first hire runs $45–65K a year plus management time, and most of what's drowning you — content, follow-ups, scheduling, keeping the website credible — is exactly what an AI operation does without sick days. Brainztem is $10,500 once, delivered in four milestones, and you try it free for 48 hours before paying anything.",
  },
  {
    q: "What is WebsiteCreditScore?",
    a: "The research engine behind every deck: an AI agent that reads a website's public record — legitimacy, reputation, design, UX, technical health — and grades ten weighted dimensions with cited sources. Every SP deck starts as a WCS scan.",
    href: "https://www.websitecreditscore.com",
    linkText: "Visit WebsiteCreditScore ↗",
  },
  {
    q: "What is Brainztem?",
    a: "The system the deck pitches: your own AI operation — a crew of agents working your content, outreach, follow-ups, and ops from one isolated instance. $10,500 across four milestones, and the 48-hour trial is free.",
    href: "https://brainztem.com",
    linkText: "Visit Brainztem ↗",
  },
  {
    q: "Where does the deck's data come from?",
    a: "Every deck is built from a WebsiteCreditScore scan: an AI research agent that reads the public record — your site, reviews, press, registries, technical signals — and scores ten weighted dimensions with cited sources. Nothing is invented; if we don't have a real scan, we say so and show you a clearly-labeled sample instead.",
  },
  {
    q: "Are the decks really accessible?",
    a: "Yes — every template ships WCAG 2.1 AA: audited color contrast, full keyboard navigation, screen-reader-friendly structure, and all motion disabled when your system asks for reduced motion. We test each template with axe on every change.",
  },
  {
    q: "Can I present offline, or send it as a file?",
    a: "Every deck is one self-contained HTML file — no external requests, no tracking, no login. Present it from a laptop with no internet, email it, or host it anywhere. It also has an auto-play mode.",
  },
  {
    q: "What does it cost?",
    a: "The demo deck is free — paste a URL and watch. The full engagement behind the deck's build sheet is $10,500, billed as four delivery milestones ($3,000 / $3,000 / $2,250 / $2,250), with à-la-carte add-ons beyond that.",
  },
];

// Structured data for AEO/LLM-citation visibility.
const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Strategy Presentation",
    description:
      "Turns a WebsiteCreditScore credibility scan into an evidence-backed, WCAG-AA-accessible pitch deck in eight templates.",
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

const STATS = [
  { n: "$54K", label: "a typical first hire, every\u00A0year", sub: "salary alone — before taxes, tools, and the time to\u00A0manage\u00A0them." },
  { n: "$10.5K", label: "your Brainztem build,\u00A0once", sub: "an AI operation working your content, outreach, and follow-ups. Four milestones, pay as it's\u00A0delivered." },
  { n: "48H", label: "free trial, no\u00A0card", sub: "a working instance built from your own website — chat with your crew before you spend a\u00A0dollar." },
  { n: "1", label: "URL to\u00A0start", sub: "paste it below; the scan and the pitch do the\u00A0rest." },
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

      <header className="lp-header">
        <a className="lp-mark" href="/home">
          <KingMark size={20} />
          Strategy<span>Presentation</span>
        </a>
        <nav aria-label="Site" className="lp-nav">
          <a href="#demo">Live demo</a>
          <a href="#templates">Templates</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      {/* Real-paper wear: the four corners rub through to the sheet's true
          color, plus a soft fold-crease and a light wrinkle. Fixed so it reads
          as the physical sheet you're reading on. */}
      <div className="lp-paper" aria-hidden="true">
        <span className="lp-corner lp-corner-tl" />
        <span className="lp-corner lp-corner-tr" />
        <span className="lp-corner lp-corner-bl" />
        <span className="lp-corner lp-corner-br" />
        <span className="lp-fold" />
        <span className="lp-wrinkle" />
      </div>

      <SlideCounter />

      <nav className="lp-rail" aria-label="Slides">
        <a href="#cover"><span className="lp-vh">Cover</span></a>
        <a href="#math"><span className="lp-vh">The math</span></a>
        <a href="#demo"><span className="lp-vh">Live demo</span></a>
        <a href="#templates"><span className="lp-vh">Templates</span></a>
        <a href="#how"><span className="lp-vh">How it works</span></a>
        <a href="#faq"><span className="lp-vh">FAQ</span></a>
      </nav>

      <main id="main">
        {/* ── 01 · Cover — the first-hire question, chess cluster ── */}
        <section className="lp-slide lp-cover" id="cover" data-slide-name="Cover" aria-labelledby="cover-h">
          <div className="lp-slide-inner lp-cover-grid">
            <div>
              <p className="lp-eyebrow">For the owner doing everything · strategypresentation.com</p>
              <h1 id="cover-h">About that first&nbsp;hire.</h1>
              <p className="lp-lede">
                The assistant. The content writer. The ops person you&apos;re about to pay <em>every month,{'\u00A0'}indefinitely.</em>
              </p>
              <p className="lp-support">
                Before you post the job: paste your website below. We&apos;ll scan your public record,
                show you exactly where the business needs help, and pitch a different answer — one
                system that does the work, built from your own site.
              </p>
              <p className="lp-cover-cta">
                <a className="lp-btn" href="#demo">Show me ↓</a>
              </p>
            </div>
            <ChessHero />
          </div>
          <div className="lp-marks" aria-hidden="true">
            <span>✦</span>
            <span>©2026</span>
            <span>STRATEGYPRESENTATION.COM</span>
            <span>EVIDENCE-BACKED</span>
            <span>WCAG 2.1 AA</span>
          </div>
        </section>

        {/* ── 02 · The math — salary vs system ── */}
        <section className="lp-slide" id="math" data-slide-name="The math" aria-labelledby="math-h">
          <PieceScene className="lp-chess-rook" cast={[{ name: "rook", x: 0, scale: 0.72, rotY: 0.3 }]} fallbackHtml={particlePiece("rook", "sp-math")} />
          <div className="lp-doodle lp-doodle-worknote" aria-hidden="true"><NoteWorkDone /></div>
          <div className="lp-slide-inner">
            <p className="lp-eyebrow">The math</p>
            <h2 id="math-h">One salary, or one system.</h2>
            <p className="lp-support">
              You have momentum — and marketing, follow-ups, books, and a website nobody&apos;s
              watching. The usual fix is a hire. <em>The better fix doesn&apos;t take a salary.</em>
            </p>
            <ul className="lp-stats">
              {STATS.map((s) => (
                <li key={s.label}>
                  <span className="lp-stat-n" aria-hidden="true">{s.n}</span>
                  <span className="lp-stat-label">{s.label}</span>
                  <span className="lp-stat-sub">{s.sub}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 03 · Live demo (column form) ── */}
        <section className="lp-slide" id="demo" data-slide-name="Live demo" aria-labelledby="demo-h">
          <PieceScene className="lp-chess-royalty" cast={[{ name: "king", x: -0.5, scale: 1.34, rotY: 0.2 }, { name: "queen", x: 0.52, z: 0.15, scale: 1.2, rotY: -0.25 }]} fallbackHtml={particleRoyalty("sp-demo")} camY={0.62} camZ={3.35} />
          <div className="lp-doodle lp-doodle-lifenote" aria-hidden="true"><NoteLifeBack /></div>
          <div className="lp-slide-inner">
            <p className="lp-eyebrow">Live demo</p>
            <h2 id="demo-h">See your business the way we do.</h2>
            <div className="lp-demo-col">
              <p className="lp-support">
                Paste your URL. If we&apos;ve scanned it, you get a real pitch from real data —
                otherwise a clearly-labeled sample. No signup, no card.
              </p>
              <DemoWidget />
            </div>
          </div>
        </section>

        {/* ── 04 · Templates — Lovable-style live previews ── */}
        <section className="lp-slide" id="templates" data-slide-name="Templates" aria-labelledby="tpl-h">
          <div className="lp-slide-inner">
            <p className="lp-eyebrow">Templates</p>
            <h2 id="tpl-h">Eight looks. One argument.</h2>
            <p className="lp-support">
              Every deck is responsive, ADA-compliant, and one self-contained file. Click any style
              to walk through a live sample — <em>the previews are real decks, not pictures.</em>
            </p>
            <TemplateGallery templates={TEMPLATES} />
          </div>
        </section>

        {/* ── 05 · How it works ── */}
        <section className="lp-slide" id="how" data-slide-name="How it works" aria-labelledby="how-h">
          <PieceScene className="lp-chess-bishop" cast={[{ name: "bishop", x: 0, scale: 0.8, rotY: 0.5 }]} fallbackHtml={particlePiece("bishop", "sp-how")} />
          <div className="lp-slide-inner">
            <p className="lp-eyebrow">How it works</p>
            <h2 id="how-h">Scan. Pitch. Run.</h2>
            <ol className="lp-steps">
              <li>
                <span className="lp-step-n" aria-hidden="true">01.</span>
                <h3>We scan your site</h3>
                <p>Ten weighted dimensions from the public record — legitimacy, reputation, design, UX, technical health. Every finding cited.</p>
              </li>
              <li>
                <span className="lp-step-n" aria-hidden="true">02.</span>
                <h3>You get the pitch</h3>
                <p>A boardroom deck that shows exactly where the business needs help — and what fixing it is worth. Eight styles, one click apart.</p>
              </li>
              <li>
                <span className="lp-step-n" aria-hidden="true">03.</span>
                <h3>Brainztem does the work</h3>
                <p>Your own AI operation — content, outreach, follow-ups, ops — for $10,500 across four milestones. Try it free for 48 hours first. No salary, ever.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* ── 06 · FAQ + close ── */}
        <section className="lp-slide lp-final" id="faq" data-slide-name="FAQ" aria-labelledby="faq-h">
          <PieceScene className="lp-chess-queen" cast={[{ name: "queen", x: 0, scale: 0.85, rotY: 0 }, { name: "pawn", x: 0.55, z: 0.25, scale: 0.42 }]} fallbackHtml={particlePiece("queen", "sp-faq")} camZ={2.9} />
          <div className="lp-slide-inner">
            <p className="lp-eyebrow">Fair questions</p>
            <h2 id="faq-h">FAQ.</h2>
            <div className="lp-faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>
                    {item.a}
                    {item.href ? (
                      <>
                        {" "}
                        <a href={item.href} rel="noopener" target="_blank">{item.linkText}</a>
                      </>
                    ) : null}
                  </p>
                </details>
              ))}
            </div>
            <CheckerWave />
            <footer className="lp-footer">
              <div className="lp-footer-top">
                <span className="lp-footer-brand">
                  <KingMark size={18} />
                  Strategy<span>Presentation</span>
                </span>
                <nav aria-label="Footer" className="lp-footer-links">
                  <a href="https://websitecreditscore.com" rel="noopener" target="_blank">WebsiteCreditScore</a>
                  <a href="https://brainztem.com" rel="noopener" target="_blank">Brainztem</a>
                  <a href="mailto:seekercray@gmail.com">Contact</a>
                </nav>
              </div>
              <p className="lp-footer-meta">
                © {new Date().getFullYear()} StrategyPresentation · Evidence-backed decks, WCAG 2.1 AA ·
                Chess geometry from <a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ABeautifulGame" rel="noopener" target="_blank">&quot;A Beautiful Game&quot;</a> © ASWF &amp; Ed Mackey (CC BY 4.0)
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
