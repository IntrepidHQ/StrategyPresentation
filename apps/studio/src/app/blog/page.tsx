// ============================================================
//  SP Blog — index
//  apps/studio/src/app/blog/page.tsx
//
//  The drafting room's reading table: blueprint-blue chrome,
//  each post a white paper sheet pinned to the sheet. Server-
//  rendered, zero client JS.
// ============================================================

import type { Metadata } from "next";
import { getAllPosts, readingMinutes } from "../../content/blog";
import { BlogFooter, BlogHeader } from "./chrome";

const TITLE = "Blog — Strategy Presentation";
const DESCRIPTION =
  "Field notes on evidence-backed pitching: turning website audits into decks, credibility scores, template registers, and the first-hire math.";
const BASE = "https://www.strategypresentation.com";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/blog` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/blog`,
    siteName: "Strategy Presentation",
    type: "website",
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Strategy Presentation Blog",
      description: DESCRIPTION,
      url: `${BASE}/blog`,
      publisher: { "@type": "Organization", name: "Strategy Presentation", url: `${BASE}/` },
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `${BASE}/blog/${p.slug}`,
        datePublished: p.date,
        author: { "@type": "Person", name: p.author },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
      ],
    },
  ];

  return (
    <div className="bp">
      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      <a className="bp-skip" href="#main">Skip to content</a>
      <BlogHeader />

      <main id="main" className="bp-main">
        <nav aria-label="Breadcrumb" className="bp-crumbs">
          <a href="/home">Home</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Blog</span>
        </nav>

        <header className="bp-hero">
          <p className="bp-eyebrow">Field notes · strategypresentation.com</p>
          <h1>The drafting room.</h1>
          <p className="bp-lede">
            Working notes on evidence-backed pitching — audits that become decks, decks
            that close, and the operations math underneath{" "}both.
          </p>
        </header>

        <ul className="bp-grid">
          {posts.map((post) => (
            <li key={post.slug}>
              <a className="bp-card" href={`/blog/${post.slug}`}>
                <p className="bp-card-tags">{post.tags.join(" · ")}</p>
                <h2>{post.title}</h2>
                <p className="bp-card-desc">{post.description}</p>
                <p className="bp-card-meta">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  {" · "}
                  {readingMinutes(post)} min read
                  {" · "}
                  {post.author}
                </p>
              </a>
            </li>
          ))}
        </ul>

        <aside className="bp-cta" aria-label="Try the live demo">
          <div>
            <h2>Read enough — see your own deck.</h2>
            <p>Paste a URL and watch an evidence-backed pitch assemble from your public record. Free, no signup.</p>
          </div>
          <a className="bp-btn" href="/home#demo">Open the live demo</a>
        </aside>

        <BlogFooter />
      </main>
    </div>
  );
}
