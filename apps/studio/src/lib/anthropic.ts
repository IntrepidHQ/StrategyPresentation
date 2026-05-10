// ============================================================
//  SP Studio — Anthropic Claude Wrapper
//  apps/studio/src/lib/anthropic.ts
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { StrategyNarrative, WCSReport, StrategyTier } from "./types";

const MODEL = "claude-opus-4-5"; // Use Opus for generation; Sonnet for edits
const EDIT_MODEL = "claude-sonnet-4-6"; // Faster + cheaper for HTML edits

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY must be set");
  }
  return new Anthropic({ apiKey });
}

// ── System Prompts ────────────────────────────────────────────

const GENERATION_SYSTEM_PROMPT = `You are a senior digital strategy consultant writing a confidential client presentation on behalf of Hans Turner (hansturner.com), a web strategist based in Mount Pleasant, SC with 13 years of experience.

You have been given a WCSReport — a structured trust and quality analysis of the client's website. Your job is to transform this data into a compelling, evidence-based strategy narrative.

RULES:
- Write as if Hans personally audited the site. First person singular where appropriate ("I noticed", "what I found", "my recommendation").
- Never mention WCS, WebsiteCreditScore, AI, or automated analysis. The quality speaks for itself.
- Never use the word "deliverable" — say "what we build."
- Never use generic consulting speak ("synergies", "leverage", "holistic approach").
- For nonprofits (tier === "nonprofit"): the Google Ad Grant section is the most important section. Frame the $120,000/year grant as the headline opportunity. Be specific about AbilitySC's eligibility.
- Tone: confident, calm, and specific. Like a McKinsey partner who also ships code.
- Use the WCS dimension scores as evidence for claims, but don't quote them mechanically. "The site's technical foundation is fragile" not "your technical score is 42."
- The strategy should feel custom-written for this exact organization — because it is.
- Investment options should be realistic for a small-to-medium org. Range: $3K–$15K for commercial, $6K–$20K for nonprofits (which have grant budgets).

Return ONLY valid JSON matching this exact TypeScript interface. No markdown fences, no preamble, no explanation:

interface StrategyNarrative {
  clientName: string;
  clientSlug: string;
  tier: "standard" | "nonprofit";
  heroHeadline: string;          // 6-10 words. Punchy. Problem-aware.
  executiveSummary: string;      // 2-3 paragraphs separated by \\n\\n. Written as Hans. HTML-safe.
  whatIsWorking: string[];       // 3-5 items. Each: one complete sentence.
  whatIsCostingYou: string[];    // 3-5 items. Each: one complete sentence with specific business impact.
  dimensionNarratives: {
    key: string;                 // matches WCS dimension key
    headline: string;            // 1 punchy sentence
    body: string;                // 2-3 sentences of context
    recommendation: string;      // What Hans would do about it
  }[];
  strategyRoadmap: {
    phase: number;
    title: string;
    timeline: string;            // e.g. "Weeks 1–2"
    items: string[];             // 3-5 bullets
    outcome: string;             // "So you can..."
  }[];
  googleAdGrantSection?: {       // REQUIRED when tier === "nonprofit"
    eligibilityStatus: string;
    grantAmount: string;
    whyYouQualify: string[];
    whatWeWouldDo: string[];
    estimatedImpact: string;
  };
  investmentSection: {
    headline: string;
    options: {
      label: string;
      price: string;
      includes: string[];
    }[];
  };
  closingStatement: string;      // 2-3 sentences. Personal. Hans's voice. Why he wants this project.
}`;

