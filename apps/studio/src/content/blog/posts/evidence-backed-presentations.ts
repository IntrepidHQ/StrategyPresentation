import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "evidence-backed-presentations",
  title: "Why do claims without sources lose deals? The case for evidence-backed presentations",
  description:
    "Uncited claims put the burden of belief on your buyer. How citation-first slides change the room, what counts as a source, and how to retrofit receipts into an existing deck.",
  date: "2026-07-07",
  author: "Hans Turner",
  tags: ["Evidence", "Credibility", "Sales"],
  ogImage: "/templates/signal.png",
  answer:
    "An uncited claim forces the buyer to either trust you or argue with you — and buyers who argue don't sign. Citing a source on the slide moves the claim from your opinion to the public record, so the meeting stops debating whether things are true and starts deciding what to do about them. One unsupported number can downgrade the credibility of every supported one around it.",
  faq: [
    {
      q: "What counts as a citable source in a sales presentation?",
      a: "Anything the buyer could verify without you in the room: public registries, review platforms, archived pages, performance test results, screenshots with dates, their own analytics. A source you generated yourself is fine if it's reproducible — name the method next to the number.",
    },
    {
      q: "Do citations clutter slides?",
      a: "Not if they're set as a small source line under the claim rather than academic footnotes. One line — what the source is and when it was checked — is enough. The visual cost is a few points of type; the credibility gain applies to every other slide in the deck.",
    },
    {
      q: "What should I do with a claim I can't source?",
      a: "Label it as judgment, move it next to something verifiable, or cut it. 'In our experience' framing is honest and survives scrutiny; a bare number that can't be traced does not. If the claim carries the whole argument and can't be verified, the argument needs rebuilding.",
    },
  ],
  related: ["turn-website-audit-into-pitch-deck", "website-credibility-score-explained", "pitch-deck-structure-11-slides"],
  body: `There's a moment in every pitch where the room decides whether you're a source of information or a source of noise. It rarely announces itself. Someone reads a bullet — "customers abandon slow sites" or "your reputation lags the category" — and silently asks the only question that matters: *says who?* If the slide doesn't answer, the buyer answers for you, and their answer is a discount on everything you say next.

This piece is about that moment: why it decides deals, what actually counts as evidence, and how to build — or retrofit — a deck where every load-bearing claim carries its receipt.

## What happens in the room when a claim has no source?

Three things, usually in order:

1. **The burden of belief transfers to the buyer.** They must now decide, mid-meeting, whether to take your word. That's cognitive work you assigned them, and it interrupts the argument you were building.
2. **The claim becomes debatable.** An uncited assertion is an opening bid in an argument. Someone in the room — often the person whose work the claim implicates — will push back, and now the meeting is about whether the claim is true instead of what to do about it.
3. **The discount spreads.** This is the expensive part. Buyers don't maintain per-claim trust ledgers; they form an overall judgment. One number that smells invented marks *you* as someone whose numbers need checking. Your cited claims now pay the tax too.

The inverse is just as real. A slide that says "no registration record found for the operating name — checked against the state registry, July 2026" doesn't invite debate. There's nothing to debate. The conversation moves immediately to consequence and remedy, which is where deals actually close.

## What counts as a source?

A source is anything the buyer could check without you in the room. In practice, five families:

- **Public records.** Business registries, court records, domain registration history, archived versions of pages. Boring, and devastating, because they're independent of everyone's opinion.
- **Third-party platforms.** Review sites, app stores, social profiles, press. Imperfect individually; convincing in aggregate, especially when several disagree with the story the website tells.
- **Reproducible tests.** Page performance, mobile rendering, accessibility audits, broken-link crawls. Name the tool and the date; anyone can re-run it.
- **The buyer's own data.** Their analytics, their support tickets, their churn. The most persuasive family, because the buyer can't discount their own numbers.
- **Dated observation.** A screenshot with a timestamp is evidence. "Your checkout errors on a phone" is a claim; a July 14th screenshot of the error is a fact.

Notice what's *not* on the list: industry statistics of unstated origin. "Studies show 75% of users judge credibility by design" has appeared in a thousand decks, almost always uncited, and sophisticated buyers have learned to hear it as filler. If you can't name the study, the year, and the method, the sentence is doing negative work. Cut it and show the buyer's own homepage on a phone instead.

## How do you build a deck that's evidence-first rather than evidence-garnished?

The difference is architectural. Evidence-garnished decks are written first and sourced later — someone drafts the argument, then hunts for numbers that agree with it. Evidence-first decks are built the other way: collect what's verifiably true, then let the argument be whatever the evidence supports.

This is the entire design principle behind [Strategy Presentation](/home). Every deck it renders starts life as a [WebsiteCreditScore](https://www.websitecreditscore.com) scan — an AI research agent that reads a business's public record and grades ten weighted dimensions, from business legitimacy to financial signals, with each finding cited to where it came from. The deck inherits the citations. Nothing on the evidence slides is invented, and when a real scan doesn't exist, the system says so and shows a clearly-labeled sample instead of quietly faking one. That last behavior is a policy worth stealing for your own decks: **when you don't have the evidence, label the gap.** Buyers forgive gaps; they don't forgive discovering one you painted over.

Three working rules for the build:

1. **Every load-bearing claim gets a source line.** Small type, under the claim: what was checked, where, when. If a claim carries the verdict and can't be sourced, the verdict changes.
2. **Separate facts from judgment typographically.** Findings in one visual register, your interpretation in another. Buyers relax when they can see which is which — it signals you know the difference.
3. **Cite against interest occasionally.** Include the finding that mildly complicates your pitch ("technical health is genuinely strong — this is not a rebuild"). One claim against interest buys disproportionate trust for the claims in your favor.

## Can you retrofit citations into an existing deck?

Yes, and it's a brutal, useful afternoon. Print the deck. Underline every empirical claim — every sentence that asserts something about the world rather than proposing something. For each one, write in the margin where a skeptical buyer could verify it. You'll end up with three piles:

- **Sourceable now.** Add the source line. Done.
- **Sourceable with work.** A test you can run, a registry you can check, a screenshot you can take. Do the work; this pile usually contains your strongest future slides.
- **Not sourceable.** Reframe as explicit judgment ("our read, having done this for years…") or delete. Most decks lose 20–30% of their bullets here and read *stronger* afterward, because everything that remains can look a skeptic in the eye.

## Does evidence-first actually change outcomes?

Here's the honest version, consistent with this article's own rules: we're not going to hand you an uncited conversion statistic about citations. What we can tell you is mechanical. Meetings have a fixed budget of attention, and every minute spent litigating whether a claim is true is a minute not spent on the plan, the price, and the ask. Citations spend that budget where deals close. That's an argument from structure, not from a survey — you can check it against your own last five pitches, which is exactly the kind of source we recommend.

If you want to see what a fully-cited deck feels like, paste a website into [the live demo](/home#demo). Every finding in the deck it builds carries its receipt — and the difference in how that reads is the whole thesis of this post, rendered.`,
};
