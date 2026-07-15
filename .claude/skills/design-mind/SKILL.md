---
name: design-mind
description: Design taste and reference system for StrategyPresentation (strategypresentation.com) — the landing page, the studio app, and the deck templates. Load this before any visual/UI/CSS work on this repo. Grows over time — every time you research or get shown great design, add it to the Reference Log below.
---

# Design Mind

Hans's own words, verbatim, on why this exists: *"I'm just genuinely not impressed with the current sp website... build this into our claude code workflow somehow. If I feed it good design as context it should improve and grow."*

This file is that mechanism. It is not a one-time mood board — it's a **living skill**. Every future session that touches SP's visual design should (1) read this first, (2) apply the distilled system below, and (3) when it sees or is shown genuinely great design, add a dated entry to the Reference Log so the next session inherits it too. The value compounds only if this file keeps growing — don't let it go stale.

## The standing diagnosis (2026-07-15)

Before this pass, SP's landing page and deck templates were **competent but generic** — solid Tailwind-template energy: flat single-color backgrounds, a serif/sans pairing with an italic-gold accent word that is an extremely common 2024-2025 SaaS pattern, no imagery or product presence in the hero, no depth, no texture, no motion beyond basic fades. The irony: a *pitch-deck generator's own marketing site* had zero visual proof it makes pitch decks. The deck templates themselves read as data-dashboard slides (a plain donut chart, a two-column split, system fonts) rather than something a founder would be excited to send an investor.

The fix isn't "add more gold gradients." It's the specific, concrete techniques below, extracted from products that are genuinely excellent at this — not generic inspiration, actual mechanics you can implement.

## Reference log

Append new entries here. Each entry: what you looked at, the date, and — most important — **3-5 concrete, implementable mechanics**, not vibes ("looks premium" is not a mechanic; "sharp foreground text over intentionally blurred, scattered real-product thumbnails to fake depth-of-field cheaply in CSS" is).

### Pitch.com (2026-07-15)
The most directly relevant reference — dedicated presentation software.
- **Depth-of-field hero collage**: real slide/deck thumbnails (their own actual templates — "Business Model Canvas," "Editorial Template," a proposal deck) scattered around the hero at different scales, blurred (`filter: blur()`, varying amounts) and given a translucent scrim, with the sharp bold headline layered on top. This fakes a camera depth-of-field effect cheaply in CSS and — critically — is instant, wordless proof that the product makes beautiful decks. SP's hero should do the same with its own 6 templates' cover slides.
- **Crisp anchor screenshot below the fold**: after the blurred collage, one **fully sharp, real, browser-chrome-framed screenshot** of the actual editor UI. Blur for atmosphere, sharpness for proof.
- **Rich, deep background color** (a saturated deep violet/purple gradient), not flat black or white. Color has actual depth via gradient, not a single flat swatch.
- **Huge, heavy, geometric-grotesque display type** (not a serif), tight tracking, very large scale — the type carries the page, imagery supports it.
- **Scattered/collage layout over rigid grid** for the supporting visual elements — feels alive, not templated.

### Linear.app (2026-07-15)
The opposite move — pure restraint and confidence, worth knowing when *not* to add richness.
- **Real, unblurred product screenshot immediately below an enormous headline** — no illustration, no abstraction, the actual app UI is the hero visual.
- **Extreme color restraint**: near-monochrome (pure black canvas, white/gray type), one accent used sparingly (a tiny "New ↗" callout, not a big gradient CTA button).
- **Type does the work**: huge (~64-80px+), heavy weight, tight line-height, 2-line max headlines. Subhead is short, muted, matter-of-fact — no marketing fluff ("Purpose-built for planning and building products. Designed for the AI era.").
- **Generous negative space above the product shot** — the restraint itself reads as confidence/premium, not a lack of content.
- **Lesson for SP**: rich ≠ better everywhere. The hero can be rich (Pitch-style), but data/proof sections (scorecards, credibility sections) should borrow Linear's discipline — real screenshots, minimal chrome, let the content be the decoration.

### (Next entry goes here — date it, name the source, extract mechanics not adjectives.)

## The SP design system (distilled from the above, applied 2026-07-15)

These are the actual tokens/rules implemented in `apps/studio/src/app/home/home.css` (landing) and `apps/studio/src/lib/deck/base-css.ts` + `themes.ts` (the 6 deck templates, which share one base — improving it improves all 6 at once):

- **Type scale**: display headlines use `clamp()` up to ~5.5-6rem, line-height 1.02-1.08, and lean on real weight contrast (600-700) rather than size alone for hierarchy. No more than 2 lines in a hero headline.
- **Depth over flatness**: every hero-class surface gets a layered background — a gradient mesh or radial glow, *plus* (on the landing page specifically) a blurred collage of the product's own actual output (deck cover-slide thumbnails) — never a single flat color as the entire canvas.
- **Real product presence, always**: any surface selling "this makes X" must show real X within the first viewport. For SP that means an actual rendered deck slide (screenshot or live iframe), not a text-only claim.
- **Motion with intent**: reveals stagger (already built), but depth-bearing background elements should have slow, independent parallax/drift — motion that implies dimensionality, not just fade-in-on-scroll. Always gated behind `prefers-reduced-motion`.
- **Restraint in data-density zones**: scorecards, the build-sheet, and other information-dense slides stay disciplined (Linear-style) — no competing decoration once real data/content is present. Richness belongs in hero/cover moments; clarity belongs everywhere data is being read.
- **One accent, used with intent**: the gold accent stays, but should read as *precious* (used sparingly, on the one thing that matters per screen) rather than smeared across every heading.

## Pre-flight checklist (run before shipping any visual change to SP)

1. Does the first viewport show **real product**, not just a claim about the product?
2. Is there **depth** (gradient, blur-layered elements, or genuine imagery) — or is it one flat color again?
3. Is the type scale **confident** — would this headline look small next to Linear's or Pitch's?
4. Is motion **present but restrained**, and does it fully disable under reduced-motion?
5. In data-dense zones, did richness get dialed back down to Linear-level discipline?
6. Screenshot it at desktop + mobile + dark/light before calling it done — don't ship on vibes, verify with the browser tool.

## How to grow this (do this, don't skip it)

Whenever you (a future session) research design, get shown a reference by Hans, or notice something genuinely excellent while working: open it in the browser tool, actually look at it, and add a dated entry above with **concrete mechanics**, not adjectives. If a redesign pass changes the tokens in "The SP design system" section, update that section too so it stays the single source of truth for what SP currently looks like and why.