const EDIT_SYSTEM_PROMPT = `You are an expert HTML/CSS/JS developer editing a client-facing strategy presentation for Hans Turner (hansturner.com).

The current HTML file is provided in the user message. Hans has given you an instruction. Apply it precisely and return the COMPLETE updated HTML file.

RULES:
- Return ONLY the complete HTML file. No explanation, no markdown fences, no preamble.
- The response must start with <!DOCTYPE html> and end with </html>.
- Preserve all existing functionality: gate.js access system, shared-header.js, light/dark theme toggle, Chart.js charts, scroll animations.
- Match the existing design language exactly: Minerva Modern display font, Degular body font, gold accent #C9A44C, dark bg #0a0a08.
- Do not add new external dependencies. The allowed CDNs are: fonts.googleapis.com, use.typekit.net (Adobe Fonts key syk8hlp), cdn.jsdelivr.net/npm/chart.js.
- If the instruction is ambiguous, make the most conservative interpretation.
- HTML must be valid and complete.
- If asked to change text, change ONLY that text. If asked to change styles, change ONLY those styles.`;

// ── Pass 1: Generate Strategy Narrative ──────────────────────

export async function generateStrategyNarrative(
  wcsReport: WCSReport,
  clientName: string,
  clientSlug: string,
  tier: StrategyTier
): Promise<{ narrative: StrategyNarrative; tokensUsed: number }> {
  const userMessage = `CLIENT: ${clientName}
SLUG: ${clientSlug}
TIER: ${tier}
DOMAIN: ${wcsReport.domain}

WCS REPORT:
${JSON.stringify(wcsReport, null, 2)}

Generate the StrategyNarrative JSON now.`;

  const response = await getAnthropicClient().messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Strip any accidental markdown fences
  const clean = text.replace(/^```json\s*/m, "").replace(/\s*```$/m, "").trim();

  let narrative: StrategyNarrative;
  try {
    narrative = JSON.parse(clean);
  } catch (e) {
    throw new Error(`Failed to parse narrative JSON: ${e}. Raw: ${clean.slice(0, 500)}`);
  }

  const tokensUsed =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  return { narrative, tokensUsed };
}

// ── Pass 2: Render HTML from Template + Narrative ────────────

