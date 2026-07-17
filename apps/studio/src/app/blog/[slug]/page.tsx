// ============================================================
//  SP Blog — article page
//  apps/studio/src/app/blog/[slug]/page.tsx
//
//  Blueprint chrome, but the article itself is a white paper
//  sheet with dark ink — long-form legibility beats brand-blue
//  for 1,500 words (contrast ≥ 4.5:1 everywhere on the sheet).
//  Answer-first: a highlighted 2–3 sentence direct answer sits
//  under the H1 for readers and AI search engines alike.
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPost, getRelated, readingMinutes } from "../../../content/blog";
import { BlogFooter, BlogHeader } from "../chrome";
import { Markdown } from "../markdown";

const BASE = "https://www.strategypresentation.com";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${BASE}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "Strategy Presentation",
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: post.ogImage }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = `${BASE}/blog/${post.slug}`;
  const related = getRelated(post);
  const minutes = readingMinutes(post);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      image: `${BASE}${post.ogImage}`,
      datePublished: post.date,
      dateModified: post.date,
      author: { "@type": "Person", name: post.author, url: `${BASE}/` },
      publisher: { "@type": "Organization", name: "Strategy Presentation", url: `${BASE}/`, logo: { "@type": "ImageObject", url: `${BASE}/icon.svg` } },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
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

      <main id="main" className="bp-main bp-main-article">
        <nav aria-label="Breadcrumb" className="bp-crumbs">
          <a href="/home">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/blog">Blog</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{post.title}</span>
        </nav>

        {/* The article is a white sheet — dark ink for 1,500 words. */}
        <article className="bp-sheet">
          <header className="bp-article-head">
            <p className="bp-article-tags">{post.tags.join(" · ")}</p>
            <h1>{post.title}</h1>
            <p className="bp-article-meta">
              By {post.author} ·{" "}
              <time dateTime={post.date}>{formatDate(post.date)}</time> · {minutes} min read
            </p>
          </header>

          <aside className="bp-answer" aria-label="The short answer">
            <p className="bp-answer-label">The short answer</p>
            <p>{post.answer}</p>
          </aside>

          <div className="bp-body">
            <Markdown source={post.body} />
          </div>

          <section className="bp-faq" aria-labelledby="faq-h">
            <h2 id="faq-h">Quick answers</h2>
            {post.faq.map((f) => (
              <div className="bp-faq-item" key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>

          <aside className="bp-article-cta" aria-label="Try the live demo">
            <div>
              <p className="bp-article-cta-title">See it on your own website</p>
              <p>
                Paste a URL into the live demo and watch an evidence-backed pitch deck build
                itself from your public record. Free — no signup, no card.
              </p>
            </div>
            <a className="bp-btn" href="/home#demo">Open the live demo</a>
          </aside>
        </article>

        <section className="bp-related" aria-labelledby="related-h">
          <h2 id="related-h">Related reading</h2>
          <ul className="bp-grid bp-grid-related">
            {related.map((r) => (
              <li key={r.slug}>
                <a className="bp-card" href={`/blog/${r.slug}`}>
                  <p className="bp-card-tags">{r.tags.join(" · ")}</p>
                  <h3>{r.title}</h3>
                  <p className="bp-card-meta">
                    <time dateTime={r.date}>{formatDate(r.date)}</time> · {readingMinutes(r)} min read
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <BlogFooter />
      </main>
    </div>
  );
}
