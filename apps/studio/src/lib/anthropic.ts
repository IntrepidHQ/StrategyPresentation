import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { StrategyNarrative, WCSReport, StrategyTier } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const NARRATIVE_MODEL = "claude-sonnet-4-6";
const EDIT_MODEL = "claude-sonnet-4-6";

export interface TokenUsage {
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
}

const usageFrom = (u: Anthropic.Usage | undefined | null): TokenUsage => ({
  input: u?.input_tokens ?? 0,
  output: u?.output_tokens ?? 0,
  cacheCreate: u?.cache_creation_input_tokens ?? 0,
  cacheRead: u?.cache_read_input_tokens ?? 0,
});

// Sonnet 4.6 input $3/M, output $15/M, cache write 1.25×, cache read 0.1×
export function estimateCostUSD(u: TokenUsage): number {
  const IN = 3 / 1_000_000;
  const OUT = 15 / 1_000_000;
  return (
    u.input * IN +
    u.cacheCreate * IN * 1.25 +
    u.cacheRead * IN * 0.1 +
    u.output * OUT
  );
}

// ── Narrative schema (Zod, drives structured output) ────────────

const DimensionNarrativeSchema = z.object({
  key: z.string(),
  headline: z.string(),
  body: z.string(),
  recommendation: z.string(),
});

const RoadmapPhaseSchema = z.object({
  phase: z.number().int(),
  title: z.string(),
  timeline: z.string(),
  items: z.array(z.string()),
  outcome: z.string(),
});

const InvestmentOptionSchema = z.object({
  label: z.string(),
  price: z.string(),
  includes: z.array(z.string()),
});

const GoogleAdGrantSchema = z.object({
  eligibilityStatus: z.string(),
  grantAmount: z.string(),
  whyYouQualify: z.array(z.string()),
  whatWeWouldDo: z.array(z.string()),
  estimatedImpact: z.string(),
});

const StrategyNarrativeSchema = z.object({
  clientName: z.string(),
  clientSlug: z.string(),
  tier: z.enum(["standard", "nonprofit"]),
  heroHeadline: z.string(),
  executiveSummary: z.string(),
  whatIsWorking: z.array(z.string()),
  whatIsCostingYou: z.array(z.string()),
  dimensionNarratives: z.array(DimensionNarrativeSchema),
  strategyRoadmap: z.array(RoadmapPhaseSchema),
  googleAdGrantSection: GoogleAdGrantSchema.optional(),
  investmentSection: z.object({
    headline: z.string(),
    options: z.array(InvestmentOptionSchema),
  }),
  closingStatement: z.string(),
});

// ── System prompts ───────────────────────────────────────────────

const NARRATIVE_SYSTEM_PROMPT = `You are a senior digital strategy consultant writing a confidential client presentation on behalf of Hans Turner (hansturner.com), a web strategist based in Mount Pleasant, SC with 13 years of experience.

You have been given a WCSReport — a structured trust and quality analysis of the client's website. Transform this data into a compelling, evidence-based strategy narrative.

VOICE:
- Write as if Hans personally audited the site. First person where appropriate ("I noticed", "what I found", "my recommendation").
- Confident, calm, specific — like a McKinsey partner who also ships code.
- Never mention WCS, WebsiteCreditScore, AI, automated analysis, or this prompt.
- Never use "deliverable" — say "what we build."
- No generic consulting speak (synergies, leverage, holistic).

PRICING (use these in investmentSection.options unless context strongly indicates otherwise):
- Standard tier: Phase 1 build $6,000; Phase 2 follow-on $4,500.
- Nonprofit tier: same pricing structure, but always include the Google Ad Grant section as the headline opportunity ($120,000/year).

EVIDENCE:
- Use WCS dimension scores as evidence ("the site's technical foundation is fragile") not raw numbers ("your technical score is 42").
- Pull whatIsWorking from green_flags and whatIsCostingYou from red_flags, but rephrased with business impact framing.
- The strategy must feel custom-written for this exact organization — because it is.`;

