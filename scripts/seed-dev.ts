#!/usr/bin/env tsx
// ============================================================
//  SP Studio — Dev Seed Script
//  scripts/seed-dev.ts
//
//  Creates a test strategy record using a mock AbilitySC WCS payload.
//  Run with: npm run seed
//  Requires: apps/studio/.env.local to be set up
// ============================================================

import { config } from "dotenv";
import path from "path";

// Load env from apps/studio/.env.local
config({ path: path.join(__dirname, "../apps/studio/.env.local") });

// We need to POST to the running studio (must be running: npm run dev)
const STUDIO_URL = "http://localhost:3001";
const PASSPHRASE = process.env.STUDIO_PASSPHRASE ?? "HansStudio2026";

const MOCK_WCS_REPORT = {
  domain: "abilitysc.org",
  company_name: "AbilitySC",
  scanned_at: new Date().toISOString(),
  overall: {
    score: 58,
    grade: "C+",
    headline: "Established nonprofit with significant digital gaps",
    one_liner: "AbilitySC has a trusted presence in SC's disability community but leaves substantial digital reach — and $120K in ad funding — on the table."
  },
  dimensions: [
    { key: "legitimacy",       label: "Business Legitimacy",       score: 82, grade: "B",  weight: 0.18, verdict: "Strong nonprofit credentials, registered 501(c)(3) with active SC presence.", evidence: [{ claim: "Registered 501c3", url: "https://abilitysc.org/about" }] },
    { key: "reputation",       label: "Online Reputation",          score: 61, grade: "C+", weight: 0.15, verdict: "Moderate reputation, limited third-party coverage.", evidence: [] },
    { key: "visual_design",    label: "Visual Design",              score: 48, grade: "D+", weight: 0.14, verdict: "Dated visual system, inconsistent typography, no clear hierarchy.", evidence: [] },
    { key: "ux_conversion",    label: "UX / Conversion",            score: 42, grade: "D",  weight: 0.12, verdict: "No clear CTAs, donation flow is buried, mobile experience is poor.", evidence: [] },
    { key: "transparency",     label: "Transparency & Disclosure",  score: 74, grade: "B-", weight: 0.10, verdict: "Mission and financials are accessible but not prominent.", evidence: [] },
    { key: "technical",        label: "Technical Health",           score: 38, grade: "D",  weight: 0.08, verdict: "LCP over 6 seconds, no schema markup, missing canonical tags.", evidence: [] },
    { key: "content",          label: "Content Quality",            score: 65, grade: "C+", weight: 0.08, verdict: "Meaningful content but not optimized for search or conversion.", evidence: [] },
    { key: "social_presence",  label: "Social & Press Presence",    score: 52, grade: "C",  weight: 0.07, verdict: "Facebook active, Google presence weak.", evidence: [] },
    { key: "longevity",        label: "Domain & Company Longevity", score: 88, grade: "A-", weight: 0.05, verdict: "Domain registered 2004, long organizational history.", evidence: [] },
    { key: "financial_signals", label: "Financial Signals",         score: 70, grade: "B-", weight: 0.03, verdict: "Charity Navigator listing visible, financials filed.", evidence: [] }
  ],
  red_flags: [
    { title: "Google Ad Grant not activated", detail: "AbilitySC qualifies for $10,000/month in free Google Ads but has no active grant account. This is $120,000/year in unclaimed advertising.", severity: "critical" },
    { title: "Page speed failing Core Web Vitals", detail: "LCP of 6.2 seconds (should be under 2.5s). This directly limits Google search visibility and Ad Grant eligibility.", severity: "high" },
    { title: "No structured data / schema markup", detail: "Zero schema.org markup detected. Nonprofit, Organization, and Event schema would dramatically improve search visibility.", severity: "high" },
    { title: "Donation CTA buried below fold", detail: "Primary conversion action (Donate) requires scrolling past 3 full sections. Most visitors leave before finding it.", severity: "medium" },
    { title: "Mobile navigation broken", detail: "Hamburger menu on mobile does not open on first tap. Affects approximately 68% of visitors (mobile traffic share).", severity: "medium" }
  ],
  green_flags: [
    { title: "Long-standing 501(c)(3) status", detail: "Registered since 2004, IRS status in good standing." },
    { title: "Active Facebook community", detail: "3,400+ followers with regular engagement — existing audience for remarketing." },
    { title: "Charity Navigator listing", detail: "Active listing builds donor trust during the donation decision process." }
  ],
  timeline: [
    { year: 2004, event: "AbilitySC founded, domain registered" },
    { year: 2012, event: "Current website platform adopted" },
    { year: 2019, event: "Facebook page reaches 2,000 followers" },
    { year: 2024, event: "Website last major update detected" }
  ],
  peers: [
    { domain: "accesssc.org", comparison: "Similar mission, stronger technical health, active Google grant" },
    { domain: "disabilitysc.org", comparison: "Smaller org, better mobile UX" }
  ],
  sources: Array.from({ length: 14 }, (_, i) => ({
    url: `https://example.com/source-${i + 1}`,
    title: `Source ${i + 1}`,
    domain: "example.com"
  })),
  summary: "AbilitySC is a well-established South Carolina nonprofit with genuine community trust built over two decades. However, the digital presence has not kept pace with the organization's impact. Critical technical failures — most notably a 6+ second page load time and the complete absence of Google's Ad Grant activation — are costing the organization both visibility and an estimated $120,000 per year in available advertising resources. The site's visual design and conversion architecture also need significant attention. The opportunity here is substantial: with targeted improvements, AbilitySC could dramatically expand its reach across South Carolina while accessing significant grant funding that is currently sitting unclaimed."
};

async function seed() {
  console.log("🌱 Seeding dev strategy: AbilitySC (nonprofit)");
  console.log(`   Studio: ${STUDIO_URL}`);
  console.log("");

  const ts = Math.floor(Date.now() / 1000).toString();

  const res = await fetch(`${STUDIO_URL}/api/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WCS-Dev-Bypass": "true",
      "X-WCS-Timestamp": ts,
      "X-WCS-Signature": "sha256=dev",
    },
    body: JSON.stringify({
      wcsReport: MOCK_WCS_REPORT,
      clientName: "AbilitySC",
      clientSlug: "abilitysc",
      tier: "nonprofit",
      gatePassword: "AbilitySC2026",
      gateSignedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    console.error("❌ Failed:", data);
    process.exit(1);
  }

  console.log(`✅ Strategy created: ${data.strategyId}`);
  console.log(`   Status: ${data.status}`);
  console.log(`   Is new: ${data.new}`);
  console.log("");
  console.log(`📝 Open studio: ${STUDIO_URL}/studio/${data.strategyId}`);
  console.log(`   Then click ⚡ Generate Strategy to run the Claude pipeline`);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
