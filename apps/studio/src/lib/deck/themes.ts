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
};

export function themeCss(theme: DeckTheme): string {
  const vars = Object.entries(theme.tokens)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `:root {\n  color-scheme: ${theme.colorScheme};\n${vars}\n}\n${theme.css}`;
}
