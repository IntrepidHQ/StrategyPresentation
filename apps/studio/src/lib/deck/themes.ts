// ============================================================
//  SP Deck Engine — Template themes
//  apps/studio/src/lib/deck/themes.ts
//
//  Six skins over the shared accessible base. Each theme is a
//  token set (CSS custom properties) plus a small layout/motion
//  override block. Font stacks are system-only so decks stay
//  self-contained (no network fetches, CSP-safe); branded
//  webfonts can be layered per-client later.
//
//  Contrast contract (verified against --bg AND --surface):
//    --text, --muted, --accent-strong, and flag colors >= 4.5:1
//    --accent (large text / graphics only)          >= 3:1
// ============================================================

import type { TemplateId } from "./deck-model";

export interface DeckTheme {
  id: TemplateId;
  name: string;
  description: string;
  colorScheme: "light" | "dark";
  tokens: Record<string, string>;
  /** Extra CSS appended after the base stylesheet. */
  css: string;
}

const STACK_SANS = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const STACK_SERIF = `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif`;
const STACK_DIDONE = `Didot, "Bodoni 72", "Playfair Display", Georgia, serif`;
const STACK_MONO = `ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`;
const STACK_GEOMETRIC = `Futura, "Avenir Next", "Century Gothic", "URW Gothic", ${STACK_SANS}`;
const STACK_HUMANIST = `Seravek, "Gill Sans Nova", "Trebuchet MS", Verdana, ${STACK_SANS}`;
// Brutalist condensed display (Voltage) — Impact ships on macOS+Windows;
// Haettenschweiler/Arial Narrow cover the rest. Self-contained decks can't
// fetch webfonts, and Impact's crushed width is exactly the FusionForce cut.
const STACK_CONDENSED = `Impact, Haettenschweiler, "Arial Narrow Bold", "Franklin Gothic Medium", ${STACK_SANS}`;

// Rustic print grain (Voltage) — inline feTurbulence noise, zero requests.
const GRAIN_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`;

// Organic ink splashes (Voltage) — two hand-tuned blobs, tinted per use.
// Ink splash (was red — Hans: "lose that orange... go monochrome")
const SPLASH_INK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath fill='%230c0c0c' d='M97 18c22-9 48 2 58 21 9 17-2 30 8 46 11 18 22 34 8 52-15 19-42 8-63 16-19 7-38 22-56 10-17-11-8-33-16-51-8-17-25-28-17-47C27 46 45 44 62 35c13-7 22-12 35-17Z'/%3E%3Ccircle fill='%230c0c0c' cx='178' cy='38' r='9'/%3E%3Ccircle fill='%230c0c0c' cx='24' cy='150' r='6'/%3E%3Ccircle fill='%230c0c0c' cx='170' cy='168' r='5'/%3E%3C/svg%3E")`;
const SPLASH_CREAM = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath fill='%23f4eee1' d='M104 12c19-6 44-2 52 16 8 16-4 31 6 47 10 17 26 31 15 50-12 20-38 12-58 21-18 8-34 25-53 15-18-10-12-32-21-49-9-16-27-25-21-45 6-19 25-19 41-29 14-8 26-21 39-26Z'/%3E%3Ccircle fill='%23f4eee1' cx='182' cy='42' r='8'/%3E%3Ccircle fill='%23f4eee1' cx='20' cy='142' r='5'/%3E%3C/svg%3E")`;

