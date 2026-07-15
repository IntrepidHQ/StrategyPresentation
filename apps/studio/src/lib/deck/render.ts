// ============================================================
//  SP Deck Engine — Document assembler
//  apps/studio/src/lib/deck/render.ts
//
//  renderDeck(model) → one self-contained HTML file: inline CSS
//  (base + theme), semantic slides, inline runtime. No external
//  requests of any kind, so the output deploys anywhere and
//  works offline / behind strict CSPs.
// ============================================================

import { BASE_CSS } from "./base-css";
import type { DeckModel } from "./deck-model";
import { RUNTIME_JS } from "./runtime";
import { esc, SLIDE_RENDERERS, slideTitle } from "./slides";
import { THEMES, themeCss } from "./themes";

export function renderDeck(model: DeckModel): string {
  const theme = THEMES[model.meta.templateId];
  const title = `${model.meta.clientName} — Strategy Presentation`;
  const description = `A data-backed strategy presentation for ${model.meta.clientName}, built from the Website Credit Score scan of ${model.meta.domain}.`;

  const slides = model.slideOrder
    .map((id) => SLIDE_RENDERERS[id](model))
    .join("\n\n");

  const rail = model.slideOrder
    .map(
      (id) =>
        `<a href="#s-${id}" title="${esc(slideTitle(id))}"><span class="visually-hidden">${esc(slideTitle(id))}</span></a>`,
    )
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="${esc(theme.tokens["--bg"])}">
<title>${esc(title)}</title>
<script>document.documentElement.classList.add("js");</script>
<style>
${themeCss(theme)}
${BASE_CSS}
</style>
</head>
<body>
<a class="skip-link" href="#s-cover">Skip to presentation</a>

<div class="deck-progress" id="deck-progress" aria-hidden="true"></div>

<header class="deck-header">
  <p class="brand"><strong>${esc(model.meta.clientName)}</strong> · ${esc(model.meta.domain)}</p>
  <p class="deck-counter" id="deck-counter" aria-live="polite">1 / ${model.slideOrder.length} — ${esc(slideTitle(model.slideOrder[0]))}</p>
</header>

<nav class="rail" aria-label="Slides">
    ${rail}
</nav>

<main class="deck" id="deck">
${slides}
</main>

<div class="deck-nav">
  <button type="button" id="deck-playpause" aria-label="Play auto-play" aria-pressed="false">▶</button>
  <button type="button" id="deck-prev" aria-label="Previous slide">↑</button>
  <button type="button" id="deck-next" aria-label="Next slide">↓</button>
</div>

<script>
${RUNTIME_JS}
</script>
</body>
</html>
`;
}
