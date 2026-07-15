#!/usr/bin/env node
// ============================================================
//  SP Deck Engine — Visual + a11y QA harness
//  scripts/qa-decks.mjs
//
//  For every rendered template in out/decks/:
//   - screenshots each slide at 1280x720 (desktop) into out/decks/qa/
//   - runs an axe-core audit (WCAG 2.1 AA rules) and reports violations
//   - screenshots the cover at 375x812 (mobile) for responsive checks
//
//  Uses playwright from the brainstem repo's node_modules and
//  axe-core from the WebsiteCreditScore repo (both already
//  installed on this machine); run `npm run decks` first.
// ============================================================

import { createRequire } from "module";
import { mkdirSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Prefer this repo's own devDependencies (CI); fall back to Hans's sibling
// repos for older local checkouts that predate them.
const localRequire = createRequire(import.meta.url);
function resolveDep(name, fallbackRoot) {
  try {
    return { mod: localRequire(name), path: localRequire.resolve(name) };
  } catch {
    const alt = createRequire(fallbackRoot);
    return { mod: alt(name), path: alt.resolve(name) };
  }
}
const { chromium } = resolveDep("playwright", "/Users/Hans/brainztem/brainstem/node_modules/").mod;
const AXE_PATH = resolveDep("axe-core/axe.min.js", "/Users/Hans/WebsiteCreditScore/node_modules/").path;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DECK_DIR = path.join(__dirname, "..", "out", "decks");
const QA_DIR = path.join(DECK_DIR, "qa");

const templates = readdirSync(DECK_DIR).filter((f) => f.endsWith(".html") && f !== "index.html");
if (templates.length === 0) {
  console.error("No decks found — run `npm run decks` first.");
  process.exit(1);
}
mkdirSync(QA_DIR, { recursive: true });

const axeSource = readFileSync(AXE_PATH, "utf-8");
const browser = await chromium.launch();
let totalViolations = 0;

for (const file of templates) {
  const name = path.basename(file, ".html");
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`file://${path.join(DECK_DIR, file)}`);
  await page.waitForTimeout(300);

  const slideIds = await page.$$eval(".slide", (els) => els.map((el) => el.id));
  for (const id of slideIds) {
    await page.evaluate((slideId) => {
      document.documentElement.style.scrollBehavior = "auto";
      const el = document.getElementById(slideId);
      window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset, behavior: "instant" });
    }, id);
    await page.waitForTimeout(1400); // let reveals/count-ups finish
    await page.screenshot({ path: path.join(QA_DIR, `${name}--${id}.png`) });
  }

  // axe audit (full page)
  await page.evaluate(axeSource);
  const results = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
  });
  if (results.violations.length) {
    totalViolations += results.violations.length;
    console.log(`\n✗ ${name}: ${results.violations.length} axe violation type(s)`);
    for (const v of results.violations) {
      console.log(`   [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
      for (const node of v.nodes.slice(0, 3)) {
        console.log(`      → ${node.target.join(" ")}`);
      }
    }
  } else {
    console.log(`✓ ${name}: axe clean (WCAG 2.1 AA rules)`);
  }

  // mobile cover
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(QA_DIR, `${name}--mobile-cover.png`) });
  await page.close();
}

await browser.close();
console.log(`\nScreenshots: ${QA_DIR}`);
process.exit(totalViolations ? 1 : 0);
