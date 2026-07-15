#!/usr/bin/env node
// ============================================================
//  SP Landing — Visual + a11y + flow QA
//  scripts/qa-landing.mjs
//
//  Against a running studio server (default http://localhost:3199):
//   - screenshots /home in light, dark, and mobile
//   - axe-core audit (WCAG 2.1 AA rules)
//   - drives the demo flow: domain lookup → sample deck iframe →
//     template switch → email claim
//  Usage: node scripts/qa-landing.mjs [baseUrl]
// ============================================================

import { createRequire } from "module";
import { mkdirSync } from "fs";
import { readFileSync } from "fs";
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

const BASE = process.argv[2] ?? "http://localhost:3199";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "out", "landing-qa");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let failures = 0;

function check(name, cond) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures += 1;
}

// ── Light desktop + full demo flow ──────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/home`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "landing-light.png") });
  await page.screenshot({ path: path.join(OUT, "landing-light-full.png"), fullPage: true });

  check("hero heading present", await page.locator("h1").first().isVisible());
  check("7 template entries", (await page.locator(".lp-tgrid li").count()) === 7);

  // axe audit
  await page.evaluate(readFileSync(AXE_PATH, "utf-8"));
  const axe = await page.evaluate(async () =>
    await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  check(`axe clean (${axe.violations.length} violation types)`, axe.violations.length === 0);
  for (const v of axe.violations) {
    console.log(`   [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`);
    for (const n of v.nodes.slice(0, 3)) console.log(`      → ${n.target.join(" ")}`);
  }

  // demo flow (no WCS Supabase env → sample mode)
  await page.fill("#lp-domain", "example.com");
  await page.click(".lp-domain-form button[type=submit]");
  await page.waitForSelector(".lp-result-banner", { timeout: 15000 });
  const banner = await page.locator(".lp-result-banner").innerText();
  check("sample banner mentions example.com", banner.includes("example.com"));

  const coverH1 = page.frameLocator("iframe.lp-viewer").locator("#s-cover h1");
  await coverH1.waitFor({ timeout: 20000 });
  const cover = await coverH1.innerText();
  check(`deck iframe renders cover ("${cover.slice(0, 40)}…")`, cover.length > 5);

  // template switch
  await page.click('.lp-tab:has-text("Summit")');
  await page.waitForTimeout(1500);
  const summitFrame = page.frames().find((f) => f.url().includes("template=summit"));
  check("template switch → summit iframe", Boolean(summitFrame));
  await page.screenshot({ path: path.join(OUT, "landing-demo-summit.png") });

  // claim
  await page.fill("#lp-email", "qa-test@example.com");
  await page.click('.lp-claim button[type=submit]');
  await page.waitForTimeout(1200);
  const claimed = await page.locator(".lp-claim").innerText();
  check("claim success message", /Got it/.test(claimed));

  await page.close();
}

// ── Dark scheme ──────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  await page.goto(`${BASE}/home`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "landing-dark.png") });
  await page.evaluate(readFileSync(AXE_PATH, "utf-8"));
  const axe = await page.evaluate(async () =>
    await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  check(`dark axe clean (${axe.violations.length})`, axe.violations.length === 0);
  for (const v of axe.violations) console.log(`   [${v.impact}] ${v.id}: ${v.help}`);
  await page.close();
}

// ── Mobile ───────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(`${BASE}/home`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "landing-mobile.png"), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check("no horizontal overflow on mobile", !overflow);
  await page.close();
}

// ── Marketing-host rewrite ───────────────────────────────────
// node fetch/undici silently strips a custom Host header, so use
// http.request directly.
{
  const { request } = await import("http");
  const { port, hostname } = new URL(BASE);
  const marketingHtml = await new Promise((resolve, reject) => {
    const req = request(
      { hostname, port, path: "/", headers: { Host: "strategypresentation.com" } },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve(body));
      },
    );
    req.on("error", reject);
    req.end();
  });
  check("host rewrite: / on marketing host serves landing", marketingHtml.includes("boardroom-ready"));
  const res2 = await fetch(`${BASE}/`, { redirect: "manual" });
  check("studio host: / still gated (redirects to /login)", res2.status >= 300 && res2.status < 400);
}

await browser.close();
console.log(failures ? `\n${failures} FAILURE(S)` : "\nAll landing checks passed.");
process.exit(failures ? 1 : 0);
