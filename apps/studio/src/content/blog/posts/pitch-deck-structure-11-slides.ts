import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "pitch-deck-structure-11-slides",
  title: "Pitch deck structure that closes: the 11 slides investors and clients actually read",
  description:
    "The 11-slide pitch deck structure that survives real meetings: verdict-first cover, evidence before solution, a priced build sheet, and a single unmistakable ask.",
  date: "2026-07-12",
  author: "Hans Turner",
  tags: ["Pitch decks", "Structure", "Sales"],
  ogImage: "/templates/summit.png",
  answer:
    "A closing deck runs eleven slides in a fixed argument order: cover-verdict, problem, stakes, evidence, solution, how-it-works, proof, plan, price, risk-reversal, and the ask. The sequence matters more than the slides themselves — evidence comes before the solution so the audience wants the fix before they see it, and price arrives only after value is established.",
  faq: [
    {
      q: "What is the ideal number of slides in a pitch deck?",
      a: "Eleven core slides covers the full argument — verdict, problem, stakes, evidence, solution, mechanism, proof, plan, price, risk-reversal, ask — without padding. Add an appendix for detail questions rather than stretching the main line. Fewer is fine if the deal is simple; more usually means two ideas are competing.",
    },
    {
      q: "Should price go in the deck or be saved for the conversation?",
      a: "In the deck, as an itemized build sheet near the end. Hiding price signals it won't survive scrutiny, and it forces a second meeting to do what the first could have done. Milestone billing softens the number: the buyer approves the first milestone, not the whole figure, in their head.",
    },
    {
      q: "Where do team and company-history slides belong?",
      a: "For client work: the appendix, if anywhere. Credibility comes from cited evidence, not from asserting experience. For investor decks the team slide earns a main-line spot — investors buy the operators as much as the plan — but even there it sits after the argument, not before it.",
    },
  ],
  related: ["turn-website-audit-into-pitch-deck", "evidence-backed-presentations", "presentation-template-styles"],
  body: `Every deck that closes is an argument wearing a costume. Strip the typography off a winning pitch and you find the same skeleton every time: here is what's true, here is what it costs you, here is the fix, here is the price, here is what to do next. Decks fail when they abandon that skeleton — when they open with the vendor's biography, bury the price, or present a solution before anyone wants one.

Below is the eleven-slide structure we render every Strategy Presentation deck into, and the job each slide has to do. The order is the product; treat it as load-bearing.

## Why does slide order matter more than slide content?

Because a deck is consumed in sequence, and each slide is read in the mood the previous slide created. Evidence shown *after* the solution reads as self-justification; the same evidence shown *before* the solution reads as diagnosis. Price shown before value is a cost; price shown after value is a comparison. You can write brilliant individual slides and still lose because they arrived in the wrong order.

## The 11 slides

### 1. Cover — the verdict, not the logo

One sentence that states the conclusion the whole deck will earn: what's true and why it matters to this specific audience. If the reader saw only this slide, they should know your position. "Q3 Growth Proposal" is a filename, not a cover.

### 2. Problem — the thing that's true right now

State the problem in the audience's terms, neutrally, without selling. The test: could the client's own team have written this slide? If yes, you've described their reality accurately and bought enormous credibility for everything that follows.

### 3. Stakes — what the problem costs

The problem slide says what's wrong; the stakes slide says why it can't stay wrong. Be honest about what's measured versus inferred. A stalled trust signal, a checkout that fails on phones, a reputation gap against the nearest competitor — connect each to the money or the mission, and flag your uncertainty where it exists. Overstated stakes read as fear-selling and trigger resistance.

### 4. Evidence — the receipts

The hinge of the deck. Three to five findings, each with its source cited on the slide. This is where audit-driven decks have an unfair advantage: when the pitch is built from a [WebsiteCreditScore](https://www.websitecreditscore.com) scan, every finding arrives with a citation from the public record — registries, review platforms, technical tests. Nothing on this slide should be arguable, because everything on it is checkable. We've written more on [why uncited claims quietly kill deals](/blog/evidence-backed-presentations).

### 5. Solution — the one-line fix

After four slides of accurate diagnosis, the audience is asking the question this slide answers. Keep it to the concept — what changes, in one or two lines — and resist explaining the mechanism yet. A solution slide that tries to also be the how-it-works slide does both jobs badly.

### 6. How it works — the mechanism

Now the machinery, in three or four steps at most. The reader should finish this slide able to explain the solution to a colleague. If your process genuinely has nine stages, group them; nobody evaluates nine stages, they evaluate whether you seem organized.

### 7. Proof — why this will work here

Different from evidence. Evidence established the problem; proof establishes the fix. Relevant prior results, a live demonstration, a pilot outcome — whatever you can actually stand behind. If you're early and thin on proof, say so and lean on the mechanism's transparency instead; a checkable claim beats an impressive-sounding vague one.

### 8. Plan — what happens in what order

Sequence, owners, and the first checkpoint. The plan slide converts the pitch from an idea into an operation. It's also where you demonstrate you've done this before — real plans have an order with reasons ("trust signals first, because every later fix compounds on credibility"), not four parallel workstreams that all start Monday.

### 9. Price — the build sheet

Itemized deliverables, each traceable back to a finding from slide four, with the total split into milestones. Our own decks price a [Brainztem](https://brainztem.com) operations build at $10,500 across four delivery milestones — $3,000, $3,000, $2,250, $2,250 — so the buyer is never asked to pay for anything they haven't seen shipped. Whatever your numbers, the structure is the persuasion: milestones convert one large decision into a sequence of small, reversible ones.

### 10. Risk reversal — the objections, answered before they're raised

What happens if it doesn't work, what the exit looks like, what's guaranteed, what's not. Naming the risks yourself does two things: it removes the audience's obligation to hunt for them, and it signals you've been burned enough times to know where the sharp edges are. A short FAQ format works well here.

### 11. The ask — one action, one date

The most commonly botched slide. Not "next steps," plural, and not "we'd love to continue the conversation." One action — approve milestone one, sign the pilot, book the working session — and one date. End the presentation on this slide and leave it on screen. The silence that follows is the sound of a decision being made; don't fill it.

## What stays out of the eleven?

- **The about-us slide.** Your credibility is the quality of slides two through four. For investor decks, a team slide earns a place — after the argument.
- **The exhaustive findings dump.** It goes in the appendix. The deck argues; the appendix archives. (Full walkthrough: [turning an audit into a deck, step by step](/blog/turn-website-audit-into-pitch-deck).)
- **Mission statements, vision slides, inspirational quotes.** The mission is implied by the stakes slide. The quote has never once been load-bearing.

## Does the template change the structure?

No — and that's the point. Structure is the argument; the template is the register you deliver it in. The same eleven slides read as a boardroom memo in a serif template and as a product launch in a dark dashboard style. Strategy Presentation renders one deck into [eight distinct template styles](/blog/presentation-template-styles), all WCAG 2.1 AA accessible, each a single self-contained HTML file that presents offline. Pick the register that matches the room, not the one that matches your taste.

If you want to see the structure working with real slides in it, paste any website into [the live demo](/home#demo) — the deck it builds follows this exact argument line, evidence citations and build sheet included.`,
};
