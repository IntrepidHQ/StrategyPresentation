// ============================================================
//  SP Deck Engine — Shared base stylesheet
//  apps/studio/src/lib/deck/base-css.ts
//
//  One accessible base inherited by all six templates. Themes
//  only supply CSS custom properties + small layout overrides.
//
//  Accessibility contract (WCAG 2.1 AA):
//   - every --text/--muted token pairs >=4.5:1 with --bg and --surface
//   - --accent is used for large text/graphics only (>=3:1);
//     --accent-strong is the >=4.5:1 variant for normal text
//   - all motion is disabled under prefers-reduced-motion
//   - content is fully readable with JS disabled (reveal states
//     only apply under html.js)
// ============================================================

export const BASE_CSS = /* css */ `
*, *::before, *::after { box-sizing: border-box; }
/* The document is the scroll container, so snap lives on :root —
   NOT on .deck (a non-scrolling box must never declare snap-type). */
html { scroll-behavior: smooth; scroll-snap-type: y proximity; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: clamp(1rem, 0.95rem + 0.35vw, 1.15rem);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.visually-hidden {
  position: absolute; width: 1px; height: 1px; margin: -1px;
  clip-path: inset(50%); overflow: hidden; white-space: nowrap;
}

/* ── Skip link ── */
.skip-link {
  position: absolute; left: 1rem; top: -4rem; z-index: 60;
  background: var(--accent-strong); color: var(--on-accent);
  padding: 0.75rem 1.25rem; border-radius: var(--radius);
  font-weight: 700; text-decoration: none; transition: top 0.2s ease;
}
.skip-link:focus { top: 1rem; }

/* ── Fixed chrome ── */
.deck-header {
  position: fixed; inset: 0 0 auto 0; z-index: 40;
  display: flex; justify-content: space-between; align-items: center; gap: 1rem;
  padding: 0.9rem 1.4rem; pointer-events: none;
}
.deck-header .brand, .deck-counter {
  pointer-events: auto;
  font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--muted); background: color-mix(in srgb, var(--bg) 82%, transparent);
  padding: 0.35rem 0.7rem; border-radius: 999px; backdrop-filter: blur(6px);
  margin: 0;
}
.deck-header .brand strong { color: var(--text); font-weight: 700; }

.rail {
  position: fixed; right: 1rem; top: 50%; transform: translateY(-50%); z-index: 40;
  display: flex; flex-direction: column; gap: 0.35rem;
}
.rail a {
  display: grid; place-items: center;
  width: 44px; height: 24px; /* >=24px hit area, 44px wide strip */
  text-decoration: none;
}
.rail a::after {
  content: ""; width: 9px; height: 9px; border-radius: 50%;
  background: var(--muted); opacity: 0.55; transition: transform 0.2s ease, opacity 0.2s ease;
}
.rail a:hover::after, .rail a:focus-visible::after { opacity: 1; transform: scale(1.35); }
.rail a[aria-current="true"]::after { background: var(--accent-strong); opacity: 1; transform: scale(1.5); }
@media (max-width: 700px) { .rail { display: none; } }

.deck-nav {
  position: fixed; right: 1.2rem; bottom: 1.2rem; z-index: 40;
  display: flex; gap: 0.5rem;
}
.deck-nav button {
  width: 48px; height: 48px; border-radius: 50%;
  border: 1px solid var(--line); background: var(--surface); color: var(--text);
  font-size: 1.2rem; cursor: pointer; display: grid; place-items: center;
}
.deck-nav button:hover { border-color: var(--accent-strong); }
.deck-nav button:disabled { opacity: 0.35; cursor: default; }
#deck-playpause[aria-pressed="true"] { border-color: var(--accent-strong); color: var(--accent-strong); }

/* ── Auto-play presentation mode ── */
.deck-progress {
  position: fixed; top: 0; left: 0; z-index: 50;
  height: 3px; width: 100%;
  background: var(--accent);
  transform: scaleX(0); transform-origin: left;
  will-change: transform;
}
html.autoplaying .deck-header, html.autoplaying .rail {
  opacity: 0.35; transition: opacity 0.4s ease;
}
@media (prefers-reduced-motion: reduce) { .deck-progress { display: none; } }

:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 4px;
}

html, body { overflow-x: hidden; overflow-x: clip; } /* previews must never h-scroll */

/* ── Slides ── */
.slide {
  min-height: 100vh; min-height: 100dvh;
  scroll-snap-align: start;
  display: grid; align-items: center;
  padding: clamp(4.5rem, 8vh, 6rem) clamp(1.25rem, 5vw, 4rem);
  position: relative;
}
.slide-inner { width: min(1060px, 100%); margin-inline: auto; }
.slide + .slide { border-top: 1px solid var(--line); }

.eyebrow {
  font-size: 0.8rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--accent-strong); margin: 0 0 0.9rem;
}
h1, h2 {
  font-family: var(--font-display); color: var(--text);
  line-height: 1.12; margin: 0 0 1rem; text-wrap: balance;
}
h1 { font-size: clamp(2.3rem, 1.3rem + 4.4vw, 4.8rem); }
h2 { font-size: clamp(1.8rem, 1.2rem + 2.6vw, 3.1rem); }
h3 { font-family: var(--font-display); font-size: 1.15rem; margin: 0 0 0.4rem; }
p.lede { font-size: clamp(1.1rem, 1rem + 0.6vw, 1.35rem); color: var(--muted); max-width: 56ch; }
.muted { color: var(--muted); }

.card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 1.4rem;
  /* Restrained ambient lift, not a "floating card" effect — a theme can
     still override box-shadow directly if it wants a different treatment. */
  box-shadow: 0 1px 2px color-mix(in srgb, var(--line) 70%, transparent),
              0 8px 20px -16px color-mix(in srgb, var(--text) 30%, transparent);
}
.grid-2 { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); }
.grid-3 { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); }

/* ── Cover ──
   Depth over flatness (Design Mind): an ambient glow layered in via ::before
   so it never fights a theme's own #s-cover background declaration — themes
   that already set their own richer cover background (signal, gallery) get
   this glow blended underneath; themes that don't (summit, editorial,
   monospace, beacon) get it as their only cover depth. Either way, no
   template ships a flat void behind its opening slide. */
#s-cover::before {
  content: ""; position: absolute; inset: -15% -8% auto -8%; height: 85%;
  z-index: 0; pointer-events: none;
  background:
    radial-gradient(40rem 24rem at 86% 8%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 60%),
    radial-gradient(28rem 20rem at 4% 90%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 65%);
}
#s-cover .slide-inner { position: relative; z-index: 1; }

/* ── Cover constellation (Design Mind: Brainztem particle-brain lineage) ──
   A generative, per-client particle field threaded with near-neighbor lines,
   sitting between the ambient glow and the content. Tinted by the template's
   accent; opacity tiers keep it atmospheric, never competing with the h1. */
.cover-constellation {
  position: absolute; z-index: 0; pointer-events: none;
  top: 0; right: -4%; height: 100%; width: min(58%, 640px);
  color: var(--accent);
}
.cover-constellation .pc-threads line { stroke: currentColor; stroke-width: 0.7; opacity: 0.16; }
.cover-constellation .pc-dots circle { fill: currentColor; }
.cover-constellation .pc-t0 { opacity: 0.25; }
.cover-constellation .pc-t1 { opacity: 0.45; }
.cover-constellation .pc-t2 { opacity: 0.7; }
@media (max-width: 820px) { .cover-constellation { width: 100%; right: 0; opacity: 0.55; } }
@media (prefers-reduced-motion: no-preference) {
  .cover-constellation { animation: pc-drift 26s ease-in-out infinite alternate; }
  @keyframes pc-drift {
    from { transform: translateY(-6px); }
    to { transform: translateY(10px); }
  }
}

.cover-layout { display: grid; gap: 2.5rem; grid-template-columns: 1.2fr 0.8fr; align-items: center; position: relative; z-index: 1; }
/* Two-tone headline spans + editorial marks row — no-ops by default (spans
   inherit color; marks are hidden), activated per-theme (Voltage). */
#s-cover .cover-marks {
  display: flex; /* every theme gets the editorial marks row; themes restyle it */
  position: relative; z-index: 1; margin-top: 2.2rem; padding-top: 0.9rem;
  flex-wrap: wrap; gap: 0.6rem 1.8rem;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.22em;
  border-top: 1px solid var(--line); color: var(--muted);
}
#s-cover .cover-marks span:first-child { color: var(--accent); } /* the ✦ */
@media (max-width: 820px) { .cover-layout { grid-template-columns: 1fr; } }
.score-ring-wrap { display: grid; place-items: center; position: relative; }
.score-ring-wrap::before {
  content: ""; position: absolute; z-index: -1; inset: 8%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%);
  filter: blur(6px);
}
.score-ring { width: min(300px, 70vw); height: auto; }
.score-ring .ring-track { stroke: var(--line); }
.score-ring .ring-value { stroke: var(--accent); transition: stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1); }
.score-readout { text-align: center; }
.score-readout .big {
  font-family: var(--font-display); font-weight: 800;
  font-size: clamp(3rem, 2rem + 4vw, 4.6rem); line-height: 1; color: var(--text);
}
.score-readout .grade { font-size: 1.1rem; color: var(--accent-strong); font-weight: 700; }

/* ── Scorecard table ── */
.scorecard { width: 100%; border-collapse: collapse; }
.scorecard caption { text-align: left; padding-bottom: 0.8rem; color: var(--muted); font-size: 0.95rem; }
.scorecard th, .scorecard td { padding: 0.55rem 0.6rem; text-align: left; border-bottom: 1px solid var(--line); }
.scorecard th[scope="col"] { font-size: 0.78rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
.scorecard .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.dim-bar { background: color-mix(in srgb, var(--line) 55%, transparent); border-radius: 999px; height: 10px; min-width: 120px; overflow: hidden; }
.dim-bar > span { display: block; height: 100%; background: var(--accent); border-radius: inherit; transform-origin: left; }
html.js .slide:not(.in) .dim-bar > span { transform: scaleX(0); }
.slide.in .dim-bar > span { transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1); transform: scaleX(1); }
.scorecard-scroll { overflow-x: auto; }

/* ── Flags ── */
.flag-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.9rem; }
.flag-list li {
  background: var(--surface); border: 1px solid var(--line); border-left: 5px solid var(--good);
  border-radius: var(--radius); padding: 1rem 1.2rem;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--line) 70%, transparent),
              0 8px 20px -16px color-mix(in srgb, var(--text) 30%, transparent);
}
.flag-list.is-risks li { border-left-color: var(--bad); }
.flag-list li .sev {
  display: inline-block; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; padding: 0.15rem 0.55rem; border-radius: 999px;
  border: 1px solid currentColor; margin-left: 0.5rem; vertical-align: middle;
}
.sev-critical, .sev-high { color: var(--bad); }
.sev-medium { color: var(--warn); }
.sev-low { color: var(--muted); }

/* ── Roadmap ── */
.phase-card { position: relative; }
.phase-num {
  font-family: var(--font-display); font-weight: 800; font-size: 2.4rem;
  color: var(--accent); line-height: 1;
}
.phase-card ul { margin: 0.6rem 0 0.9rem 1.1rem; padding: 0; }
.phase-card li { margin: 0.35rem 0; }
.phase-outcome { border-top: 1px solid var(--line); padding-top: 0.7rem; font-weight: 600; }

/* ── Crew ── */
.crew-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.7rem; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); }
.crew-list li {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 0.9rem 1.1rem;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--line) 70%, transparent),
              0 8px 20px -16px color-mix(in srgb, var(--text) 30%, transparent);
}
.crew-list .crew-name { font-weight: 700; }

/* ── Build sheet ── */
.bs-group { margin-bottom: 1.5rem; border: none; padding: 0; }
.bs-group legend { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; padding: 0; margin-bottom: 0.2rem; }
.bs-group .bs-blurb { margin: 0 0 0.8rem; color: var(--muted); font-size: 0.95rem; }
.bs-items { display: grid; gap: 0.6rem; }
.bs-item {
  display: grid; grid-template-columns: auto 1fr auto; gap: 0.4rem 0.9rem; align-items: start;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 0.85rem 1.05rem; cursor: pointer;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--line) 70%, transparent),
              0 8px 20px -16px color-mix(in srgb, var(--text) 30%, transparent);
}
.bs-item:has(input:checked) { border-color: var(--accent-strong); box-shadow: inset 4px 0 0 var(--accent-strong); }
.bs-item input { width: 1.35rem; height: 1.35rem; margin-top: 0.2rem; accent-color: var(--accent-strong); }
.bs-item .bs-name { font-weight: 700; }
.bs-item .bs-desc { grid-column: 2 / 4; margin: 0; color: var(--muted); font-size: 0.95rem; }
.bs-item .bs-price { font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; }
.bs-target {
  grid-column: 2 / 4; margin: 0.15rem 0 0; font-size: 0.85rem; font-weight: 600;
  color: var(--accent-strong);
}
.bs-totalbar {
  position: sticky; bottom: 0; display: flex; flex-wrap: wrap; gap: 0.7rem 1.4rem;
  align-items: center; justify-content: space-between;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 1rem 1.3rem; margin-top: 1.2rem; box-shadow: 0 -8px 24px -18px rgba(0,0,0,0.45);
}
.bs-total { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; }
.bs-total small { display: block; font-family: var(--font-body); font-size: 0.8rem; font-weight: 500; color: var(--muted); }

.btn-cta {
  display: inline-block; background: var(--accent-strong); color: var(--on-accent);
  font-weight: 700; text-decoration: none; padding: 0.9rem 1.7rem; border-radius: var(--radius);
  min-height: 44px;
}
.btn-cta:hover { filter: brightness(1.08); }

/* ── Investment ── */
.milestone-row { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr)); counter-reset: ms; }
.milestone { text-align: left; }
.milestone .amount { font-family: var(--font-display); font-size: 1.7rem; font-weight: 800; color: var(--accent-strong); }
.invest-total { font-family: var(--font-display); font-size: clamp(2.2rem, 1.6rem + 2.6vw, 3.4rem); font-weight: 800; margin: 0.4rem 0 0.6rem; }

/* ── Sources ── */
.source-list { columns: 2; column-gap: 2.5rem; margin: 0; padding-left: 1.2rem; font-size: 0.92rem; }
@media (max-width: 700px) { .source-list { columns: 1; } }
.source-list li { margin: 0.3rem 0; break-inside: avoid; }
.source-list a { color: var(--accent-strong); }

/* ── Reveal animation (JS-gated so no-JS users see everything) ── */
html.js .slide:not(.in) [data-reveal] { opacity: 0; transform: translateY(16px); }
.slide.in [data-reveal] { opacity: 1; transform: none; transition: opacity 0.6s ease, transform 0.6s ease; }
.slide.in [data-reveal]:nth-of-type(2) { transition-delay: 0.09s; }
.slide.in [data-reveal]:nth-of-type(3) { transition-delay: 0.18s; }
.slide.in [data-reveal]:nth-of-type(4) { transition-delay: 0.27s; }
.slide.in [data-reveal]:nth-of-type(n+5) { transition-delay: 0.36s; }

@media (prefers-reduced-motion: reduce) {
  html.js .slide:not(.in) [data-reveal] { opacity: 1; transform: none; }
  .slide.in [data-reveal], .slide.in .dim-bar > span, .score-ring .ring-value { transition: none !important; }
  html.js .slide:not(.in) .dim-bar > span { transform: none; }
}

/* ── Print / PDF ── */
@media print {
  .deck-header, .rail, .deck-nav, .skip-link, .deck-progress { display: none !important; }
  html { scroll-snap-type: none; }
  .slide { min-height: 0; page-break-after: always; break-after: page; padding: 2rem 1rem; }
  html.js .slide:not(.in) [data-reveal] { opacity: 1; transform: none; }
  html.js .slide:not(.in) .dim-bar > span { transform: none; }
  .bs-totalbar { position: static; box-shadow: none; }
  a[href^="http"]::after { content: "" ; }
}
`;
