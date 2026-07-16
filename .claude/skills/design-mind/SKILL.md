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

### Brand v2.1 — 3D particle system + Blueprint template (2026-07-15, Hans: "improve that artwork greatly")
- **Particle art rule: fake 3D is not enough.** Flat silhouette masks read as "confetti in a shape." Genuine depth needs: surfaces of revolution sampled by area (lathe profiles for turned chess pieces), a directional light (dot(normal, light)), a **rim-glow term** (grazing normals brighten — this is what makes point clouds look lit), perspective projection, depth-sorted painting, and a **ground-scatter ring** to seat the object. ~1.5-2.5K particles/piece at small radii beats 500 big blobs. All in `chess-art.ts`.
- **8th deck template `blueprint`**: the site brand as a deck — blue sheet, blueprint grid + grain on body, white line-work, and the cover's second headline half rendered as OUTLINED text (`-webkit-text-stroke`, transparent fill, @supports fallback) — drawn, not filled.
- **All-8 polish**: cover marks row now on every theme (✦ takes --accent); per-theme signatures — summit double-rule small-caps marks, signal beam under h1, editorial hairline magazine frame, monospace "> " eyebrow + dashed hairlines, gallery ghost terracotta folio, beacon sunrise arc, voltage splash/band, blueprint outline+grid.

### Interactive particle chess — real geometry beats generative (2026-07-15, Hans: "use a royalty free 3d model... so realistic that when you click one it falls down and rolls")
- **When silhouette fidelity matters, sample a real mesh.** Hand-tuned lathe profiles held up for turned pieces; the knight never did. Khronos glTF-Sample-Assets "ABeautifulGame" (CC BY 4.0, credit ASWF + Ed Mackey in footer) → surface-sample triangles area-weighted → quantized point cloud (Int16 pos + Int8 normals, 227KB for 6 pieces at 4.2K pts) in public/chess-points.bin. Extraction script pattern lives in the scratchpad/git history (extract.py).
- **Stickiness = physics.** three.js Points + custom shader (diffuse + rim per particle) over cannon-es rigid bodies (cylinder colliders from piece base radii). Click → raycast proxy → impulse at hit point → topple/roll/collide → all-asleep or 9s → easeOut glide home. Progressive enhancement: server-rendered SVG stays for no-JS/no-WebGL/reduced-motion.
- **Gotchas burned here:** `.lp-chess { pointer-events:none }` also killed canvas clicks (re-enable on the canvas); any new public/ asset must be added to the proxy's PUBLIC_PATHS or it 307s to /login; gl_PointSize needs px-scale ≈ viewportH × 0.0085 (a 1.0 factor fills the screen with blobs); headless Playwright needs `--use-angle=swiftshader --enable-unsafe-swiftshader` for WebGL.

