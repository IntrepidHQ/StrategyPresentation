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

### FusionForce pitch deck — Dhefry Andirezha / One Week Wonders, Dribbble shot 24246998 (2026-07-15, supplied by Hans)
Brutalist agency deck: red-orange (#ff3d00-family), ink black, cream. **Hans declared this ½ of SP's new brand direction.**
- **Two-tone display headline**: one word/half in ink, the other in cream, set in an ultra-condensed uppercase display face at enormous scale (fills ~40% of slide height), tight negative tracking, crushed line-height. The color SPLIT is the logo-level identity move.
- **Condensed-uppercase × serif-italic collision**: the giant condensed headline is immediately followed by a high-contrast didone serif in sentence case ("Continued *Innovation.*" / "*Made Easy.*") — the pairing IS the brand voice: brutal + literary.
- **Editorial furniture as decoration**: coordinates ("40.7440° N 73.9873° W"), © marks, ✦ sparks, "2022–PRESENT" date ranges, tiny all-caps address lines scattered at slide edges. Zero-cost, huge character; reads as print ephemera.
- **Color-blocked slabs, hard edges**: slides are 2-3 solid rectangles (red/black/cream) butted together with NO gaps, radii, or shadows. Text color flips per slab. Justified micro-copy paragraphs in the slab corners.
- **Halftone/duotone photography**: photos are high-contrast halftone-dot mono treatments (never full color), cropped brutally (an eye-strip), so imagery matches the ink-on-paper energy.
- **Vertical edge-runner type**: giant rotated words running up slide edges, cropped by the frame ("SERVICES", "BRAND…") — the crop itself is the aesthetic.

### Brighter event-agency deck — Dribbble (2026-07-15, supplied by Hans)
Warm editorial deck: terracotta + cream. **The other ½ of SP's new brand direction** (the rustic/textured warmth).
- **Photo-collage covers**: 3-5 small unframed photos scattered AROUND and BEHIND a giant script/serif wordmark that overlaps them — type over imagery, not beside it.
- **A hand-drawn connector line** (one thin looping scribble/underline) crossing the cover — instant human warmth against structured layouts.
- **Stat blocks as the proof section**: "100% ON-TIME DELIVERY / 30% TIME REDUCTION / 90+ COMPLETED PROJECTS" — huge numerals, tiny caps labels, 1-line support sentence, boxed in hairline rules on cream. This is the "Why choose us" pattern to copy.
- **Hairline-boxed labels** ("CORPORATE EVENTS AND TEAM BUILDING") instead of filled buttons/pills.
- **Numbered slides ("02", "06") in a corner** — deck-ness as a design feature.
- Mostly-image decks (Hans's mp4 example, same family): full-bleed photography per slide with a single short line of type — when imagery is strong, the layout should get out of the way entirely.

### THE SP BRAND DECISION — "Voltage" (2026-07-15, Hans, verbatim direction)
*"The strategypresentation brand should look like this super wild mix of the two images... Brutalist, bright, a rustic textured, electric blue bg, ADA compliant white or black so we can use both, and with splashes."* And: the landing page should itself BE a presentation — *"I'd prefer if it was a presentation itself so that it really sells."*
- **Canvas: electric blue `#1a2be0`** (white on it = 8.5:1 AAA, cream `#f4eee1` on it = 7.4:1 AAA). Black `#0c0c0c` is NOT for text on blue (2.3:1) — black text lives on cream/white slabs. That's the "white or black so we can use both" rule, verified with WCAG math.
- **Splash accent: `#ff3d00`** red-orange (FusionForce), decoration + large display only on cream.
- **Texture: rustic grain** via an SVG `feTurbulence` fractalNoise data-URI overlaid at low opacity — the "printed poster" feel, costs zero requests.
- **Splashes**: organic SVG ink-splat blobs + ✦ marks, scattered at slide edges.
- Display face (self-contained decks can't load webfonts): `Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif-condensed` uppercase; serif italic: `Didot, "Bodoni MT", "Playfair Display", Georgia, serif`. On the landing (webfonts OK): Archivo Black / Fraunces italic.

### BRAND v2 — "Blueprint" (2026-07-15, Hans's revision after seeing Voltage v1 live)
Hans, verbatim: *"I'd rather see the full hero be the same blue and the text be white and this look kind of like a blue print style... Again I don't like this light bgs. Just make the whole site blue with black and white text. Add a paper like texture... The bold font used in headers should be a bit more condensed and paired with instrument serif as the serif. Definitely lose that orange color and just go monochrome."* Also: the splash art becomes **particle chess pieces** (brainztem's particle-thread style, but knight/queen/bishop clustered on the hero, other pieces in negative space as you scroll), copy re-aimed at the small-business owner debating their first hire (EA/content writer) with Brainztem as the answer, and templates get Lovable-style click-to-preview popups.
- **Canvas: ONE color.** Electric blue everywhere; no cream/light slabs on the site. White text (8.5:1), black reserved for chrome accents (counter chip, buttons) — never body text on blue (2.3:1 fails).
- **Blueprint texture**: fine white grid (24px minor / 120px major, ≤0.10 alpha lines) + paper grain (feTurbulence) over the blue — drafting-table energy.
- **Type v2**: Anton (more condensed than Archivo Black) + **Instrument Serif** italic + Inter body.
- **Monochrome**: the red-orange is GONE from the site. Decoration = white particle line-work only.
- **Particle chess pieces**: ASCII-mask-sampled point clouds with near-neighbor threads (chess-art.ts) — the brand's illustration system. Pieces = strategy; blueprint = the plan.
- Lesson: v1's FusionForce cream/red read as "another loud agency"; Hans wanted the *drafting room*, not the *print shop*. When a client says "blueprint," kill every warm hue.

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
