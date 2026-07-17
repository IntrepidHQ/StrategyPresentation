import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "website-credibility-score-explained",
  title: "Website credibility scores explained: what does a 62/100 actually mean?",
  description:
    "How a website credibility score is computed, what the ten weighted dimensions measure, why 62/100 is a D-, and which fixes move the number fastest.",
  date: "2026-07-04",
  author: "Hans Turner",
  tags: ["WebsiteCreditScore", "Credibility", "Audits"],
  ogImage: "/templates/monospace.png",
  answer:
    "A 62/100 on WebsiteCreditScore is a D- — the site isn't a scam signal, but a stranger doing five minutes of diligence would find real reasons to hesitate. The score is a weighted blend of ten dimensions, so a 62 usually means weakness in the heavy ones: business legitimacy (18% of the grade), online reputation (15%), or visual design (14%). Those heavy dimensions are also where fixes move the number fastest.",
  faq: [
    {
      q: "Is a credibility score the same as an SEO score?",
      a: "No. SEO tools measure how easily machines can find and rank a site. A credibility score measures whether a human — or increasingly an AI assistant — doing diligence would trust the business behind it: registration records, reputation, transparency, design, technical health. A site can rank well and still fail the trust check.",
    },
    {
      q: "What score should a small business aim for?",
      a: "The 80s — a B range — is a realistic, meaningful target. It generally means verifiable registration, consistent contact details, a real team page, live reputation signals, and no technical red flags. Chasing the high 90s has diminishing returns; those bands are mostly occupied by long-established, heavily documented organizations.",
    },
    {
      q: "How fast can a 62 improve?",
      a: "Structural fixes are quick: registering the business properly, publishing a named team, unifying contact details, and repairing technical basics are days-to-weeks of work and hit the heaviest dimensions. Reputation and longevity move slowly by nature — months of accumulated reviews and history — which is why starting with the structural half is the right order.",
    },
  ],
  related: ["turn-website-audit-into-pitch-deck", "evidence-backed-presentations", "first-hire-assistant-agency-or-ai"],
  body: `A score without a rubric is a Rorschach test. Tell an owner their website scored 62/100 and they hear whatever they were already braced to hear — "fine, basically" or "disaster." Neither reading is right, and the difference matters, because what a 62 actually says is specific: *this business would not survive a stranger's five minutes of diligence without raising questions.* That's fixable, but only if you know which questions.

This post explains how a credibility score is put together, using [WebsiteCreditScore](https://www.websitecreditscore.com) — the scan engine behind every Strategy Presentation deck — as the worked example, and then reads a 62 the way the grader does.

## What is a website credibility score measuring?

Not beauty, and not search ranking. The question a credibility score answers is the one a careful buyer, lender, partner — or, increasingly, an AI assistant asked "should I trust this company?" — works through before committing: is the business behind this website real, reputable, transparent, and competently run?

WebsiteCreditScore answers it by reading the public record, not just the site itself: business registries, review platforms, press, social presence, domain history, technical tests. Every finding is cited to its source, and the result is graded across ten dimensions, each with a fixed weight in the overall score.

## The ten dimensions, and why the weights differ

1. **Business legitimacy — 18%.** The heaviest dimension, because everything else collapses without it. Registration records, address verification, consistent contact details, named and findable leadership.
2. **Online reputation — 15%.** Review volume, recency, sentiment composition, and how the business responds to criticism — not just the star average.
3. **Visual design — 14%.** Design quality is measurable and correlates with trust; this dimension scores hierarchy, consistency, and whether the site looks maintained or abandoned.
4. **UX and conversion — 12%.** The path from intent to action: mobile experience, navigation, friction in the moments that make money.
5. **Transparency — 10%.** Pricing visibility, real policies, an about page with humans on it, ways to reach those humans.
6. **Technical health — 8%.** The objective one: certificate configuration, load performance, uptime signals, broken infrastructure.
7. **Content quality — 8%.** Whether the site explains what the business does clearly, correctly, and recently.
8. **Social and press presence — 7%.** Third-party footprint: is anyone else talking about this business, and do the profiles that exist show life?
9. **Domain longevity — 5%.** Time in operation as a background risk signal.
10. **Financial signals — 3%.** The smallest weight — public financial health markers, where they exist.

The weights encode a worldview worth stating plainly: **identity outranks polish.** A gorgeous site from an unverifiable operator scores worse than a plain site from a registered business with a named team and honest policies — because that's exactly how a competent human diligence check works.

## So what does a 62 actually mean?

On the grade bands WebsiteCreditScore uses, 62 falls in the D range — one point under the D cutoff at 63, so it prints as a **D-**. The bands run from A+ (97 and up) down through B- at 80, C- at 70, and F below 60. A 62 is therefore two points from failing — but also only eight points from the C range, which tells you something about how much low-hanging weight is usually sitting in a score like this.

Because the score is a weighted blend, a 62 is almost never "everything is mediocre." The far more common shape: strong technical health and decent design pulled down hard by the heavy dimensions — no registration trail a buyer can find, a reputation that's thin or stale rather than bad, contact details that disagree between the site and its Google profile, an about page with no humans on it. Individually each looks cosmetic. Blended at 18% and 15% and 10%, they're the difference between a D- and a B.

The verdict layer matters as much as the number. A 62 doesn't say *scam*. It says *unverifiable in places where verification is cheap* — and in a diligence check, unverifiable and untrustworthy produce the same outcome: the buyer moves on, and never tells you why.

## Which fixes move a 62 fastest?

Weight × effort is the whole strategy. In rough order of return:

1. **Close the legitimacy gaps.** Register or document the entity properly, publish a named team with real profiles, and make the address and phone number agree everywhere they appear. This is the 18% dimension, and most of it is administrative work, not engineering.
2. **Show the humans.** An about page with names, faces, and history serves legitimacy and transparency simultaneously — two dimensions, one afternoon.
3. **Repair technical red flags.** Certificate issues, dead links, and slow pages are the objective, checkable failures — and because they're binary, they're also the fastest to turn green.
4. **Wake the reputation up.** You can't manufacture months of reviews, but you can respond to the ones that exist and make asking for them part of the operation. Recency counts; a profile that went quiet in 2024 reads as a business that might have too.
5. **Let longevity accrue.** The 5% you can't rush. It's the argument for fixing everything else now — time only converts into trust if the record it accumulates is clean.

The honest caveat: half of this list isn't a website project, it's an *operations* project — reviews, content freshness, follow-ups, keeping profiles alive. That's precisely the work that stalls when the owner is the only operator, which is why our decks often pair the diagnosis with [Brainztem](https://brainztem.com), an AI operations system that runs exactly that layer — and why the [first-hire question](/blog/first-hire-assistant-agency-or-ai) keeps showing up next to credibility scores.

## How do you use the score commercially?

If the 62 is *your* score: it's a prioritized to-do list wearing a grade, and the dimension breakdown is the priority order.

If you're a consultant or agency, a scored, cited audit is the strongest cold open a pitch can have — a verdict about the client's business, backed by the public record, that they can check line by line. The conversion from scan to deck is mechanical from there: pick the verdict the findings support, sequence the evidence, price the fix. We've written that up as a [step-by-step playbook](/blog/turn-website-audit-into-pitch-deck), and the principle underneath it — [claims with receipts close; claims without them stall](/blog/evidence-backed-presentations) — is the whole reason the score cites its sources.

Or skip straight to seeing it: paste a website into [the live demo](/home#demo) and Strategy Presentation will build the deck from a real scan — score, dimension evidence, and build sheet included. If the site's been scanned before, you'll be reading its actual public record inside a pitch within a minute.`,
};
