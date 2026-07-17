// ============================================================
//  SP Blog + Docs — shared chrome (header + footer)
//  apps/studio/src/app/blog/chrome.tsx
//
//  Same Blueprint register as the landing page: fixed blue
//  header bar with the king mark, hairline footer. Server
//  components — no client JS on the blog or docs at all.
//  `current` marks the active nav item (blog | docs).
// ============================================================

import { KingMark } from "../home/doodles";

export function BlogHeader({ current = "blog" }: { current?: "blog" | "docs" }) {
  return (
    <header className="bp-header">
      <a className="bp-mark" href="/home">
        <KingMark size={20} />
        Strategy<span>Presentation</span>
      </a>
      <nav aria-label="Site" className="bp-nav">
        <a href="/home#demo">Live demo</a>
        <a href="/home#templates">Templates</a>
        <a href="/blog" aria-current={current === "blog" ? "true" : undefined}>Blog</a>
        <a href="/docs" aria-current={current === "docs" ? "true" : undefined}>Docs</a>
      </nav>
    </header>
  );
}

export function BlogFooter() {
  return (
    <footer className="bp-footer">
      <div className="bp-footer-top">
        <span className="bp-footer-brand">
          <KingMark size={18} />
          Strategy<span>Presentation</span>
        </span>
        <nav aria-label="Footer" className="bp-footer-links">
          <a href="/home">Home</a>
          <a href="/blog">Blog</a>
          <a href="/docs">Docs</a>
          <a href="https://websitecreditscore.com" rel="noopener" target="_blank">WebsiteCreditScore</a>
          <a href="https://brainztem.com" rel="noopener" target="_blank">Brainztem</a>
          <a href="mailto:seekercray@gmail.com">Contact</a>
        </nav>
      </div>
      <p className="bp-footer-meta">
        © {new Date().getFullYear()} StrategyPresentation · Evidence-backed decks, WCAG 2.1 AA
      </p>
    </footer>
  );
}