### Brand v2.2 — the human layer + the sheet itself (2026-07-15, Hans)
- **Logo**: the king. Clean filled-vector silhouette (cross, orb, tapered body, plinth) in `doodles.tsx` `KingMark` + `src/app/icon.svg` (white on #1a2be0). currentColor so it sits anywhere.
- **Doodle collage** (`doodles.tsx`): handwritten to-do notes (font stack 'Segoe Print'/'Bradley Hand'/'Chalkboard SE'/cursive — no webfont needed) with the WORK items scratched out by rough curved strokes ("the app did it") and a life-list left untouched; one-line stroke figures (feet up w/ coffee, laughing on phone, cheers, dog run) — 2.6px round-cap strokes, blob heads. Tilted 2-6°, opacities .8-.92, aria-hidden, most hidden <960px. NO stock photography — the line-work IS the brand's people.
- **Rolled-blueprint edges**: fixed 9px strips on all four sides showing the paper color #efe6d4 with an ORGANIC torn inner edge (irregular node spacing + 2.5-6.5px varied depths, 260px repeat — regular sawtooth reads as rick-rack trim, avoid). html background = same paper so overscroll stays in-world. z-index 80, pointer-events none.
- **Hero composition rule**: stage in DEPTH, not a lineup — far piece upstage-left, tall pair just off center, one piece downstage cropped by the frame edge (the crop = energy). Wide lens (fov 46-48) + low off-axis camera.

### Brand v2.3 — the chess planet + restraint rules (2026-07-15, Hans's sketch)
- **The hero is a little-planet shot** (Hans's ink sketch): a checkerboard SPHERE of ~26K particles (lat/long 14×10 fields; light squares dense at lum .88, dark squares sparse ink speckle at .24) with nine pieces standing radially on the surface, oriented along surface normals with per-piece spin. Central-gravity physics (world gravity zero; per-frame force toward the core; static Sphere collider) — click → blast off → tumble → glide home.
- **Per-material point-size multipliers matter**: the globe reads crisp at 0.5× the piece size; without it everything blows out into blobs. Same shader, different uScale.
- **Never crop a piece with a harsh canvas edge** — compose so the full object fits, and run the canvas to the viewport edge instead (Hans: "I don't ever really wanna see just a harsh edge").
- **Worn ≠ shredded**: paper tears cover ~1/6 of each edge as isolated patches, absolutely positioned so they SCROLL with the document (top tears exist only at the top of the site, bottom only at the end), tapered ends via mask-image. Full-perimeter fixed strips read as "torn-up paper."
- **Orphan policy**: text-wrap balance on display/lede, pretty on body, plus explicit nbsp joins on short label lines ("every&nbsp;year", "build,&nbsp;once"). Hans checks for orphans at every size.
- Doodle figures need explicit necks + faces on ALL actors (the dog needs a head too), or they read as broken.

### Brand v2.4 — motion system + full-3D everywhere (2026-07-15, Hans's detail pass)
- **The planet rotates** (0.055 rad/s): sleeping bodies ride the spin kinematically (re-home each frame via rotated home transforms); poked pieces exit the carousel and glide back to the CURRENT rotated square. Pivot math for world-baked geometry: pos = c − R·c.
- **Physics restraint**: wake ONLY the clicked body — cannon wakes neighbors on real contact; waking everything makes the whole scene explode (Hans: "they all went crazy"). Damping 0.35/0.22, impulse ~1.3.
- **PieceScene**: every chess appearance is a live 3D vignette (shared points-lib loader+shaders, IntersectionObserver lazy-boot, SVG fallback inside). No static pieces anywhere.
- **CheckerWave**: the closing texture = checkered particle cloth, sine-wave displaced in-shader with analytic normals; under the footer, paused off-screen.
- **Motion system**: slide children rise-in staggered on .in (SlideCounter's observer, one-way, cover exempt); deck [data-reveal] gets nth-of-type delays; FAQ animates via ::details-content height + interpolate-size + rotating chevron; doodles have named animated parts (.d-steam/.d-tail/.d-laugh/.d-sparks). ALL behind prefers-reduced-motion.
- **Optical grid alignment**: background-position-x: calc(max((100vw − 1120px)/2, pad)) pins a major gridline to the content edge — the grid must belong to the type.
- Deck iframes: html/body overflow-x clip (previews had a horizontal scrollbar).

### Playable chess + seamless data (2026-07-16, Hans)
- **The hero is a full playable game** now (sphere-chess.ts rules engine + ChessHero WebGL): 8 ranks × 8 wrapping longitude files on the particle planet, armies on opposite hemispheres, legal move gen + check/mate, click-to-select highlights legal squares, great-circle move animation, capture-launch, drag-to-spin, HUD + reset. Physics lesson from the prior pass held: wake only the clicked body.
- **Data seams belong on HTTP, not shared DBs.** SP was reading a *copied* scans table and dead-ending on scans it hadn't copied (ford.com lived only in WCS's DB). Fix: WCS exposes GET /api/scan/{id} + /api/scan/latest; SP's wcs-scans falls back to those over HTTP (wcs-remote.ts) — SP now sees every scan WCS has, wherever stored. Deck endpoint degrades to the labeled sample instead of "Scan not found." SP /api/demo/scan runs the scan inline (proxy WCS start + drain its SSE stream) so users never bounce.
- **Copy:** "forever" reads as a threat about the app, not the hire — Hans changed it to "indefinitely."
- **CheckerWave belongs above the footer** (inside the last slide), not as a trailing section only visible after scrolling past everything.

### Chess quality + real-paper (2026-07-16, Hans)
- **Two-color particle armies + black finial ball.** All-white pieces read flat; give each army a uColor (white vs dark-slate) and a pure-BLACK finial ball at each piece's tip (a small particle sphere with an aBlack flag). Dark army needs a strong silhouette rim (uRim ~0.85) or it vanishes on the blue.
- **Crisp = uniform small particles, NO size-by-brightness.** The blur was `gl_PointSize = (0.65 + vL*1.15)*…`. Fix: constant small point size; carry shading with per-particle brightness + a near-hard sprite edge (smoothstep 0.5→0.42) + density. "Smaller, same size, shade by nearness."
- **Dumb-on-purpose AI is the right call for a hero toy.** Black = instant random legal move (slight capture bias) so visitors crush it; human plays White only; ~260ms reply feels snappy.
- **Load phases svg→boot→live** so a refresh never flashes the previous illustration; boot shows a quiet placeholder, the static SVG is for no-WebGL only.
- **Paper wears at the CORNERS, not the edges.** Gradient-masked edge strips read as gradients (Hans hated them). Real paper: 4 corner blotches in the sheet color with a feTurbulence-torn edge, plus one subtle diagonal fold crease + a faint radial wrinkle. Fixed to the viewport.
- Full-wrap 8-file board can't be truly square (columns fixed at 45° lon); widening rank bands to ±66° is the most squaring you get.

### Density pass + the invisible-mobile bug (2026-07-16, Hans)
- **Density is the cheapest realism upgrade.** `densify()` in points-lib clones each stored point with a small jitter TANGENT to the surface (perpendicular to its normal) — extra particles stay ON the piece instead of fuzzing it. Hero pieces 5.2K/4.6K/4.2K/2.8K samples, vignettes 2×, globe 30K→52K + brighter lum (0.96) + tighter grooves (1.15°). Same small uniform point size; density carries the solidity.
- **Reveal thresholds must assume tall slides.** SlideCounter added `.in` at intersection ratio 0.35 — on phones a slide is ~3× the viewport so 0.35 NEVER fires and children sat at opacity 0 forever ("nothing but negative space", Hans). Fix: reveal at ANY intersection; gate only the counter label on ratio ≥0.35 OR intersectionRect covering ≥55% of the viewport.
- **Phones: kill the 100vh floor on content slides.** `min-height: 0` below 720px (cover keeps its full viewport); decorative pieces tuck into corners at ~0.45 opacity behind the content layer; drop doodle notes that would sit on a form.
- **Gameplay: the piece IS the target.** Clicking an enemy piece you can legally capture executes the capture — aiming at the small square disc under it was fiddly.
- **Trial-as-product shell (brainztem):** a trial should look like the buyer's OWN app — left sidebar with THEIR logo/accent (prefilled from brand hints, confirmed in a 3-click guided setup), not marketing chrome; the in-app chrome (checklists/docks) must be gated to app routes so public trials stay clean.

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
