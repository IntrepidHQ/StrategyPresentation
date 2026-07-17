import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "how-ai-builds-a-pitch-deck",
  title: "How AI builds a pitch deck from public data (a transparent walkthrough)",
  description:
    "Scan, handoff, argument, render: the full pipeline that turns a business's public record into a cited pitch deck — including what the AI is forbidden to do.",
  date: "2026-06-11",
  author: "Hans Turner",
  tags: ["AI", "Evidence", "Playbook"],
  ogImage: "/templates/signal.png",
  answer:
    "The pipeline has four stages: an AI research agent reads the business's public record and grades ten weighted dimensions with every finding cited to its source; the finished scan is handed off over a signed webhook; the studio assembles those findings into a fixed argument structure; and the result renders as one self-contained HTML deck. The AI is never allowed to invent a number — when no real scan exists, the system shows a clearly labeled sample rather than faking one.",
  faq: [
    {
      q: "Does the AI make up statistics for the deck?",
      a: "No, by construction rather than by promise. Slides are assembled from a completed credibility scan, and every finding in that scan carries a citation to where it came from — a registry, a review platform, a technical test. A claim with no source has nowhere to enter the pipeline, and when evidence is missing the deck labels the gap instead of papering over it.",
    },
    {
      q: "What public data does the research agent actually read?",
      a: "The business's public record: registration and legitimacy signals, review platforms and reputation, press and social presence, domain history, transparency of the site itself, and reproducible technical tests. The scan grades ten weighted dimensions from that record, and each finding is cited so a skeptical reader can check it independently.",
    },
    {
      q: "What happens if my website has never been scanned?",
      a: "The demo shows a clearly labeled sample deck instead of quietly generating one from thin air — an honest gap beats an invented certainty. To get a real deck, run a scan at websitecreditscore.com; a completed scan feeds the pipeline directly and the deck assembles from your actual public record.",
    },
  ],
  related: ["html-presentations-vs-powerpoint", "website-credibility-score-explained", "evidence-backed-presentations"],
  body: `"AI-generated pitch deck" is a phrase that deserves your suspicion. The failure mode is easy to picture, because everyone has seen it in miniature: plausible sentences, confident numbers, and somewhere in slide six a statistic that no one can trace because no one — human or machine — ever actually found it. If AI is going to build sales documents, the only interesting question is the one vendors tend to skip: *where does each claim come from, and what is the system forbidden to do?*

So here is the full walkthrough of how Strategy Presentation builds a deck, stage by stage, including the boring plumbing and the hard rules. Transparency is cheap to promise and expensive to fake; the way to judge a pipeline is to look at it.

## Stage 1: the research pass — reading the public record

Every deck starts as a [WebsiteCreditScore](https://www.websitecreditscore.com) credibility scan. An AI research agent works through a business's public record the way a careful buyer doing diligence would: business registries and legitimacy signals, review platforms and how the business responds to criticism, press and social footprint, domain history, the transparency of the site itself, and a battery of reproducible technical tests.

The output is graded across **ten weighted dimensions** — business legitimacy weighs most, financial signals least — and lands as an overall score and grade with red and green flags attached. Two properties of this stage carry the whole system:

- **Every finding is cited.** Not "sources available on request" — each claim in the scan names where it came from, so a skeptical reader can re-check it without anyone's cooperation.
- **The agent reads; it doesn't imagine.** The scan reports what the public record contains, including when what it contains is *nothing* — "no registration trail found" is itself a finding, and often the most valuable one in the report.

This division of labor is deliberate. The research pass is where facts enter the system, and it's the only place they can enter. Everything downstream is arrangement.

## Stage 2: the handoff — plumbing as a trust feature

When a scan completes, WebsiteCreditScore fires a webhook to the studio carrying the full report. This is the least glamorous stage and worth a paragraph anyway, because the plumbing is doing epistemic work.

The payload is **signed** — HMAC SHA-256 over the raw body, with a timestamp, verified against a shared secret; stale payloads are rejected outright. And deck creation is **idempotent**: if a deck already exists for that client, a retried or re-fired webhook returns the existing deck instead of minting a duplicate.

Why does this belong in a walkthrough about trust? Because the alternative to a signed, automated handoff is a human copy-pasting findings into a slide tool — and every manual hop is a place where a number gets transposed, a citation gets orphaned, or a finding gets "improved." The pipeline's integrity guarantees are exactly what make the citations on the final slides worth anything: the claim on screen is the claim in the scan, mechanically.

## Stage 3: the argument — where the AI is on its tightest leash

Here's the counterintuitive part of the design: the stage where generative AI could do the most impressive writing is the stage where it's given the least freedom.

The deck follows a **fixed argument structure** — verdict first, then the score, then the evidence slides, then plan, build sheet, and a single ask. The system's job at this stage is selection and arrangement, not invention:

1. **Find the verdict.** The weighted dimensions point to it. A weak score in a heavy dimension — legitimacy, reputation — matters more than a terrible score in a light one, so the verdict typically lives where weight and weakness intersect.
2. **Select the evidence.** A scan surfaces far more findings than an argument can carry. The slides take the few that prove the verdict; the rest stay in the report. Editing is choosing, and choosing is most of the craft.
3. **Inherit the citations.** Each evidence slide keeps its finding's source. The deck doesn't restate the scan's claims in looser language — looseness is where hallucination sneaks in through the back door of paraphrase.

Notice what the AI is *not* doing: it isn't estimating market sizes, inventing benchmark percentages, or generating the "studies show" filler that pads human-made decks. The dirty secret of pitch decks was never that machines might fabricate — it's that people always have, politely. A pipeline that structurally can't is not a downgrade.

## Stage 4: the render — one file, held to standards

The assembled argument renders into one of eight template styles and ships as a **single self-contained HTML file**: no external requests, no tracking, no login, presentable offline and forwardable as an attachment. Every template is **WCAG 2.1 AA** accessible — audited contrast, full keyboard navigation, screen-reader-friendly structure, motion disabled under reduced-motion preferences.

We've written a fuller case for [why one file beats slideware at the moment of delivery](/blog/html-presentations-vs-powerpoint); for this walkthrough the relevant point is narrower. The render stage adds *form* and is forbidden to add *content*. Templates change the register — boardroom memo, product dashboard, terminal — and change nothing else.

## The rules: what the system refuses to do

Every stage above is shaped by three prohibitions, and they're the real answer to the suspicion this post opened with.

- **No claim without a source.** Facts enter only through the cited scan. There is no stage at which a model is asked to "add supporting statistics."
- **No unlabeled samples.** If a site has never been scanned, the demo shows a sample deck that *says it's a sample* — prominently — rather than improvising a plausible one. An honest gap outperforms an invented certainty, in software and in sales alike.
- **No silent judgment calls.** Interpretation exists in the deck — a verdict is a judgment — but it's anchored to findings a reader can check, and the deck's structure keeps the checkable and the judged visually distinct.

If you're evaluating any AI deck tool — ours included — these are the questions to ask: where do facts enter, what stops new ones from entering later, and what happens when the data isn't there. A vendor who can't answer crisply is describing an autocomplete, not a pipeline.

## What's left for the human?

Plenty, and the important parts. The pipeline produces the argument's *document*; it doesn't attend the meeting. Choosing which client to pitch, deciding whether the verdict warrants the engagement, setting the price, reading the room, and delivering the ask — that's judgment work, and the system is built to hand you into it well-armed rather than to replace you at it. The deck arrives with its receipts so that your fifteen minutes in the room get spent on the decision instead of on defending slide four.

The walkthrough ends the way the pipeline does — with something you can check yourself. Paste a website into [the live demo](/home#demo) and watch the four stages run: if the site's been scanned, the deck that assembles is its actual public record, cited line by line; if it hasn't, you'll see the labeled sample and can judge how the system behaves when it doesn't know. Both behaviors are the product.`,
};
