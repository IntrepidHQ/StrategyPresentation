import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "present-website-audit-to-client",
  title: "How to present a website audit to a client without losing the room",
  description:
    "Audit meetings die of completeness. The fifteen-minute walkthrough that survives: verdict first, three to five cited findings, a priced plan, one ask — and the audit in the appendix.",
  date: "2026-06-26",
  author: "Hans Turner",
  tags: ["Playbook", "Audits", "Client work"],
  ogImage: "/templates/editorial.png",
  answer:
    "Present the verdict first, then walk only the three to five findings that prove it — each cited to a source the client can check — and end on a priced plan and a single ask. The full audit goes in an appendix, not on screen. Rooms are lost when auditors present findings in the order the tool produced them instead of the order the decision needs.",
  faq: [
    {
      q: "Should I send the audit before the meeting or reveal it live?",
      a: "Send the presentation ahead — never ambush a client with bad news about their own business in front of their colleagues — but insist on walking it through live. The document sent ahead earns you a calm first read; the live walkthrough is where sequence, emphasis, and the ask actually happen. What you shouldn't send ahead is the raw audit export; that invites a self-guided tour through the weeds.",
    },
    {
      q: "What if the person who built the website is in the meeting?",
      a: "Assume they are, and build for it. Cite every finding to an external source so the slide reads as the public record rather than your opinion of their work, lead with what's genuinely strong before what's broken, and frame the verdict around what the business can capture rather than who erred. You need that person as an ally in the fix — the meeting is lost the moment it becomes their trial.",
    },
    {
      q: "How long should the audit walkthrough take?",
      a: "About fifteen minutes of presenting: verdict, the score and method, three to five evidence slides, the plan, the price, the ask — then stop talking. Discussion can run as long as the client wants afterward. Walkthroughs that run forty-five minutes aren't more thorough; they're evidence the presenter couldn't choose, and the room can tell.",
    },
  ],
  related: ["turn-website-audit-into-pitch-deck", "sales-deck-vs-pitch-deck", "website-credibility-score-explained"],
  body: `There's a specific moment when an audit presentation dies, and every consultant has watched it happen. It's around minute twelve. You're sharing a spreadsheet with forty rows of findings, you're on row nine, and the client — who greeted you with real curiosity, because someone had finally looked closely at their business — has the expression of a person hearing turbulence announcements in a language they don't speak. They will thank you at minute forty. They will "review internally." You will never hear from them again.

The diagnosis matters, so let's be precise about it: the meeting didn't die because the audit was bad. It died because *completeness was presented in the order it was collected*. An audit is organized by category, because that's how tools scan; a decision is organized by argument. Presenting the first as if it were the second is how good work loses good rooms.

## Why do audit walkthroughs lose the room?

Three mechanisms, usually stacked:

- **Findings arrive without a hierarchy.** When the broken favicon and the missing business registration get equal screen time, the client learns that *you* can't tell which matters — or worse, concludes that none of it does, since it's all the same size on screen.
- **The room hears an indictment.** Whoever built, maintains, or signed off on that website is at the table. Every uncited "this is wrong" lands on a person, and a person defending their work is no longer evaluating your plan.
- **There's nothing to decide.** Forty findings is homework, not a decision. Clients don't stall because they disagree; they stall because nobody converted the findings into a single approvable next step.

Every technique below is an answer to one of these three.

## Before the meeting: choose the verdict, then ration the evidence

Read your audit once, close it, and finish the sentence: *"This business is losing opportunities because…"* That sentence is the presentation. Everything you show either proves it or doesn't get shown.

Then ration hard. Three to five findings make the case; the rest move to an appendix the client can read on their own time. This feels like withholding value — you found forty things, you want credit for forty things — but the client doesn't buy volume, they buy clarity, and the appendix still does its work silently: it's the depth that makes your five chosen findings feel chosen rather than cherry-picked.

If your audit is scored — a [WebsiteCreditScore](https://www.websitecreditscore.com) scan grades ten weighted dimensions, every finding cited to the public record — let the weights choose for you. The verdict almost always lives where heavy weight meets weak score: legitimacy gaps and reputation stalls outrank cosmetic issues by construction, which is exactly the hierarchy your room needs to see.

Send the presentation the day before. Nobody processes bad news about their own business for the first time in front of colleagues; the advance copy lets the defensiveness happen in private, so the meeting can be about the plan.

## The walkthrough: fifteen minutes, in decision order

**Open with the verdict — one slide, one sentence.** Not the methodology, not the agenda, not your firm. The client's question is "how bad is it and what does it mean"; answer it in the first thirty seconds and every subsequent slide gets read as evidence instead of suspense.

**Show the score with its method attached.** "Sixty-two out of a hundred, graded across ten weighted dimensions of the public record" is a fundamentally different sentence than "we give it a six out of ten." The first invites checking; the second invites debate. Name what was measured and where the data came from, then move — the methodology deep-dive belongs in the appendix.

**Walk the three to five findings, receipts first.** Each evidence slide carries the observation stated neutrally, the source it came from, and what it's plausibly costing. The citation is your defensiveness insurance: "the state registry returns no record for the operating name — checked June 2026" is the public record talking, and nobody in the room built the public record. Where the cost is an inference rather than a measurement, say so out loud. Flagged uncertainty spends like honesty, because it is.

**Pair every wound with what's healthy.** Somewhere early, name what's genuinely strong — "technical health is solid; this is not a rebuild." One finding against your own interest buys credibility for every finding in your favor, and it tells the person who built the site that you can see what they did right.

**Land on the plan, the price, and one ask.** The plan has an order with reasons. The price is an itemized build sheet, milestone-split, where every line traces back to a finding the room just saw. And the ask is singular — approve the first milestone, book the working session — with a date on it. We've written elsewhere about [why decks with the buyer as protagonist close and vendor-centric ones don't](/blog/sales-deck-vs-pitch-deck); the audit walkthrough is that principle at its purest, because the entire document is about them.

Then the hardest instruction in this playbook: **stop talking.** Leave the ask on screen. The silence after an ask isn't awkward; it's the sound of a decision assembling, and every additional sentence you add gives the room a reason to postpone it.

## Handling the hard moments

**"Who's to blame for this?"** Refuse the frame, gently: "This is what the public record looks like today — the interesting question is which of these moves first." You're paid for the fix, not the autopsy.

**The methodology challenge.** Someone will probe whether the scoring is rigorous. This is where cited, reproducible findings win the day — invite the check: "every line names its source; pull any of them up right now." Confidence in front of a verifiable claim reads completely differently than confidence in front of an opinion.

**The rabbit hole.** A director wants to spend ten minutes on finding #23 from the appendix. Honor it briefly, then reattach it to the argument: "worth fixing, and it's sequenced in phase two — the verdict doesn't turn on it." The appendix exists precisely so that depth has somewhere to live other than your fifteen minutes.

**The question you can't answer.** Say so, write it down visibly, and date your follow-up. An honest gap, labeled, outperforms improvisation — the same policy we hold our own [deck-building pipeline](/blog/how-ai-builds-a-pitch-deck) to, and rooms reward it in humans just as reliably.

## The delivery detail that quietly matters

Present from a document that cannot fail in front of the client. An audit walkthrough that opens with a login prompt, a permissions request, or fonts reflowing on the boardroom machine has spent its credibility before slide one — a presentation about *their* operational sloppiness cannot afford any of its own. This is why our decks ship as [one self-contained HTML file](/blog/html-presentations-vs-powerpoint): offline-capable, identical on every screen, forwardable to the decision-maker who missed the meeting.

And if you'd rather inspect the format than imagine it: paste any site into [the live demo](/home#demo) and watch an audit become exactly this walkthrough — verdict, cited evidence in decision order, build sheet, single ask. The room-losing version of the audit meeting is a choice. So is the other kind.`,
};
