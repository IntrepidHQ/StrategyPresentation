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
const SPLASH_RED = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath fill='%23ff3d00' d='M97 18c22-9 48 2 58 21 9 17-2 30 8 46 11 18 22 34 8 52-15 19-42 8-63 16-19 7-38 22-56 10-17-11-8-33-16-51-8-17-25-28-17-47C27 46 45 44 62 35c13-7 22-12 35-17Z'/%3E%3Ccircle fill='%23ff3d00' cx='178' cy='38' r='9'/%3E%3Ccircle fill='%23ff3d00' cx='24' cy='150' r='6'/%3E%3Ccircle fill='%23ff3d00' cx='170' cy='168' r='5'/%3E%3C/svg%3E")`;
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
      .slide-inner { text-align: left; }
      .eyebrow { font-variant-caps: all-small-caps; letter-spacing: 0.22em; }
      h1, h2 { font-weight: 600; }
      .cover-layout h1 { border-top: 3px double var(--accent); padding-top: 1.2rem; }
      .card, .flag-list li, .bs-item, .crew-list li { box-shadow: 0 1px 0 var(--line); }
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
      h1, h2 { font-weight: 800; letter-spacing: -0.02em; }
      #s-cover {
        background:
          radial-gradient(60rem 30rem at 80% -10%, rgba(127,177,255,0.14), transparent 60%),
          radial-gradient(40rem 26rem at 0% 110%, rgba(127,177,255,0.10), transparent 60%);
      }
      .eyebrow::before { content: "// "; color: var(--muted); }
      .btn-cta { border-radius: 999px; }
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
      h1 { font-size: clamp(2.6rem, 1.6rem + 4.6vw, 5.2rem); font-weight: 500; }
      .slide-inner > .eyebrow, .slide-inner > h2 { border-top: 4px solid var(--text); padding-top: 0.8rem; }
      .eyebrow { color: var(--text); }
      .slide::after {
        content: attr(data-folio);
        position: absolute; bottom: 1.4rem; left: clamp(1.25rem, 5vw, 4rem);
        font-family: var(--font-display); font-size: 0.95rem; color: var(--muted);
      }
      .phase-num { color: var(--accent); font-style: italic; }
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
      body { font-size: clamp(0.95rem, 0.9rem + 0.3vw, 1.05rem); }
      h1 { font-size: clamp(1.8rem, 1.2rem + 2.8vw, 3.2rem); letter-spacing: -0.01em; }
      .eyebrow::before { content: "[ "; } .eyebrow::after { content: " ]"; }
      .slide {
        background-image: linear-gradient(var(--line) 1px, transparent 1px);
        background-size: 100% 4.5rem;
        background-attachment: local;
      }
      .card, .flag-list li, .bs-item, .crew-list li { background: color-mix(in srgb, var(--surface) 92%, transparent); }
      .btn-cta::before { content: "> "; }
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
      .slide { padding-block: clamp(5rem, 12vh, 8rem); }
      h1 { font-size: clamp(2.6rem, 1.5rem + 5vw, 5.6rem); font-weight: 500; letter-spacing: -0.03em; }
      h2 { font-weight: 500; }
      .eyebrow { letter-spacing: 0.3em; }
      .slide-inner { width: min(980px, 100%); }
      #s-cover .score-ring-wrap::before {
        content: ""; position: absolute; z-index: -1;
        width: 22rem; height: 22rem; border-radius: 50%;
        background: color-mix(in srgb, var(--accent) 9%, transparent);
      }
      #s-cover .score-ring-wrap { position: relative; }
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
      h1, h2 { font-weight: 700; }
      #s-cover {
        background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 7%, var(--bg)), var(--bg) 55%);
      }
      .card, .flag-list li, .bs-item, .crew-list li { border-radius: var(--radius); }
      .phase-num {
        background: color-mix(in srgb, var(--accent) 12%, transparent);
        border-radius: 50%; width: 3.4rem; height: 3.4rem;
        display: grid; place-items: center; font-size: 1.6rem;
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
      #s-cover .eyebrow { color: #b02800; }
      #s-cover .muted { color: #3a3a34; }
      #s-cover h1 .hl-a { color: #0c0c0c; }
      #s-cover h1 .hl-b { color: #1a2be0; }
      #s-cover .slide-inner::after {
        content: ""; position: absolute; top: 4%; right: 2%;
        width: clamp(90px, 14vw, 180px); aspect-ratio: 1;
        background: ${SPLASH_RED} no-repeat center / contain;
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
};

export function themeCss(theme: DeckTheme): string {
  const vars = Object.entries(theme.tokens)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `:root {\n  color-scheme: ${theme.colorScheme};\n${vars}\n}\n${theme.css}`;
}