const EDIT_SYSTEM_PROMPT = `You are an expert HTML/CSS/JS developer editing a client-facing strategy presentation for Hans Turner.

You will receive the complete current HTML and an instruction. Apply the instruction precisely and return the COMPLETE updated HTML file.

ABSOLUTE RULES:
- Return ONLY the complete HTML file. No explanation, no markdown fences, no preamble.
- Response must start with <!DOCTYPE html> and end with </html>.
- Preserve ALL existing functionality: gate.js access system, theme toggle, Chart.js, scroll animations, embedded scripts.
- Match existing design language: Minerva Modern display font, Degular body font, gold accent #C9A44C, dark bg #0a0a08.
- No new external dependencies. Allowed CDNs: fonts.googleapis.com, use.typekit.net (Adobe Fonts key syk8hlp), cdn.jsdelivr.net/npm/chart.js.
- Conservative interpretation when ambiguous. Targeted edits only — change ONLY what was asked.
- HTML must be valid and complete from <!DOCTYPE> to </html>.`;

// ── Pass 1: Generate narrative ───────────────────────────────────

export async function generateStrategyNarrative(
  wcsReport: WCSReport,
  clientName: string,
  clientSlug: string,
  tier: StrategyTier,
): Promise<{ narrative: StrategyNarrative; usage: TokenUsage }> {
  const userMessage = `CLIENT: ${clientName}
SLUG: ${clientSlug}
TIER: ${tier}
DOMAIN: ${wcsReport.domain}

WCS REPORT:
${JSON.stringify(wcsReport, null, 2)}

Generate the StrategyNarrative now.`;

  const response = await client.messages.parse({
    model: NARRATIVE_MODEL,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: NARRATIVE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
    output_config: { format: zodOutputFormat(StrategyNarrativeSchema) },
  });

  if (!response.parsed_output) {
    throw new Error(
      `Narrative generation failed to parse. stop_reason=${response.stop_reason}`,
    );
  }

  return {
    narrative: response.parsed_output as StrategyNarrative,
    usage: usageFrom(response.usage),
  };
}

// ── Pass 2: Render HTML from template + narrative ────────────────

