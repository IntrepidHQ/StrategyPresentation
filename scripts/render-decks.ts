#!/usr/bin/env tsx
// ============================================================
//  SP Deck Engine — Fixture render script
//  scripts/render-decks.ts
//
//  Renders the WCS mock fixture (apple.com) through every
//  template into out/decks/, plus an index page for eyeballing.
//  Run with: npm run decks
// ============================================================

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { buildDeckModel, renderDeck, TEMPLATE_IDS, THEMES } from "../apps/studio/src/lib/deck";
import type { WCSReport } from "../apps/studio/src/lib/types";

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "out", "decks");
const FIXTURE = path.join(ROOT, "apps", "studio", "src", "lib", "fixtures", "wcs-mock.json");

const report = JSON.parse(readFileSync(FIXTURE, "utf-8")) as WCSReport;
mkdirSync(OUT_DIR, { recursive: true });

const cards: string[] = [];

for (const templateId of TEMPLATE_IDS) {
  const model = buildDeckModel(report, {
    clientName: report.company_name ?? report.domain,
    clientSlug: "fixture",
    tier: templateId === "beacon" ? "nonprofit" : "standard",
    templateId,
    source: "sp-demo",
  });
  const html = renderDeck(model);
  const file = `${templateId}.html`;
  writeFileSync(path.join(OUT_DIR, file), html);
  const theme = THEMES[templateId];
  console.log(`✓ ${file}  (${(html.length / 1024).toFixed(0)} KB)`);
  cards.push(
    `<a href="./${file}" style="display:block;padding:1.2rem 1.4rem;border:1px solid #ccc;border-radius:10px;text-decoration:none;color:inherit;background:${theme.tokens["--bg"]};">
      <strong style="color:${theme.tokens["--text"]};font-size:1.2rem;">${theme.name}</strong><br>
      <span style="color:${theme.tokens["--muted"]};">${theme.description}</span>
    </a>`,
  );
}

writeFileSync(
  path.join(OUT_DIR, "index.html"),
  `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SP deck templates — fixture preview</title></head>
<body style="font-family:system-ui;max-width:760px;margin:3rem auto;padding:0 1rem;">
<h1>SP deck templates</h1><p>Fixture: ${report.domain} (score ${report.overall.score}, ${report.overall.grade})</p>
<div style="display:grid;gap:1rem;">${cards.join("\n")}</div>
</body></html>`,
);
console.log(`\nIndex: ${path.join(OUT_DIR, "index.html")}`);