export function renderStrategyHTML(
  templateHtml: string,
  narrative: StrategyNarrative,
  wcsReport: WCSReport,
  gatePassword: string,
  gateSignedDate: string
): string {
  const score = wcsReport.overall.score;
  const grade = wcsReport.overall.grade;

  // Build dimension rows for the scorecard table
  const dimensionRows = wcsReport.dimensions
    .map((d) => {
      const safeScore = Math.max(0, Math.min(100, Number(d.score) || 0));
      return `<tr>
        <td>${escapeHtml(d.label)}</td>
        <td class="score-cell" style="--score:${safeScore}">${safeScore}</td>
        <td class="grade-cell">${escapeHtml(d.grade)}</td>
      </tr>`
    })
    .join("\n");

  // Build roadmap phases HTML
  const roadmapHtml = narrative.strategyRoadmap
    .map(
      (p) => `<div class="phase phase-${escapeHtml(p.phase)}">
        <span class="phase-label">Phase ${escapeHtml(p.phase)}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="phase-timeline">${escapeHtml(p.timeline)}</p>
        <ul>${p.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        <p class="phase-outcome">${escapeHtml(p.outcome)}</p>
      </div>`
    )
    .join("\n");

  // Build investment options HTML
  const investmentHtml = narrative.investmentSection.options
    .map(
      (o) => `<div class="invest-option">
        <h3>${escapeHtml(o.label)}</h3>
        <p class="invest-price">${escapeHtml(o.price)}</p>
        <ul>${o.includes.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
      </div>`
    )
    .join("\n");

  // Build Google Ad Grant section (nonprofit only)
  const grantSectionHtml = narrative.googleAdGrantSection
    ? `<section id="grant" class="alt">
        <span class="sec-label">Google Ad Grant Opportunity</span>
        <h2>${escapeHtml(narrative.googleAdGrantSection.grantAmount)} - and you likely qualify</h2>
        <div class="divider"></div>
        <p>${escapeHtml(narrative.googleAdGrantSection.eligibilityStatus)}</p>
        <div class="grant-grid">
          <div>
            <h3>Why you qualify</h3>
            <ul>${narrative.googleAdGrantSection.whyYouQualify.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
          </div>
          <div>
            <h3>What we'd do with it</h3>
            <ul>${narrative.googleAdGrantSection.whatWeWouldDo.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
          </div>
        </div>
        <p class="grant-impact">${escapeHtml(narrative.googleAdGrantSection.estimatedImpact)}</p>
      </section>`
    : "";

  // What's working + costing you
  const workingHtml = narrative.whatIsWorking
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join("\n");
  const costingHtml = narrative.whatIsCostingYou
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join("\n");

  // Executive summary (newlines → paragraphs)
  const execSummaryHtml = narrative.executiveSummary
    .split("\n\n")
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");

  // Red flags (top 5 by severity)
  const redFlagHtml = wcsReport.red_flags
    .sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return order[b.severity] - order[a.severity];
    })
    .slice(0, 5)
    .map(
      (f) => `<div class="finding finding-${f.severity}">
        <span class="finding-sev">${escapeHtml(f.severity.toUpperCase())}</span>
        <h4>${escapeHtml(f.title)}</h4>
        <p>${escapeHtml(f.detail)}</p>
      </div>`
    )
    .join("\n");

  // Token replacements
  const tokens: Record<string, string> = {
    "{{CLIENT_NAME}}": escapeHtml(narrative.clientName),
    "{{CLIENT_SLUG}}": escapeHtml(narrative.clientSlug),
    "{{DOMAIN}}": escapeHtml(wcsReport.domain),
    "{{OVERALL_SCORE}}": String(score),
    "{{OVERALL_GRADE}}": escapeHtml(grade),
    "{{OVERALL_HEADLINE}}": escapeHtml(wcsReport.overall.headline),
    "{{OVERALL_ONE_LINER}}": escapeHtml(wcsReport.overall.one_liner),
    "{{HERO_HEADLINE}}": escapeHtml(narrative.heroHeadline),
    "{{EXECUTIVE_SUMMARY}}": execSummaryHtml,
    "{{WHAT_IS_WORKING}}": workingHtml,
    "{{WHAT_IS_COSTING_YOU}}": costingHtml,
    "{{DIMENSION_ROWS}}": dimensionRows,
    "{{RED_FLAGS}}": redFlagHtml,
    "{{ROADMAP_HTML}}": roadmapHtml,
    "{{GRANT_SECTION}}": grantSectionHtml,
    "{{INVESTMENT_HEADLINE}}": escapeHtml(narrative.investmentSection.headline),
    "{{INVESTMENT_OPTIONS}}": investmentHtml,
    "{{CLOSING_STATEMENT}}": escapeHtml(narrative.closingStatement),
    "{{GATE_PASSWORD}}": escapeHtml(gatePassword),
    "{{GATE_SIGNED_DATE}}": escapeHtml(gateSignedDate),
    "{{SCANNED_AT}}": new Date(wcsReport.scanned_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    "{{WCS_SUMMARY}}": escapeHtml(wcsReport.summary),
    "{{TIER}}": escapeHtml(narrative.tier),
  };

  let html = templateHtml;
  for (const [token, value] of Object.entries(tokens)) {
    html = html.replaceAll(token, value);
  }

  return html;
}

// ── Lovable Edit ──────────────────────────────────────────────

export async function editStrategyHTML(
  currentHtml: string,
  prompt: string
): Promise<{ updatedHtml: string; tokensUsed: number }> {
  const response = await getAnthropicClient().messages.create({
    model: EDIT_MODEL,
    max_tokens: 16000,
    system: EDIT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `CURRENT HTML:\n\n${currentHtml}\n\nHANS'S INSTRUCTION:\n${prompt}`,
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Strip accidental markdown
  const updatedHtml = text
    .replace(/^```html\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  if (!updatedHtml.startsWith("<!DOCTYPE") && !updatedHtml.startsWith("<html")) {
    throw new Error("Claude returned something that doesn't look like HTML");
  }

  const tokensUsed =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  return { updatedHtml, tokensUsed };
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