export const THEMES: Record<TemplateId, DeckTheme> = {
  // ── Summit: light boardroom — serif, navy & antique gold ────
  summit: {
    id: "summit",
    name: "Summit",
    description: "Conservative boardroom: cream paper, navy ink, antique gold.",
    colorScheme: "light",
    tokens: {
      "--bg": "#f6f3ec",
      "--surface": "#fffdf7",
      "--text": "#1c2433",
      "--muted": "#4d5568",
      "--accent": "#8a6a18",
      "--accent-strong": "#6e5413",
      "--on-accent": "#ffffff",
      "--line": "#ddd5c2",
      "--focus": "#1c2433",
      "--good": "#1e6b45",
      "--warn": "#805200",
      "--bad": "#a3273b",
      "--radius": "6px",
      "--font-display": STACK_SERIF,
      "--font-body": STACK_SANS,
    },
    css: `
      /* THE BOARDROOM MEMO — centered, double-ruled, a ledger not a website.
         No boxes anywhere: hairline rules carry the structure. */
      .eyebrow { font-variant-caps: all-small-caps; letter-spacing: 0.22em; }
      h1, h2 { font-weight: 600; }

      /* Cover: one centered column, formal rules above AND below the title,
         the score a modest medallion beneath — an engraved title page. */
      .cover-layout { grid-template-columns: 1fr; justify-items: center; text-align: center; gap: 1.4rem; }
      .cover-layout h1 {
        border-top: 3px double var(--accent); border-bottom: 3px double var(--accent);
        padding: 1.2rem 0.5rem;
      }
      .cover-layout .lede, .cover-layout .muted { margin-inline: auto; }
      .score-ring { width: min(180px, 46vw); }
      .score-ring circle { stroke-width: 6; }
      #s-cover .cover-marks { font-variant-caps: all-small-caps; border-top: 3px double var(--accent); justify-content: center; }

      /* Ledger rows: strengths/risks/crew are ruled entries, not cards. */
      .flag-list, .crew-list { gap: 0; }
      .flag-list li, .crew-list li {
        background: transparent; border: 0; border-radius: 0; box-shadow: none;
        border-top: 1px solid var(--line); padding: 1.05rem 0.2rem;
      }
      .flag-list li:last-child, .crew-list li:last-child { border-bottom: 1px solid var(--line); }
      .flag-list.is-risks li { border-left: 0; }
      .flag-list.is-risks li h3::before { content: "▸ "; color: var(--bad); }
      .flag-list li h3 { font-family: var(--font-display); }
      .card { background: transparent; border: 0; border-radius: 0; box-shadow: none; border-top: 3px double var(--accent); }

      /* Hairline meters with a serif ledger table. */
      .dim-bar { height: 4px; border-radius: 0; background: var(--line); }
      .dim-bar > span { background: var(--accent-strong); border-radius: 0; }
      .scorecard th[scope="row"] { font-family: var(--font-display); font-weight: 600; }
      .milestone .amount { font-family: var(--font-display); }
      .btn-cta { border-radius: 3px; }
    `,
  },

  // ── Signal: dark modern SaaS — electric blue on near-black ──
  signal: {
    id: "signal",
    name: "Signal",
    description: "Dark, modern SaaS: near-black canvas, electric blue signal.",
    colorScheme: "dark",
    tokens: {
      "--bg": "#0b0f17",
      "--surface": "#141b28",
      "--text": "#e9eef7",
      "--muted": "#a9b6ca",
      "--accent": "#7fb1ff",
      "--accent-strong": "#9cc3ff",
      "--on-accent": "#0b0f17",
      "--line": "#273349",
      "--focus": "#9cc3ff",
      "--good": "#5fd39a",
      "--warn": "#e6bb4e",
      "--bad": "#ff8b8b",
      "--radius": "12px",
      "--font-display": STACK_SANS,
      "--font-body": STACK_SANS,
    },
    css: `
      /* THE PRODUCT DASHBOARD — glassy cards, glow, pills. It should feel
         like the SaaS it's selling: live, lit, metric-forward. */
      h1, h2 { font-weight: 800; letter-spacing: -0.02em; }
      #s-cover {
        background:
          radial-gradient(60rem 30rem at 80% -10%, rgba(127,177,255,0.14), transparent 60%),
          radial-gradient(40rem 26rem at 0% 110%, rgba(127,177,255,0.10), transparent 60%);
      }
      .btn-cta { border-radius: 999px; }
      #s-cover h1::after {
        content: ""; display: block; width: 6rem; height: 4px; margin-top: 1.1rem;
        background: linear-gradient(90deg, var(--accent), transparent); border-radius: 2px;
      }

      /* Eyebrows are status chips. */
      .eyebrow {
        display: inline-flex; align-items: center; gap: 0.5em;
        padding: 0.34em 0.95em; border: 1px solid var(--line); border-radius: 999px;
        background: rgba(127, 177, 255, 0.08);
      }
      .eyebrow::before {
        content: ""; width: 0.5em; height: 0.5em; border-radius: 50%;
        background: var(--accent); box-shadow: 0 0 8px var(--accent);
      }

      /* Glass cards with a lit top edge. */
      .card, .flag-list li, .bs-item, .crew-list li {
        background: linear-gradient(180deg, rgba(127,177,255,0.07), transparent 55%), var(--surface);
        border: 1px solid var(--line);
        box-shadow: 0 24px 48px -36px rgba(127, 177, 255, 0.55);
      }
      .flag-list.is-risks li { box-shadow: 0 24px 48px -36px rgba(255, 139, 139, 0.4); }

      /* Metrics glow: gradient meters, lit ring. */
      .dim-bar { height: 8px; background: rgba(127, 177, 255, 0.12); }
      .dim-bar > span {
        background: linear-gradient(90deg, #4f8ce0, var(--accent-strong));
        box-shadow: 0 0 12px rgba(127, 177, 255, 0.55);
      }
      .score-ring .ring-value { filter: drop-shadow(0 0 7px rgba(127, 177, 255, 0.7)); }
      .milestone .amount { color: var(--accent-strong); }
    `,
  },

  // ── Editorial: white magazine — didone display, crimson ─────
  editorial: {
    id: "editorial",
    name: "Editorial",
    description: "Magazine spread: stark white, didone display, crimson accents.",
    colorScheme: "light",
    tokens: {
      "--bg": "#ffffff",
      "--surface": "#f7f6f3",
      "--text": "#151412",
      "--muted": "#4c4a45",
      "--accent": "#b01e45",
      "--accent-strong": "#8f1837",
      "--on-accent": "#ffffff",
      "--line": "#e3e0d9",
      "--focus": "#151412",
      "--good": "#1c6b3f",
      "--warn": "#7d5300",
      "--bad": "#a11836",
      "--radius": "0px",
      "--font-display": STACK_DIDONE,
      "--font-body": STACK_SERIF,
    },
    css: `
      /* THE MAGAZINE SPREAD — italic didone display, a drop cap, numbered
         ruled entries, hairline frames. Print, not product. */
      h1 { font-size: clamp(2.6rem, 1.6rem + 4.6vw, 5.2rem); font-weight: 500; font-style: italic; }
      h2 { font-weight: 500; font-style: italic; }
      .slide-inner > .eyebrow, .slide-inner > h2 { border-top: 4px solid var(--text); padding-top: 0.8rem; }
      .eyebrow { color: var(--text); }
      .slide::after {
        content: attr(data-folio);
        position: absolute; bottom: 1.4rem; left: clamp(1.25rem, 5vw, 4rem);
        font-family: var(--font-display); font-size: 0.95rem; color: var(--muted);
      }
      .phase-num { color: var(--accent); font-style: italic; }
      #s-cover .slide-inner { outline: 1px solid var(--text); outline-offset: clamp(0.8rem, 2vw, 1.8rem); }

      /* A thin, elegant score ring — jewelry, not gauge. */
      .score-ring circle { stroke-width: 4; }

      /* Drop cap opens the executive summary. */
      #s-exec-summary .grid-2 > div:first-child p:first-of-type::first-letter {
        float: left; font-family: var(--font-display); color: var(--accent);
        font-size: 3.6em; line-height: 0.8; padding: 0.06em 0.12em 0 0;
      }

      /* Findings as numbered index entries — rules, folios, no boxes. */
      .flag-list { counter-reset: flag; gap: 0; }
      .flag-list li {
        counter-increment: flag;
        background: transparent; border: 0; border-radius: 0; box-shadow: none;
        border-top: 1px solid var(--text); padding: 1rem 0.2rem 1rem 3.4rem;
        position: relative;
      }
      .flag-list li::before {
        content: counter(flag, decimal-leading-zero);
        position: absolute; left: 0.1rem; top: 0.85rem;
        font-family: var(--font-display); font-style: italic; font-size: 1.7rem;
        color: var(--accent);
      }
      .flag-list.is-risks li { border-left: 0; }
      .flag-list li h3 { font-family: var(--font-display); font-weight: 500; font-size: 1.25rem; }
      .crew-list { gap: 0; grid-template-columns: 1fr; }
      .crew-list li {
        background: transparent; border: 0; border-radius: 0;
        border-top: 1px solid var(--line); padding: 0.85rem 0.2rem;
      }
      .card { background: transparent; border: 1px solid var(--text); border-radius: 0; box-shadow: 6px 6px 0 var(--line); }

      /* Ink meters: square, ruled. */
      .dim-bar { height: 8px; border-radius: 0; background: transparent; border: 1px solid var(--text); }
      .dim-bar > span { background: var(--text); border-radius: 0; }
      .milestone .amount { font-style: italic; }
      .btn-cta { border-radius: 0; }
    `,
  },

  // ── Monospace: terminal — mono grid, phosphor green ─────────
  monospace: {
    id: "monospace",
    name: "Monospace",
    description: "Technical founder: terminal grid, phosphor green on graphite.",
    colorScheme: "dark",
    tokens: {
      "--bg": "#0d1117",
      "--surface": "#161c25",
      "--text": "#e6edf3",
      "--muted": "#9db0c3",
      "--accent": "#56d364",
      "--accent-strong": "#7ee787",
      "--on-accent": "#0d1117",
      "--line": "#2c3644",
      "--focus": "#7ee787",
      "--good": "#7ee787",
      "--warn": "#e8c451",
      "--bad": "#ff9797",
      "--radius": "4px",
      "--font-display": STACK_MONO,
      "--font-body": STACK_MONO,
    },
    css: `
      /* THE TERMINAL SESSION — every slide is a window with a titlebar,
         a prompt, hatched meters, dashed rules, a live cursor. */
      body { font-size: clamp(0.95rem, 0.9rem + 0.3vw, 1.05rem); }
      h1 { font-size: clamp(1.8rem, 1.2rem + 2.8vw, 3.2rem); letter-spacing: -0.01em; }
      .eyebrow::before { content: "[ "; } .eyebrow::after { content: " ]"; }
      .slide {
        background-image: linear-gradient(var(--line) 1px, transparent 1px);
        background-size: 100% 4.5rem;
        background-attachment: local;
        padding-bottom: clamp(5rem, 9vh, 6.5rem);
      }

      /* vim status bar along the bottom of every slide (decorative — the real
         title is in the h2; the corners up top belong to the deck chrome). */
      .slide::after {
        content: "-- NORMAL --  " attr(data-title) "  ·  :" attr(data-folio);
        position: absolute; bottom: 0; left: 0; right: 0; z-index: 2;
        padding: 0.5rem 1.1rem;
        font-size: 0.72rem; letter-spacing: 0.06em; text-transform: lowercase;
        color: var(--muted); border-top: 1px solid var(--line);
        background: color-mix(in srgb, var(--surface) 85%, transparent);
        pointer-events: none;
      }

      /* Prompt + live cursor on the cover. */
      #s-cover h1::before { content: "$ "; color: var(--accent); }
      #s-cover h1::after { content: "▌"; color: var(--accent); animation: ms-blink 1.1s steps(2) infinite; }
      @keyframes ms-blink { 50% { opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { #s-cover h1::after { animation: none; } }
      h2::before { content: "## "; color: var(--accent); }

      /* Dashed machine furniture. */
      .card, .flag-list li, .bs-item, .crew-list li {
        background: color-mix(in srgb, var(--surface) 92%, transparent);
        border: 1px dashed var(--line); border-radius: 0;
      }
      .flag-list.is-risks li { border-left: 3px solid var(--bad); }

      /* Hatched progress meters — dot-matrix, not pill. */
      .dim-bar {
        height: 12px; border-radius: 0;
        background: repeating-linear-gradient(90deg, var(--line) 0 5px, transparent 5px 9px);
      }
      .dim-bar > span {
        border-radius: 0;
        background: repeating-linear-gradient(90deg, var(--accent) 0 7px, color-mix(in srgb, var(--accent) 45%, transparent) 7px 9px);
      }
      .score-ring circle { stroke-linecap: butt; }
      .score-ring .ring-track { stroke-dasharray: 4 5; }
      .btn-cta::before { content: "> "; }
      .btn-cta { border-radius: 0; }
    `,
  },

  // ── Gallery: airy minimal — oversized type, terracotta ──────
  gallery: {
    id: "gallery",
    name: "Gallery",
    description: "Airy and image-led: gallery white, oversized geometry, terracotta.",
    colorScheme: "light",
    tokens: {
      "--bg": "#fafaf7",
      "--surface": "#ffffff",
      "--text": "#1a1b1e",
      "--muted": "#52565e",
      "--accent": "#a34a24",
      "--accent-strong": "#86381a",
      "--on-accent": "#ffffff",
      "--line": "#e6e5df",
      "--focus": "#1a1b1e",
      "--good": "#20693f",
      "--warn": "#7d5300",
      "--bad": "#a02a2a",
      "--radius": "18px",
      "--font-display": STACK_GEOMETRIC,
      "--font-body": STACK_SANS,
    },
    css: `
      /* THE EXHIBITION — centered, monumental, almost furniture-free.
         The score is the artwork; hairlines do the rest. */
      .slide { padding-block: clamp(5rem, 12vh, 8rem); }
      h1 { font-size: clamp(2.6rem, 1.5rem + 5vw, 5.6rem); font-weight: 500; letter-spacing: -0.03em; }
      h2 { font-weight: 500; }
      .eyebrow { letter-spacing: 0.34em; }
      .slide-inner { width: min(980px, 100%); position: relative; z-index: 1; }

      /* Center the room: headers + ledes centered, reading matter left. */
      .slide-inner > .eyebrow, .slide-inner > h2, .slide-inner > h1 { text-align: center; }
      .slide-inner > .lede, .slide-inner > .muted, .slide-inner > .invest-total { text-align: center; margin-inline: auto; }

      /* Cover: one centered column, the ring the centerpiece beneath the
         title — sized to stay fully in frame on short viewports. */
      .cover-layout { grid-template-columns: 1fr; justify-items: center; text-align: center; gap: 1rem; }
      .cover-layout .lede, .cover-layout .muted { margin-inline: auto; }
      #s-cover .lede { font-size: 1.15rem; }
      .score-ring { width: min(210px, 28vh); }
      .score-ring circle { stroke-width: 5; }
      #s-cover .score-ring-wrap { position: relative; }
      #s-cover .score-ring-wrap::before {
        content: ""; position: absolute; z-index: -1;
        width: min(20rem, 44vh); aspect-ratio: 1; border-radius: 50%;
        background: color-mix(in srgb, var(--accent) 9%, transparent);
      }
      #s-cover h1 { font-size: clamp(2.2rem, 1.4rem + 3.6vw, 4.2rem); }
      #s-cover .cover-marks { justify-content: center; }

      /* No boxes in the gallery — hairline plinths only. */
      .card, .flag-list li, .bs-item, .crew-list li {
        background: transparent; border: 0; border-radius: 0; box-shadow: none;
        border-top: 1px solid var(--line); text-align: left;
      }
      .flag-list { grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 1.6rem 3rem; }
      .flag-list.is-risks li { border-left: 0; border-top-color: var(--bad); }
      .dim-bar { height: 3px; border-radius: 0; background: var(--line); }
      .dim-bar > span { background: var(--accent); border-radius: 0; }

      /* Giant ghost folio stays — the wall label. */
      .slide:not(#s-cover)::before {
        content: attr(data-folio) / ""; position: absolute; right: 0.02em; top: -0.12em;
        z-index: 0; pointer-events: none; font-family: var(--font-display);
        font-size: clamp(7rem, 20vw, 18rem); line-height: 1; font-weight: 500;
        color: color-mix(in srgb, var(--accent) 7%, transparent);
      }
      .milestone { text-align: center; }
      .milestone .amount { font-size: 2.2rem; }
      .btn-cta { border-radius: 999px; padding-inline: 2.4rem; }
    `,
  },

  // ── Beacon: warm mission-driven — parchment & deep teal ─────
  beacon: {
    id: "beacon",
    name: "Beacon",
    description: "Warm and mission-driven: parchment, deep teal, rounded and human.",
    colorScheme: "light",
    tokens: {
      "--bg": "#fcf6ec",
      "--surface": "#fffdf8",
      "--text": "#2a2721",
      "--muted": "#5c564a",
      "--accent": "#14605a",
      "--accent-strong": "#0e4b46",
      "--on-accent": "#ffffff",
      "--line": "#e7dcc8",
      "--focus": "#0e4b46",
      "--good": "#14605a",
      "--warn": "#7d5300",
      "--bad": "#9e3535",
      "--radius": "16px",
      "--font-display": STACK_HUMANIST,
      "--font-body": STACK_HUMANIST,
    },
    css: `
      /* THE SUNRISE — warm, rounded, human. The cover mirrors (score sunrise
         on the LEFT, words on the right); everything sits on soft pillows. */
      h1, h2 { font-weight: 700; }
      #s-cover {
        background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 7%, var(--bg)), var(--bg) 55%);
      }

      /* Mirrored cover: rtl flips the grid order, children restore ltr. */
      .cover-layout { direction: rtl; grid-template-columns: 0.9fr 1.1fr; }
      .cover-layout > * { direction: ltr; }
      #s-cover .score-ring-wrap { position: relative; }
      #s-cover .score-ring-wrap::before {
        content: ""; position: absolute; z-index: -1; bottom: -18%;
        width: 24rem; height: 12rem; border-radius: 12rem 12rem 0 0;
        background: radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%);
      }

      /* Soft pillows: generous radius + warm elevation. */
      .card, .flag-list li, .bs-item, .crew-list li {
        border-radius: var(--radius);
        border: 1px solid var(--line);
        box-shadow: 0 12px 28px -20px rgba(20, 96, 90, 0.45);
      }
      .flag-list.is-risks li { border-left: 6px solid var(--bad); }
      .phase-num {
        background: color-mix(in srgb, var(--accent) 12%, transparent);
        border-radius: 50%; width: 3.4rem; height: 3.4rem;
        display: grid; place-items: center; font-size: 1.6rem;
      }

      /* Chapter headers sit centered, like a program. */
      .slide-inner > .eyebrow { display: block; text-align: center; }
      .slide-inner > h2 { text-align: center; }
      .slide-inner > .lede { margin-inline: auto; text-align: center; }

      /* Round, warm meters. */
      .dim-bar { height: 12px; background: color-mix(in srgb, var(--accent) 12%, transparent); }
      .score-ring .ring-track { stroke: color-mix(in srgb, var(--accent) 18%, transparent); }
      .btn-cta { border-radius: 999px; padding-inline: 2.2rem; }
      #s-cover::after {
        content: ""; position: absolute; left: 50%; bottom: -26vh; translate: -50% 0;
        width: 120vh; height: 120vh; border-radius: 50%; pointer-events: none;
        background: radial-gradient(circle, color-mix(in srgb, var(--accent) 14%, transparent), transparent 62%);
      }
    `,
  },

  // ── Voltage: SP's own brand — brutalist electric blue, cream, splashes ──
  // The "super wild mix" (FusionForce brutalism × Brighter warmth): electric
  // blue canvas, condensed-uppercase × didone-italic type collision, cream
  // cover slab with a two-tone headline, rustic grain, ink splashes,
  // edge-runner slide titles. Every text/background pair verified ≥ 4.5:1
  // (splash red is decoration/display-only at 3:1+).
  voltage: {
    id: "voltage",
    name: "Voltage",
    description: "SP's house brand: brutalist electric blue, cream slabs, ink splashes.",
    colorScheme: "dark",
    tokens: {
      "--bg": "#1a2be0",
      "--surface": "#0f1cc0",
      "--text": "#ffffff",
      "--muted": "#cfd2f7",
      "--accent": "#f4eee1",
      "--accent-strong": "#ffffff",
      "--on-accent": "#0c0c0c",
      "--line": "rgba(255,255,255,0.30)",
      "--focus": "#ffffff",
      "--good": "#8ff0b0",
      "--warn": "#ffd166",
      "--bad": "#ffb0a0",
      "--radius": "0px",
      "--font-display": STACK_CONDENSED,
      "--font-body": STACK_SANS,
    },
    css: `
      /* Rustic print grain over everything (decorative, non-interactive). */
      body::after {
        content: ""; position: fixed; inset: 0; z-index: 40; pointer-events: none;
        background: ${GRAIN_URI}; opacity: 0.05; mix-blend-mode: overlay;
      }
      h1, h2 {
        text-transform: uppercase; letter-spacing: -0.01em; line-height: 0.92;
        font-weight: 400; /* Impact carries its own weight */
      }
      h1 { font-size: clamp(3rem, 2rem + 5.5vw, 6.4rem); }
      .lede { font-family: ${STACK_DIDONE.replace(/"/g, "'")}; font-style: italic; font-size: 1.35rem; }
      .eyebrow { letter-spacing: 0.3em; font-family: var(--font-body); font-weight: 700; }

      /* ── Cover: cream slab, two-tone headline, splash, marks ── */
      #s-cover { background: #f4eee1; }
      #s-cover::before { content: none; } /* no ambient glow — hard edges only */
      #s-cover, #s-cover .lede { color: #0c0c0c; }
      #s-cover .eyebrow { color: #1a2be0; }
      #s-cover .muted { color: #3a3a34; }
      #s-cover h1 .hl-a { color: #0c0c0c; }
      #s-cover h1 .hl-b { color: #1a2be0; }
      #s-cover .slide-inner::after {
        content: ""; position: absolute; top: 4%; right: 2%;
        width: clamp(90px, 14vw, 180px); aspect-ratio: 1;
        background: ${SPLASH_INK} no-repeat center / contain;
        pointer-events: none;
      }
      #s-cover .cover-constellation { color: #1a2be0; }
      #s-cover .score-ring .ring-track { stroke: rgba(12,12,12,0.15); }
      #s-cover .score-ring .ring-value { stroke: #1a2be0; }
      #s-cover .score-ring text { fill: #0c0c0c; }
      #s-cover .score-readout { color: #3a3a34; }
      /* The marks row IS the blue footer slab — full-bleed via negative
         margins matching the slide padding, so text and band never drift. */
      #s-cover .cover-marks {
        display: flex; align-items: center; border-top: 0;
        background: #1a2be0; color: #f4eee1;
        margin: 2.6rem calc(-1 * clamp(1.25rem, 5vw, 4rem)) calc(-1 * clamp(4.5rem, 8vh, 6rem));
        padding: 1.4rem clamp(1.25rem, 5vw, 4rem) 1.6rem;
      }

      /* ── Edge-runner slide titles (FusionForce vertical crop) ── */
      .slide:not(#s-cover)::before {
        content: attr(data-folio) / ""; position: absolute; z-index: 0;
        right: -0.06em; bottom: -0.18em; pointer-events: none;
        font-family: var(--font-display); font-size: clamp(8rem, 24vw, 22rem);
        line-height: 1; color: rgba(244,238,225,0.10); letter-spacing: -0.02em;
      }
      .slide-inner { position: relative; z-index: 1; }

      /* Hard-edged slabs everywhere. */
      .card, .flag-list li, .bs-item, .crew-list li {
        border: 2px solid rgba(255,255,255,0.35); box-shadow: none;
      }
      .card h3 { text-transform: uppercase; letter-spacing: 0.08em; }

      /* Cream splash punctuating the CTA slide — parked top-right, clear of
         the headline (content is left-aligned) and of the bottom-right folio. */
      #s-next-step .slide-inner::before {
        content: ""; position: absolute; top: -14%; right: 2%;
        width: clamp(80px, 11vw, 150px); aspect-ratio: 1;
        background: ${SPLASH_CREAM} no-repeat center / contain; opacity: 0.85;
        pointer-events: none;
      }
      .btn-cta {
        border-radius: 0; background: #f4eee1; color: #0c0c0c;
        text-transform: uppercase; letter-spacing: 0.12em; font-weight: 800;
      }
      .deck-nav button { border-radius: 0; }
    `,
  },

  // ── Blueprint: the site's own brand as a deck — drafting sheet ──
  // One electric-blue sheet, white line-work, fine blueprint grid, paper
  // grain, outlined second headline half (drawn, not filled — line-work).
  // Monochrome. Contrast verified: white 8.5:1, muted 5.8:1, accent 6:1.
  blueprint: {
    id: "blueprint",
    name: "Blueprint",
    description: "The drafting sheet: electric blue, white line-work, blueprint grid.",
    colorScheme: "dark",
    tokens: {
      "--bg": "#1a2be0",
      "--surface": "#1424c9",
      "--text": "#ffffff",
      "--muted": "#cfd2f7",
      "--accent": "#cfd6ff",
      "--accent-strong": "#ffffff",
      "--on-accent": "#0c0c0c",
      "--line": "rgba(255,255,255,0.32)",
      "--focus": "#ffffff",
      "--good": "#8ff0b0",
      "--warn": "#ffd166",
      "--bad": "#ffb0a0",
      "--radius": "0px",
      "--font-display": STACK_CONDENSED,
      "--font-body": STACK_SANS,
    },
    css: `
      /* The drafting sheet: minor/major grid + paper grain. */
      body {
        background-image:
          linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px);
        background-size: 24px 24px, 24px 24px, 120px 120px, 120px 120px;
      }
      body::after {
        content: ""; position: fixed; inset: 0; z-index: 40; pointer-events: none;
        background: ${GRAIN_URI}; opacity: 0.05; mix-blend-mode: overlay;
      }
      h1, h2 { text-transform: uppercase; line-height: 0.95; font-weight: 400; letter-spacing: 0.005em; }
      h1 { font-size: clamp(3rem, 2rem + 5.2vw, 6.2rem); }
      .lede { font-family: ${STACK_DIDONE.replace(/"/g, "'")}; font-style: italic; font-size: 1.35rem; }
      .eyebrow { letter-spacing: 0.3em; font-family: var(--font-body); font-weight: 700; color: var(--muted); }
      #s-cover::before { content: none; }
      /* Line-work headline: the second half is DRAWN, not filled. */
      #s-cover h1 .hl-b { color: transparent; -webkit-text-stroke: 2px #ffffff; }
      @supports not (-webkit-text-stroke: 2px #fff) {
        #s-cover h1 .hl-b { color: var(--accent); }
      }
      #s-cover .cover-marks {
        display: flex; border-top: 2px solid #ffffff; color: #ffffff;
        border-bottom: 2px solid #ffffff; padding-bottom: 0.9rem;
      }
      /* Giant cropped folio, drafting-stamp quiet. */
      .slide:not(#s-cover)::before {
        content: attr(data-folio) / ""; position: absolute; z-index: 0;
        right: -0.06em; bottom: -0.18em; pointer-events: none;
        font-family: var(--font-display); font-size: clamp(8rem, 24vw, 22rem);
        line-height: 1; color: rgba(255,255,255,0.05); letter-spacing: -0.02em;
      }
      .slide-inner { position: relative; z-index: 1; }
      .card, .flag-list li, .bs-item, .crew-list li {
        border: 1px solid var(--line); box-shadow: none; background: var(--surface);
      }
      .card h3 { text-transform: uppercase; letter-spacing: 0.08em; }
      .btn-cta {
        border-radius: 0; background: #ffffff; color: #0c0c0c;
        text-transform: uppercase; letter-spacing: 0.12em; font-weight: 800;
      }
      .deck-nav button { border-radius: 0; }
    `,
  },
};

export function themeCss(theme: DeckTheme): string {
  const vars = Object.entries(theme.tokens)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `:root {\n  color-scheme: ${theme.colorScheme};\n${vars}\n}\n${theme.css}`;
}
