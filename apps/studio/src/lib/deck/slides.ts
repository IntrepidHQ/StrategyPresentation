// ============================================================
//  SP Deck Engine — Slide renderers
//  apps/studio/src/lib/deck/slides.ts
//
//  Semantic, WCAG-AA HTML for each slide in the canonical
//  sequence. All user-facing strings pass through esc().
//  Charts are decorative (aria-hidden) — the same data is
//  always present as real text or a table.
// ============================================================

import type { DeckModel, SlideId } from "./deck-model";

export function esc(value: string | number | undefined | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SLIDE_TITLES: Record<SlideId, string> = {
  "cover": "Cover",
  "exec-summary": "Executive summary",
  "scorecard": "Scorecard",
  "strengths": "What's working",
  "risks": "What it's costing you",
  "roadmap": "The route to 90+",
  "system": "The system",
  "build-sheet": "Build sheet",
  "investment": "Investment",
  "next-step": "Next step",
  "sources": "Sources",
};

export function slideTitle(id: SlideId): string {
  return SLIDE_TITLES[id];
}

function money(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

function slideOpen(id: SlideId, model: DeckModel, labelId: string): string {
  const folio = String(model.slideOrder.indexOf(id) + 1).padStart(2, "0");
  return `<section class="slide" id="s-${id}" data-title="${esc(SLIDE_TITLES[id])}" data-folio="${folio}" aria-labelledby="${labelId}">
  <div class="slide-inner">`;
}

const SLIDE_CLOSE = `  </div>\n</section>`;

// ── 1. Cover ──────────────────────────────────────────────────

export function renderCover(model: DeckModel): string {
  const { meta, score } = model;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const finalOffset = circumference * (1 - score.score / 100);
  const scanDate = new Date(meta.scannedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `${slideOpen("cover", model, "cover-h")}
    <div class="cover-layout">
      <div>
        <p class="eyebrow" data-reveal>Strategy presentation · ${esc(meta.domain)}</p>
        <h1 id="cover-h" data-reveal>${esc(score.headline)}</h1>
        <p class="lede" data-reveal>${esc(score.oneLiner)}</p>
        <p class="muted" data-reveal>Prepared for ${esc(meta.clientName)} · Scanned ${esc(scanDate)} · Evidence: ${model.sources.length} public sources</p>
      </div>
      <div class="score-ring-wrap" data-reveal>
        <svg class="score-ring" viewBox="0 0 120 120" role="img" aria-label="Website credit score: ${score.score} out of 100, grade ${esc(score.grade)}">
          <circle class="ring-track" cx="60" cy="60" r="${radius}" fill="none" stroke-width="10"></circle>
          <circle class="ring-value" cx="60" cy="60" r="${radius}" fill="none" stroke-width="10" stroke-linecap="round"
            transform="rotate(-90 60 60)"
            stroke-dasharray="${circumference.toFixed(2)}"
            stroke-dashoffset="${finalOffset.toFixed(2)}"
            data-ring data-circumference="${circumference.toFixed(2)}" data-final-offset="${finalOffset.toFixed(2)}"></circle>
          <text x="60" y="58" text-anchor="middle" fill="currentColor" font-size="30" font-weight="800" aria-hidden="true"><tspan data-count="${score.score}">${score.score}</tspan></text>
          <text x="60" y="78" text-anchor="middle" fill="currentColor" font-size="11" aria-hidden="true">GRADE ${esc(score.grade)}</text>
        </svg>
        <p class="score-readout muted">Website Credit Score · benchmark-ready is ${score.benchmarkTarget}</p>
      </div>
    </div>
${SLIDE_CLOSE}`;
}

// ── 2. Executive summary ──────────────────────────────────────

export function renderExecSummary(model: DeckModel): string {
  const paragraphs = model.execSummary.paragraphs
    .map((p) => `<p data-reveal>${esc(p)}</p>`)
    .join("\n      ");
  return `${slideOpen("exec-summary", model, "exec-h")}
    <p class="eyebrow" data-reveal>Executive summary</p>
    <h2 id="exec-h" data-reveal>Where ${esc(model.meta.clientName)} stands today</h2>
    <div class="grid-2">
      <div>${paragraphs}</div>
      <div class="card" data-reveal>
        <h3>The gap in one number</h3>
        <p><span class="invest-total" aria-hidden="true"><span data-count="${model.score.benchmarkDelta}">${model.score.benchmarkDelta}</span></span>
        <span class="muted">points between your score of ${model.score.score} and a benchmark-ready ${model.score.benchmarkTarget}. Every slide that follows is about closing it.</span></p>
      </div>
    </div>
${SLIDE_CLOSE}`;
}

// ── 3. Scorecard ──────────────────────────────────────────────

export function renderScorecard(model: DeckModel): string {
  const rows = model.scorecard.dimensions
    .map(
      (d) => `<tr data-reveal>
        <th scope="row">${esc(d.label)}</th>
        <td class="num">${Math.round(d.weight * 100)}%</td>
        <td><div class="dim-bar" aria-hidden="true"><span style="width:${d.score}%"></span></div></td>
        <td class="num"><strong>${d.score}</strong> · ${esc(d.grade)}</td>
      </tr>`,
    )
    .join("\n      ");

  return `${slideOpen("scorecard", model, "score-h")}
    <p class="eyebrow" data-reveal>Scorecard</p>
    <h2 id="score-h" data-reveal>Ten dimensions, weighted like a lender would</h2>
    <div class="scorecard-scroll" data-reveal>
      <table class="scorecard">
        <caption>Website Credit Score dimensions for ${esc(model.meta.domain)}, ordered by weight. Scores are 0–100.</caption>
        <thead>
          <tr><th scope="col">Dimension</th><th scope="col" class="num">Weight</th><th scope="col"><span class="visually-hidden">Score bar</span></th><th scope="col" class="num">Score</th></tr>
        </thead>
        <tbody>
      ${rows}
        </tbody>
      </table>
    </div>
${SLIDE_CLOSE}`;
}

// ── 4. Strengths / 5. Risks ───────────────────────────────────

export function renderStrengths(model: DeckModel): string {
  const items = model.strengths.items
    .map(
      (f) => `<li data-reveal><h3>${esc(f.title)}</h3><p class="muted">${esc(f.detail)}</p></li>`,
    )
    .join("\n      ");
  return `${slideOpen("strengths", model, "str-h")}
    <p class="eyebrow" data-reveal>What's working</p>
    <h2 id="str-h" data-reveal>Assets worth protecting</h2>
    <ul class="flag-list">
      ${items}
    </ul>
${SLIDE_CLOSE}`;
}

export function renderRisks(model: DeckModel): string {
  const items = model.risks.items
    .map((f) => {
      const sev = f.severity
        ? ` <span class="sev sev-${esc(f.severity)}">${esc(f.severity)}</span>`
        : "";
      return `<li data-reveal><h3>${esc(f.title)}${sev}</h3><p class="muted">${esc(f.detail)}</p></li>`;
    })
    .join("\n      ");
  return `${slideOpen("risks", model, "risk-h")}
    <p class="eyebrow" data-reveal>What it's costing you</p>
    <h2 id="risk-h" data-reveal>The findings holding the score down</h2>
    <ul class="flag-list is-risks">
      ${items}
    </ul>
${SLIDE_CLOSE}`;
}

// ── 6. Roadmap ────────────────────────────────────────────────

export function renderRoadmap(model: DeckModel): string {
  const phases = model.roadmap.phases
    .map(
      (p) => `<div class="card phase-card" data-reveal>
        <p class="phase-num" aria-hidden="true">${p.phase}</p>
        <h3>${esc(p.title)} <span class="muted">· ${esc(p.timeline)}</span></h3>
        <ul>${p.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        <p class="phase-outcome">${esc(p.outcome)}</p>
      </div>`,
    )
    .join("\n      ");
  return `${slideOpen("roadmap", model, "road-h")}
    <p class="eyebrow" data-reveal>The route to ${model.score.benchmarkTarget}+</p>
    <h2 id="road-h" data-reveal>Ninety days, three phases</h2>
    <div class="grid-3">
      ${phases}
    </div>
${SLIDE_CLOSE}`;
}

// ── 7. System ─────────────────────────────────────────────────

export function renderSystem(model: DeckModel): string {
  const agents = model.system.agents
    .map(
      (a) => `<li data-reveal><span class="crew-name">${esc(a.name)}</span><br><span class="muted">${esc(a.role)}</span></li>`,
    )
    .join("\n      ");
  return `${slideOpen("system", model, "sys-h")}
    <p class="eyebrow" data-reveal>The system</p>
    <h2 id="sys-h" data-reveal>Not a report — a running instance</h2>
    <p class="lede" data-reveal>${esc(model.system.intro)}</p>
    <ul class="crew-list">
      ${agents}
    </ul>
${SLIDE_CLOSE}`;
}

// ── 8. Build sheet ────────────────────────────────────────────

export function renderBuildSheet(model: DeckModel): string {
  const { buildSheet, nextStep } = model;
  const groups = buildSheet.groups
    .map((group) => {
      const items = group.items
        .map((item) => {
          const target = item.targetNote
            ? `<p class="bs-target">${esc(item.targetNote)}</p>`
            : "";
          return `<label class="bs-item" data-reveal>
            <input type="checkbox" name="addons" value="${esc(item.id)}" data-price="${item.price}"${item.preselected ? " checked" : ""}>
            <span class="bs-name">${esc(item.name)}</span>
            <span class="bs-price">${money(item.price)}</span>
            <p class="bs-desc">${esc(item.description)}</p>
            ${target}
          </label>`;
        })
        .join("\n          ");
      return `<fieldset class="bs-group">
          <legend>${esc(group.label)}</legend>
          <p class="bs-blurb">${esc(group.blurb)}</p>
          <div class="bs-items">
          ${items}
          </div>
        </fieldset>`;
    })
    .join("\n      ");

  return `${slideOpen("build-sheet", model, "bs-h")}
    <p class="eyebrow" data-reveal>Build sheet</p>
    <h2 id="bs-h" data-reveal>Check what your instance should do</h2>
    <p class="lede" data-reveal>Every line is a working automation we build into your instance — nothing on this list is hypothetical. The Foundation set is checked to match the full engagement.</p>
    <form id="build-sheet-form" data-target-total="${buildSheet.targetTotal}">
      ${groups}
      <div class="bs-totalbar" data-reveal>
        <p class="bs-total">Selected: <span id="bs-total-amount">${money(buildSheet.preselectedTotal)}</span>
          <small id="bs-total-note">Covers the full ${money(buildSheet.targetTotal)} engagement</small></p>
        <a class="btn-cta" id="bs-cta" data-base-href="${esc(nextStep.ctaHref)}" href="${esc(nextStep.ctaHref)}">Reserve my build</a>
      </div>
    </form>
${SLIDE_CLOSE}`;
}

// ── 9. Investment ─────────────────────────────────────────────

export function renderInvestment(model: DeckModel): string {
  const milestones = model.investment.milestones
    .map(
      (m) => `<div class="card milestone" data-reveal>
        <p class="amount">${money(m.amount)}</p>
        <h3>${esc(m.label)}</h3>
        <p class="muted">${esc(m.detail)}</p>
      </div>`,
    )
    .join("\n      ");
  return `${slideOpen("investment", model, "inv-h")}
    <p class="eyebrow" data-reveal>Investment</p>
    <h2 id="inv-h" data-reveal>One engagement, four milestones</h2>
    <p class="invest-total" data-reveal>${money(model.investment.total)}</p>
    <div class="milestone-row">
      ${milestones}
    </div>
    <p class="muted" data-reveal>${esc(model.investment.anchorNote)}</p>
${SLIDE_CLOSE}`;
}

// ── 10. Next step ─────────────────────────────────────────────

export function renderNextStep(model: DeckModel): string {
  const { nextStep } = model;
  return `${slideOpen("next-step", model, "next-h")}
    <p class="eyebrow" data-reveal>Next step</p>
    <h2 id="next-h" data-reveal>${esc(nextStep.headline)}</h2>
    <p class="lede" data-reveal>${esc(nextStep.body)}</p>
    <p data-reveal><a class="btn-cta" href="${esc(nextStep.ctaHref)}">${esc(nextStep.ctaLabel)}</a></p>
${SLIDE_CLOSE}`;
}

// ── 11. Sources appendix ──────────────────────────────────────

export function renderSources(model: DeckModel): string {
  const items = model.sources
    .map((s) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a></li>`)
    .join("\n      ");
  return `${slideOpen("sources", model, "src-h")}
    <p class="eyebrow" data-reveal>Appendix</p>
    <h2 id="src-h" data-reveal>Every claim, sourced</h2>
    <p class="muted" data-reveal>This presentation is built from ${model.sources.length} public sources gathered during the scan of ${esc(model.meta.domain)}.</p>
    <ol class="source-list" data-reveal>
      ${items}
    </ol>
${SLIDE_CLOSE}`;
}

// ── Dispatch ──────────────────────────────────────────────────

export const SLIDE_RENDERERS: Record<SlideId, (model: DeckModel) => string> = {
  "cover": renderCover,
  "exec-summary": renderExecSummary,
  "scorecard": renderScorecard,
  "strengths": renderStrengths,
  "risks": renderRisks,
  "roadmap": renderRoadmap,
  "system": renderSystem,
  "build-sheet": renderBuildSheet,
  "investment": renderInvestment,
  "next-step": renderNextStep,
  "sources": renderSources,
};
