// ============================================================
//  SP Blog — content types
//  apps/studio/src/content/blog/types.ts
//
//  Posts are typed TS content modules (no CMS, no DB). Each post
//  lives in ./posts/<slug>.ts and is registered in ./index.ts.
//  The body is a constrained markdown dialect rendered by
//  src/app/blog/markdown.tsx (h2/h3, paragraphs, lists,
//  blockquotes, hr, bold/italic/code/links).
// ============================================================

export interface BlogFaqItem {
  /** Question-form heading — also feeds the FAQPage JSON-LD. */
  q: string;
  /** Plain-text answer (no markdown — it goes into JSON-LD verbatim). */
  a: string;
}

export interface BlogPost {
  /** URL slug — /blog/<slug>. */
  slug: string;
  /** The H1. Prefer question form; otherwise the H2s must carry questions. */
  title: string;
  /** Meta description + index card blurb (~155 chars). */
  description: string;
  /** ISO date (yyyy-mm-dd) — publication date. */
  date: string;
  /** Author display name. */
  author: string;
  /** Topic tags shown on the card and the article header. */
  tags: string[];
  /** Site-relative OG image (template cover PNGs from /templates). */
  ogImage: string;
  /**
   * The direct answer, 2–3 sentences, shown in a highlighted box right
   * under the H1 — answer-first for readers and AI search engines alike.
   */
  answer: string;
  /** Quick Q&As appended to the article — rendered + FAQPage JSON-LD. */
  faq: BlogFaqItem[];
  /** Slugs of related posts (cross-linking section). */
  related: string[];
  /** Article body in the constrained markdown dialect. */
  body: string;
}

/** ~220 wpm, rounded up — used for the "N min read" chip. */
export function readingMinutes(post: BlogPost): number {
  const words = post.body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
