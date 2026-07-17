import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "turn-website-audit-into-pitch-deck",
  title: "How do you turn a website audit into a pitch deck? (Step by step)",
  description:
    "A practical walkthrough for converting audit findings into a boardroom-ready pitch deck: pick the verdict, sequence the evidence, price the fix, and end with one ask.",
  date: "2026-07-15",
  author: "Hans Turner",
  tags: ["Playbook", "Audits", "Pitch decks"],
  ogImage: "/templates/blueprint.png",
  answer:
    "Turn the audit into an argument, not a report: lead with the single verdict the findings support, show only the evidence that proves it, attach a priced plan to fix what you found, and end with one specific ask. A ten-dimension audit becomes a tight deck of roughly eleven slides — everything else moves to an appendix.",
  faq: [
    {
      q: "How many findings from an audit belong in the pitch deck?",
      a: "Only the findings that support your verdict — usually three to five. A full audit can surface dozens of issues; the deck is the argument, the appendix is the archive. If a finding doesn't change what the client should do next, it doesn't earn a slide.",
    },
    {
      q: "Should the audit score go on the first slide?",
      a: "Near it. The cover states the verdict in plain language; the score appears on the very next slide as the headline evidence. A number without a verdict invites debate about methodology — a verdict backed by a number invites a decision.",
    },
    {
      q: "Do I need design skills to make the deck presentable?",
      a: "No. Use a template system with accessibility and typography already handled. Strategy Presentation renders an audit into eight boardroom-ready styles automatically, each shipped as one self-contained HTML file you can present offline or email.",
    },
  ],
  related: ["pitch-deck-structure-11-slides", "evidence-backed-presentations", "website-credibility-score-explained"],
  body: `An audit and a pitch are different documents with different jobs. The audit's job is to be complete. The pitch's job is to be decisive. Most consultants lose the deal in the gap between the two: they hand over forty pages of findings and hope the client draws the right conclusion. The client doesn't. The client skims, nods, files it, and the engagement dies of politeness.

Here is the full conversion, step by step. It works whether your audit came from a tool like [WebsiteCreditScore](https://www.websitecreditscore.com), from your own manual review, or from a mix of both.

## Step 1: What is the one verdict your audit supports?

Read the whole audit once, then close it and finish this sentence: "This business is losing deals because…"

That sentence is your deck. Everything else is supporting material.

A good verdict is specific and consequential. "The website has issues" is not a verdict. "The site looks credible but gives a buyer no way to verify the business is real — no named team, no registration trail, inconsistent contact details — so high-intent visitors stall at the trust check" is a verdict. It names the mechanism by which the findings cost money.

If your audit is scored — WebsiteCreditScore grades ten weighted dimensions, from business legitimacy down to financial signals — the verdict usually lives in the lowest-scoring heavy dimension. A weak score in a dimension weighted at 18% of the grade matters more than a terrible score in one weighted at 3%. Weight is your triage.

## Step 2: Sort every finding into three piles

Go back through the audit and label each finding:

1. **Proves the verdict.** These become slides. You need three to five, no more.
2. **Worth fixing, but off-thesis.** These go in an appendix or a follow-up note. Mentioning them in the main deck dilutes the argument.
3. **Nitpicks.** Cut them entirely. A missing favicon never closed or killed a deal.

This is the step people skip, and it's why audit-decks sprawl. The discipline is brutal: a genuinely interesting finding that doesn't support the verdict still gets cut from the main line. You are not summarizing the audit. You are prosecuting a case.

## Step 3: Convert findings into evidence slides

A finding becomes an evidence slide when it has three parts:

- **The observation** — what is true right now, stated neutrally.
- **The source** — where this came from: a registry lookup, a review platform, a performance test, a screenshot. Cite it on the slide, not in a footnote nobody reads.
- **The cost** — what this is plausibly doing to the business. Be honest about uncertainty here. "Buyers who check for a team page find none" is a fact; the size of the damage is an inference, and you can say so without weakening the point.

The citation is not decoration. An uncited claim in a pitch is an invitation to argue; a cited claim is an invitation to decide. We've written a full piece on [why claims without sources lose deals](/blog/evidence-backed-presentations) — the short version is that the first unsupported number quietly downgrades everything else on the screen.

## Step 4: Sequence the deck as an argument

The order that works, deal after deal:

1. **Cover** — the verdict in one line, plus who this is for.
2. **The score** — the headline number and grade, with the method named. If you're using a WebsiteCreditScore scan, this is the overall grade across the ten dimensions, each finding cited.
3. **Three to five evidence slides** — one finding each, built as in Step 3.
4. **The gap** — what the strongest competitor or the client's own ambition looks like next to today's reality.
5. **The plan** — what you'd fix, in what order, and why that order.
6. **The build sheet** — scope and price, itemized.
7. **The ask** — one action, one deadline.

Notice what's absent: your agency's history, your team photos, your process diagram. Nobody has ever signed because slide two was "About Us." Credibility gets established by the quality of your evidence, not by a slide asserting it. If you want the deeper treatment of each slide's job, see [the 11-slide structure that closes](/blog/pitch-deck-structure-11-slides).

## Step 5: Price the fix as a build sheet, not an hourly estimate

The deck should end with something the client can approve, not something they have to negotiate. That means an itemized build sheet: each line names a deliverable tied to a finding, and the total is broken into milestones so the client never pays for work they haven't seen.

When our own decks pitch a [Brainztem](https://brainztem.com) operations build, the sheet is $10,500 split across four delivery milestones — $3,000, $3,000, $2,250, $2,250 — each one tied to something shipped. The exact numbers matter less than the shape: milestone billing converts "can we afford this?" into "can we afford the first milestone?", which is a much easier yes.

## Step 6: Make the deck presentable in one pass

Formatting is where audit-decks go to die — hours nudging boxes in a slide editor, and the result still looks homemade. Two rules and one shortcut:

- **One idea per slide.** If a slide needs a compound sentence to summarize, it's two slides.
- **The data is the decoration.** Big score numeral, cited source line, generous space. Resist clip art, resist stock photos of handshakes.

The shortcut: don't format at all. Strategy Presentation takes a website scan and renders the finished deck in eight distinct template styles — from a drafting-sheet blueprint look to a boardroom memo — each WCAG 2.1 AA accessible, each a single self-contained HTML file with no external requests, so it presents offline and travels by email. You can [compare all eight styles](/blog/presentation-template-styles) or just paste a URL into [the live demo](/home#demo) and watch your own deck assemble.

## Step 7: Deliver it as a walkthrough, not an attachment

Send the deck before the meeting, but insist on presenting it. The walkthrough order: verdict, evidence, plan, price, ask — fifteen minutes, then stop talking. The most common failure mode at this stage is narrating every slide's construction ("so then we looked at…"). The client doesn't need the archaeology; they need the argument.

End on the ask slide and leave it up. Silence after an ask is not awkward; it's the client deciding.

## What does the finished conversion look like?

Audit in: dozens of findings across ten dimensions, scored and cited. Deck out: eleven-ish slides, one verdict, three to five proofs, a priced plan, one ask. The audit's completeness didn't disappear — it moved to the appendix and the citations, where it does its real job: making every claim on screen checkable.

That's the whole trick. The audit earns you the right to make the argument. The deck actually makes it.`,
};