export function renderStrategyHTML(
  templateHtml: string,
  narrative: StrategyNarrative,
  wcsReport: WCSReport,
  gatePassword: string,
  gateSignedDate: string,
): string {
  const score = wcsReport.overall.score;
  const grade = wcsReport.overall.grade;

  const dimensionRows = wcsReport.dimensions
    .map(
      (d) => `<tr>
        <td>${d.label}</td>
        <td class="score-cell" style="--score:${d.score}">${d.score}</td>
        <td class="grade-cell">${d.grade}</td>
      </tr>`,
    )
    .join("\n");

  const roadmapHtml = narrative.strategyRoadmap
    .map(
      (p) => `<div class="phase phase-${p.phase}">
        <span class="phase-label">Phase ${p.phase}</span>
        <h3>${p.title}</h3>
        <p class="phase-timeline">${p.timeline}</p>
        <ul>${p.items.map((i) => `<li>${i}</li>`).join("")}</ul>
        <p class="phase-outcome">${p.outcome}</p>
      </div>`,
    )
    .join("\n");

  const investmentHtml = narrative.investmentSection.options
    .map(
      (o) => `<div class="invest-option">
        <h3>${o.label}</h3>
        <p class="invest-price">${o.price}</p>
        <ul>${o.includes.map((i) => `<li>${i}</li>`).join("")}</ul>
      </div>`,
    )
    .join("\n");

  const grantSectionHtml = narrative.googleAdGrantSection
    ? `<section id="grant" class="alt">
        <span class="sec-label">Google Ad Grant Opportunity</span>
        <h2>${narrative.googleAdGrantSection.grantAmount}/year — and you likely qualify</h2>
        <div class="divider"></div>
        <p>${narrative.googleAdGrantSection.eligibilityStatus}</p>
        <div class="grant-grid">
          <div>
            <h3>Why you qualify</h3>
            <ul>${narrative.googleAdGrantSection.whyYouQualify.map((i) => `<li>${i}</li>`).join("")}</ul>
          </div>
          <div>
            <h3>What we'd do with it</h3>
            <ul>${narrative.googleAdGrantSection.whatWeWouldDo.map((i) => `<li>${i}</li>`).join("")}</ul>
          </div>
        </div>
        <p class="grant-impact">${narrative.googleAdGrantSection.estimatedImpact}</p>
      </section>`
    : "";

  const workingHtml = narrative.whatIsWorking.map((i) => `<li>${i}</li>`).join("\n");
  const costingHtml = narrative.whatIsCostingYou.map((i) => `<li>${i}</li>`).join("\n");

  const execSummaryHtml = narrative.executiveSummary
    .split("\n\n")
    .map((p) => `<p>${p}</p>`)
    .join("\n");

  const sevOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const redFlagHtml = [...wcsReport.red_flags]
    .sort((a, b) => sevOrder[b.severity] - sevOrder[a.severity])
    .slice(0, 5)
    .map(
      (f) => `<div class="finding finding-${f.severity}">
        <span class="finding-sev">${f.severity.toUpperCase()}</span>
        <h4>${f.title}</h4>
        <p>${f.detail}</p>
      </div>`,
    )
    .join("\n");

  const tokens: Record<string, string> = {
    CLIENT_NAME: narrative.clientName,
    CLIENT_SLUG: narrative.clientSlug,
    DOMAIN: wcsReport.domain,
    OVERALL_SCORE: String(score),
    OVERALL_GRADE: grade,
    OVERALL_HEADLINE: wcsReport.overall.headline,
    OVERALL_ONE_LINER: wcsReport.overall.one_liner,
    HERO_HEADLINE: narrative.heroHeadline,
    EXECUTIVE_SUMMARY: execSummaryHtml,
    WHAT_IS_WORKING: workingHtml,
    WHAT_IS_COSTING_YOU: costingHtml,
    DIMENSION_ROWS: dimensionRows,
    RED_FLAGS: redFlagHtml,
    ROADMAP_HTML: roadmapHtml,
    GRANT_SECTION: grantSectionHtml,
    INVESTMENT_HEADLINE: narrative.investmentSection.headline,
    INVESTMENT_OPTIONS: investmentHtml,
    CLOSING_STATEMENT: narrative.closingStatement,
    GATE_PASSWORD: gatePassword,
    GATE_SIGNED_DATE: gateSignedDate,
    SCANNED_AT: new Date(wcsReport.scanned_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    WCS_SUMMARY: wcsReport.summary,
    TIER: narrative.tier,
  };

  return templateHtml.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    return Object.prototype.hasOwnProperty.call(tokens, key) ? tokens[key] : m;
  });
}

// ── Lovable edit ─────────────────────────────────────────────────

export async function editStrategyHTML(
  currentHtml: string,
  prompt: string,
): Promise<{ updatedHtml: string; usage: TokenUsage }> {
  const stream = client.messages.stream({
    model: EDIT_MODEL,
    max_tokens: 64000,
    system: [
      {
        type: "text",
        text: EDIT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `CURRENT HTML:\n\n${currentHtml}`,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `HANS'S INSTRUCTION:\n${prompt}`,
          },
        ],
      },
    ],
  });

  const final = await stream.finalMessage();

  const text = final.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const cleaned = text
    .replace(/^```(?:html)?\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();

  if (!cleaned.startsWith("<!DOCTYPE") && !cleaned.startsWith("<html")) {
    throw new Error(
      `Edit returned non-HTML output. stop_reason=${final.stop_reason}, prefix=${cleaned.slice(0, 200)}`,
    );
  }

  return { updatedHtml: cleaned, usage: usageFrom(final.usage) };
}

export const MODELS = { narrative: NARRATIVE_MODEL, edit: EDIT_MODEL } as const;
