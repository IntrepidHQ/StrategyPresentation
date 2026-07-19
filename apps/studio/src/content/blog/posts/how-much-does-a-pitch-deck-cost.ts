import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "how-much-does-a-pitch-deck-cost",
  title: "How much does a pitch deck cost?",
  description:
    "Freelancer, agency, and in-house pricing for 2026 — what each tier actually buys, why identical-looking decks differ by 10x, and how to tell design fees from thinking fees.",
  date: "2026-07-15",
  author: "Hans Turner",
  tags: ["Pitch decks", "Pricing"],
  ogImage: "/templates/editorial.png",
  answer:
    "In 2026, freelance designers charge roughly $500–$3,000 for a client-facing deck, specialist agencies $5,000–$25,000, and in-house builds cost 20–40 hours of senior time — usually $2,000–$6,000 in real salary terms. The 10x spread isn't design quality; it's whether the price includes the research and argument, or only the slides that present them.",
  faq: [
    {
      q: "How much does a pitch deck cost in 2026?",
      a: "Freelance designers typically charge $500 to $3,000 for a client-facing deck, specialist agencies $5,000 to $25,000, and investor-grade decks from boutique firms can exceed $25,000. Building in-house costs 20 to 40 hours of senior time, which is often $2,000 to $6,000 once you price the hours honestly.",
    },
    {
      q: "Why do pitch deck prices vary so much?",
      a: "Because the quotes are for different work. A design-only engagement takes your existing argument and makes it look credible. A strategy engagement decides what the argument should be — doing the research, forming the verdict, and pricing the plan. The second is several times the work, which is most of the price gap between a $1,500 deck and a $15,000 one.",
    },
    {
      q: "Is an expensive pitch deck worth it?",
      a: "It depends entirely on deal size. On a $5,000 engagement, a $10,000 deck is indefensible. On a $250,000 contract or a funding round, the same spend is rounding error against the outcome. The useful test is deck cost as a percentage of the decision it influences, not the absolute number.",
    },
    {
      q: "What should be included in a pitch deck quote?",
      a: "Ask specifically who does the research, who decides the verdict, how many review rounds are included, whether you receive editable source files, and whether pricing and plan slides are in scope. Quotes that are silent on research are design-only quotes, however they're worded.",
    },
  ],
  related: ["how-long-to-make-a-pitch-deck", "sales-deck-vs-pitch-deck", "evidence-backed-presentations"],
  body: `Ask five providers what a deck costs and you'll get quotes a factor of ten apart for what looks, on the surface, like the same deliverable. The spread isn't arbitrary and it usually isn't gouging. It's that the word "deck" is doing different jobs in each quote.

## The 2026 ranges

- **Freelance designer — $500 to $3,000.** You bring the content; they make it look like a serious document. Fast, and excellent value when your argument is already settled.
- **Specialist agency — $5,000 to $25,000.** Strategy plus design. Discovery calls, narrative development, several review rounds, a polished result.
- **Boutique investor-deck firms — $25,000 and up.** Fundraising-grade, often with financial modelling and narrative coaching attached.
- **In-house — 20 to 40 hours of senior time.** Feels free because no invoice appears. Priced at a realistic loaded rate it's commonly $2,000 to $6,000, and the hours come out of whoever can least afford them.

## What you're actually paying for

Strip away the packaging and every quote is some mix of two products.

**Presentation.** Layout, typography, hierarchy, visual register — making an argument look like it deserves to be taken seriously. Genuinely valuable and genuinely commoditised. A competent freelancer does this well at the low end of the range.

**Thinking.** Research into the buyer's actual situation, a verdict about what it means, a plan that follows from the verdict, and a price attached to the plan. This is where the hours live and where the 10x lives.

A $1,500 quote and a $15,000 quote can both be fair — for different products. The failure mode is buying the first while expecting the second, then concluding that decks don't work when a beautifully-typeset deck full of your own untested assumptions doesn't close anything.

> A designer can make your argument look credible. Only research can make it *be* credible. Those are separate purchases, and most quotes only include one.

## How to read a quote properly

Four questions separate the tiers faster than any proposal document:

- **Who does the research?** If the answer is "you send us the content," you're buying presentation. That may be exactly right — just know it.
- **Who decides the verdict?** Somebody has to commit to what the evidence means. If nobody in the quote owns that, you own it.
- **How many review rounds?** Unlimited rounds sound generous and reliably become the project's longest phase.
- **Are pricing and the ask in scope?** Decks that stop at diagnosis are consulting reports. The closing work is in the last three slides.

## The percentage test

Absolute price is the wrong frame. Deck cost as a fraction of the decision it influences is the right one.

A $10,000 deck for a $5,000 engagement is absurd. The same deck for a $250,000 contract is four percent of the outcome — and if it measurably raises the odds of winning, arguing about the four percent is arguing about the wrong number. Cheap decks aren't cheap when they lose deals that were winnable.

Which cuts both ways: for small or repeatable engagements, high-touch deck spend genuinely can't be justified per-deal. That's a real constraint, not a failure of nerve.

## The structural way out

The reason those two poles feel unavoidable is an assumption worth questioning: that the research layer must be produced by hand, per deal, at senior rates.

Much of what makes a diagnosis credible about a prospect is already public. Their site, their reputation record, their technical health, their transparency signals — a company's public record can be assessed systematically rather than artisanally. That's the pipeline we run: a [WebsiteCreditScore scan](https://www.websitecreditscore.com) grades ten weighted dimensions with every finding cited, and the deck assembles from that evidence into a [priced, boardroom-ready presentation](/blog/turn-website-audit-into-pitch-deck).

The point isn't that thinking becomes free. It's that the *repeatable* part of the thinking — gathering and grading the public record — stops being a per-deal senior-time expense, which is precisely the cost that forced the choice between a cheap deck with no evidence and an expensive one you can't run at volume.

If you take one thing from this: don't ask what a deck costs. Ask which of the two products the quote contains, then judge the number against the size of the decision it's meant to move.`,
};
