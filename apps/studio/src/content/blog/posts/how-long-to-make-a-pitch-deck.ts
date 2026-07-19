import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "how-long-to-make-a-pitch-deck",
  title: "How long does it take to make a pitch deck?",
  description:
    "The honest ranges: 20–40 hours in-house, 1–3 weeks with an agency, minutes when the evidence is already gathered. Where the time actually goes, and how to cut it without cutting quality.",
  date: "2026-07-18",
  author: "Hans Turner",
  tags: ["Pitch decks", "Process"],
  ogImage: "/templates/summit.png",
  answer:
    "Built by hand, a serious client-facing deck takes 20 to 40 working hours spread across one to three weeks — and only about a fifth of that is design. The bulk goes into research and argument: finding out what's actually true about the buyer's situation and deciding what it means. When that evidence layer is already assembled, the deck itself takes minutes, because writing slides was never the slow part.",
  faq: [
    {
      q: "How long does it take to make a pitch deck from scratch?",
      a: "For a serious client-facing deck, expect 20 to 40 working hours spread over one to three weeks. Research and argument consume most of it; slide design is usually under a fifth of the total. Internal decks reusing an existing narrative can be done in a few hours.",
    },
    {
      q: "Why do agencies quote two to three weeks for a deck?",
      a: "The calendar time is mostly waiting, not working. Discovery calls have to be scheduled, source material has to be collected from the client, drafts go out for review, and feedback comes back in batches. The actual production hours are far fewer than the elapsed weeks suggest.",
    },
    {
      q: "Can you make a good pitch deck in a day?",
      a: "Only if the argument already exists. A day is enough to assemble and design a deck whose verdict, evidence, and plan are settled. It is not enough to discover what you think — decks built in a day without prior research tend to be well-designed assertions with nothing underneath them.",
    },
    {
      q: "What takes the longest when building a deck?",
      a: "Deciding what is true and what it means. Gathering evidence about the buyer's situation, resolving contradictions in it, and committing to a verdict is the slow, unglamorous majority of the work. Teams routinely mistake this for a design problem and hire a designer, which speeds up the fastest part of the process.",
    },
  ],
  related: ["turn-website-audit-into-pitch-deck", "pitch-deck-structure-11-slides", "evidence-backed-presentations"],
  body: `Everyone asks this question hoping for a small number, and the honest answer is that it depends entirely on what you already know. Not on how fast you build slides — on whether the argument the slides carry has been settled yet.

Here are the real ranges, and then the more useful discussion of where the hours actually go.

## The honest ranges

- **A few hours** — an internal deck reusing a narrative you've already argued. You're reformatting a known position, not forming one.
- **20–40 working hours** — a serious client-facing deck built from scratch. Spread across one to three weeks of calendar time.
- **1–3 weeks elapsed with an agency** — the hours aren't higher, the waiting is. Discovery scheduling, source collection, review rounds.
- **Minutes** — when the evidence layer is already assembled and the only remaining work is assembly and styling.

That last line looks like marketing. It isn't, and the reason why is the whole point of this piece.

## Where the time actually goes

Break a from-scratch deck into its real phases and the distribution surprises people:

- **Research — roughly half.** What is true about this buyer's situation? What's their current state, what's broken, what does the public record say, what are competitors doing? This is reading, checking, and cross-referencing.
- **Argument — roughly a third.** What does the evidence mean, what's the verdict, what plan follows from it, what should it cost? This is the part that gets done in the shower and on the third rewrite.
- **Design and assembly — the remainder.** Laying out slides, choosing type, making it look like a serious document.

Notice that design — the thing people mean when they say "making a deck" — is the smallest slice. This mis-estimate is expensive. A team feeling slow at deck production hires a designer, the fastest phase gets faster, and the timeline barely moves. They've optimised the tail.

> If your deck takes three weeks, the slides aren't slow. The thinking is. Speeding up the slides changes almost nothing.

## Why agency timelines look worse than they are

Two to three weeks of elapsed time typically contains well under a week of work. The gaps are structural: a discovery call has to find a slot in two calendars, the client has to dig up last year's numbers, a draft sits in someone's inbox over a weekend, and feedback arrives in one batch rather than continuously.

This matters when you're deciding whether to build in-house. You're not choosing between 30 hours and 3 weeks — you're choosing between 30 of *your* hours and 3 weeks of *waiting* while spending less of your own attention. Both are real costs; they're just denominated differently.

## The shortcut that isn't a shortcut

The reason a deck can be produced in minutes is that the slow phases were done *before* the deck was requested — not skipped.

If you already hold a rigorous, cited assessment of the buyer's situation, then the verdict is determined, the evidence is gathered, the priorities are ranked, and what remains is genuinely mechanical: order the argument, attach the plan and price, apply a visual register appropriate to the room.

That's the pipeline we run. A [WebsiteCreditScore scan](https://www.websitecreditscore.com) grades ten weighted dimensions of a company's public record with every finding cited, and the deck assembles from that. The research phase didn't vanish — it happened automatically, and it happened before anyone asked for slides. We've documented [exactly how that assembly works](/blog/how-ai-builds-a-pitch-deck) for anyone who wants the mechanics rather than the claim.

The distinction worth holding onto: a deck built fast *on top of* evidence is rigorous. A deck built fast *instead of* evidence is a well-designed assertion, and buyers can tell the difference within about two slides.

## How to actually cut your timeline

If you're building by hand and want the number down, attack the phases in order of size:

- **Gather evidence continuously, not per-deck.** Most of what you need about a prospect is public and could have been collected before the meeting was booked.
- **Settle the verdict before opening the deck tool.** Write the one-sentence conclusion first. If you can't, you're not ready to design — you're still researching, and doing it inside a slide editor is the slowest possible place.
- **Cap review rounds at two.** Unlimited rounds are how a 30-hour deck becomes a three-week deck without becoming better.
- **Fix your visual register once.** Choosing a look per-deck re-litigates a solved problem every time.

Do those four and a from-scratch deck lands nearer 20 hours than 40. Automate the first one entirely and the rest of the process stops being the bottleneck at all.`,
};
