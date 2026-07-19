// ============================================================
//  SP Blog — post registry
//  apps/studio/src/content/blog/index.ts
//
//  Import every post module here. Order doesn't matter — the
//  accessors sort by date (newest first).
// ============================================================

import type { BlogPost } from "./types";
import { post as auditToDeck } from "./posts/turn-website-audit-into-pitch-deck";
import { post as deckStructure } from "./posts/pitch-deck-structure-11-slides";
import { post as evidenceBacked } from "./posts/evidence-backed-presentations";
import { post as templateStyles } from "./posts/presentation-template-styles";
import { post as scoreExplained } from "./posts/website-credibility-score-explained";
import { post as firstHire } from "./posts/first-hire-assistant-agency-or-ai";
import { post as htmlVsPowerpoint } from "./posts/html-presentations-vs-powerpoint";
import { post as aiBuildsDeck } from "./posts/how-ai-builds-a-pitch-deck";
import { post as deckTaxonomy } from "./posts/sales-deck-vs-pitch-deck";
import { post as presentAudit } from "./posts/present-website-audit-to-client";
import { post as deckTimeline } from "./posts/how-long-to-make-a-pitch-deck";
import { post as deckCost } from "./posts/how-much-does-a-pitch-deck-cost";

const POSTS: BlogPost[] = [
  deckTimeline,
  deckCost,
  auditToDeck,
  deckStructure,
  evidenceBacked,
  templateStyles,
  scoreExplained,
  firstHire,
  htmlVsPowerpoint,
  aiBuildsDeck,
  deckTaxonomy,
  presentAudit,
];

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getRelated(post: BlogPost): BlogPost[] {
  const related = post.related
    .map((slug) => getPost(slug))
    .filter((p): p is BlogPost => Boolean(p));
  // Backfill with newest others if a post lists fewer than 3.
  if (related.length < 3) {
    for (const p of getAllPosts()) {
      if (related.length >= 3) break;
      if (p.slug !== post.slug && !related.some((r) => r.slug === p.slug)) related.push(p);
    }
  }
  return related.slice(0, 3);
}

export type { BlogPost, BlogFaqItem } from "./types";
export { readingMinutes } from "./types";
