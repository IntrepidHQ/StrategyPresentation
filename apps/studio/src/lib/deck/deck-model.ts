// ============================================================
//  SP Deck Engine — DeckModel
//  apps/studio/src/lib/deck/deck-model.ts
//
//  The normalized intermediate between a raw WCSReport and the
//  slide templates. Templates never touch WCS JSON directly.
//
//  buildDeckModel() is fully deterministic so the "see it in
//  action" demo works without a Claude call; when a
//  StrategyNarrative (the existing Pass-1 Claude output) is
//  supplied, its prose overrides the deterministic copy.
// ============================================================

import type {
  DimensionKey,
  StrategyNarrative,
  StrategyTier,
  WCSDimension,
  WCSReport,
} from "../types";
import {
  ADDON_CATALOG,
  ADDON_GROUPS,
  AddonGroupId,
  AddonItem,
  preselectedTotal,
  TARGET_TOTAL,
} from "./catalog";
import type { CatalogBundle } from "./catalog-remote";

export const TEMPLATE_IDS = [
  "summit",
  "signal",
  "editorial",
  "monospace",
  "gallery",
  "beacon",
  "voltage",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type DeckSource = "wcs" | "brainztem" | "sp-demo";

export const BENCHMARK_TARGET = 90;

export const SLIDE_IDS = [
  "cover",
  "exec-summary",
  "scorecard",
  "strengths",
  "risks",
  "roadmap",
  "system",
  "build-sheet",
  "investment",
  "next-step",
  "sources",
] as const;
export type SlideId = (typeof SLIDE_IDS)[number];

// ── Model shapes ──────────────────────────────────────────────

export interface DeckMeta {
  clientName: string;
  clientSlug: string;
  domain: string;
  scannedAt: string;
  tier: StrategyTier;
  templateId: TemplateId;
  source: DeckSource;
  sandboxToken?: string;
}

export interface ScoreSummary {
  score: number;
  grade: string;
  headline: string;
  oneLiner: string;
  benchmarkTarget: number;
  benchmarkDelta: number;
  strongest: WCSDimension[];
  weakest: WCSDimension[];
}

export interface RoadmapPhaseVM {
  phase: number;
  title: string;
  timeline: string;
  items: string[];
  outcome: string;
}

export interface FlagVM {
  title: string;
  detail: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export interface AddonItemVM extends AddonItem {
  /** Set when the add-on targets one of this client's three weakest dimensions. */
  targetNote?: string;
}

export interface AddonGroupVM {
  id: AddonGroupId;
  label: string;
  blurb: string;
  items: AddonItemVM[];
}

export interface DeckModel {
  meta: DeckMeta;
  score: ScoreSummary;
  execSummary: { paragraphs: string[] };
  scorecard: { dimensions: WCSDimension[] };
  strengths: { items: FlagVM[] };
  risks: { items: FlagVM[] };
  roadmap: { phases: RoadmapPhaseVM[] };
  system: {
    intro: string;
    agents: { name: string; role: string }[];
  };
  buildSheet: {
    groups: AddonGroupVM[];
    targetTotal: number;
    preselectedTotal: number;
  };
  investment: {
    milestones: { label: string; amount: number; detail: string }[];
    total: number;
    anchorNote: string;
  };
  nextStep: {
    headline: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
  };
  sources: { url: string; title: string }[];
  slideOrder: SlideId[];
}

export interface DeckOptions {
  clientName: string;
  clientSlug: string;
  tier: StrategyTier;
  templateId: TemplateId;
  source?: DeckSource;
  sandboxToken?: string;
  narrative?: StrategyNarrative | null;
  brainztemBaseUrl?: string;
  /** Remote catalog from Brainztem's GET /api/catalog (source of truth);
   *  omitted → the local stub in ./catalog.ts. */
  catalog?: CatalogBundle | null;
}

// ── Builder ───────────────────────────────────────────────────

const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export function buildDeckModel(report: WCSReport, opts: DeckOptions): DeckModel {
  const narrative = opts.narrative ?? null;
  const brainztemBase = (opts.brainztemBaseUrl ?? "https://brainztem.com").replace(/\/$/, "");

  const byScoreAsc = [...report.dimensions].sort((a, b) => a.score - b.score);
  const strongest = [...byScoreAsc].reverse().slice(0, 3);
  const weakest = byScoreAsc.slice(0, 3);
  const weakestKeys = new Set<DimensionKey>(weakest.map((d) => d.key));

  const score: ScoreSummary = {
    score: report.overall.score,
    grade: report.overall.grade,
    headline: narrative?.heroHeadline ?? report.overall.headline,
    oneLiner: report.overall.one_liner,
    benchmarkTarget: BENCHMARK_TARGET,
    benchmarkDelta: Math.max(0, BENCHMARK_TARGET - report.overall.score),
    strongest,
    weakest,
  };

  const strengths: FlagVM[] = narrative?.whatIsWorking?.length
    ? narrative.whatIsWorking.map((item) => splitLead(item))
    : report.green_flags.map(({ title, detail }) => ({ title, detail }));

  const risks: FlagVM[] = narrative?.whatIsCostingYou?.length
    ? narrative.whatIsCostingYou.map((item) => splitLead(item))
    : [...report.red_flags]
        .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
        .map(({ title, detail, severity }) => ({ title, detail, severity }));

  const catalogItems = (opts.catalog?.items ?? ADDON_CATALOG).filter(
    (item) => !item.tiers || item.tiers.includes(opts.tier),
  );
  const catalogGroups = opts.catalog?.groups ?? ADDON_GROUPS;

  const groups: AddonGroupVM[] = catalogGroups.map((group) => ({
    ...group,
    items: catalogItems
      .filter((item) => item.group === group.id)
      .map((item) => ({
        ...item,
        targetNote: targetNoteFor(item, weakestKeys, report.dimensions),
      })),
  })).filter((group) => group.items.length > 0);

  const clientLabel = opts.clientName || report.company_name || report.domain;

  return {
    meta: {
      clientName: clientLabel,
      clientSlug: opts.clientSlug,
      domain: report.domain,
      scannedAt: report.scanned_at,
      tier: opts.tier,
      templateId: opts.templateId,
      source: opts.source ?? "wcs",
      sandboxToken: opts.sandboxToken,
    },
    score,
    execSummary: {
      paragraphs: narrative?.executiveSummary
        ? narrative.executiveSummary.split(/\n\n+/).filter(Boolean)
        : splitSummary(report.summary),
    },
    scorecard: {
      dimensions: [...report.dimensions].sort((a, b) => b.weight - a.weight),
    },
    strengths: { items: strengths.slice(0, 5) },
    risks: { items: risks.slice(0, 5) },
    roadmap: {
      phases: narrative?.strategyRoadmap?.length
        ? narrative.strategyRoadmap
        : defaultRoadmap(report, weakest),
    },
    system: {
      intro:
        `Everything on the roadmap is delivered inside your own Brainztem instance — ` +
        `an isolated deployment seeded from ${report.domain}, staffed by an AI crew ` +
        `that drafts the work and routes every outbound action to you for approval.`,
      agents: [
        { name: "Orchestrator", role: "Runs the roadmap, assigns work, reports progress" },
        { name: "Analyst", role: `Watches your credit score and the ${weakest[0]?.label ?? "weakest"} dimension` },
        { name: "Writer", role: "Content, case studies, and outreach drafts" },
        { name: "Builder", role: "Site fixes, SEO pipeline, technical health" },
        { name: "Steward", role: "Inbox, scheduling, and back-office automations" },
      ],
    },
    buildSheet: {
      groups,
      targetTotal: TARGET_TOTAL,
      preselectedTotal: preselectedTotal(catalogItems),
    },
    investment: {
      milestones: [
        { label: "Milestone 1 — Foundation", amount: 3000, detail: "Unlocks your instance; brain and crew go live" },
        { label: "Milestone 2 — Build", amount: 3000, detail: "Core add-ons delivered and verified" },
        { label: "Milestone 3 — Activation", amount: 2250, detail: "Automations running; strategy call" },
        { label: "Milestone 4 — Launch", amount: 2250, detail: "Full handoff, documentation, re-scan" },
      ],
      total: TARGET_TOTAL,
      anchorNote:
        "Paid in four milestones. Each unlocks only when the previous one is delivered — you are never paying ahead of the work.",
    },
    nextStep: buildNextStep(clientLabel, report, opts, brainztemBase),
    sources: report.sources.map(({ url, title }) => ({ url, title })),
    slideOrder: [...SLIDE_IDS],
  };
}

// ── Deterministic copy helpers ────────────────────────────────

/** "Title — rest of sentence" or "Title: rest" → {title, detail}; else detail-only. */
function splitLead(item: string): FlagVM {
  const match = item.match(/^(.{4,60}?)\s*[—:–]\s+(.+)$/);
  if (match) return { title: match[1], detail: match[2] };
  return { title: item.split(/(?<=[.!?])\s/)[0].slice(0, 80), detail: item };
}

function splitSummary(summary: string): string[] {
  const paragraphs = summary.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs.slice(0, 3);
  // Single blob: break into ~3 paragraphs on sentence boundaries.
  const sentences = summary.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [summary];
  const per = Math.ceil(sentences.length / 3);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += per) {
    out.push(sentences.slice(i, i + per).join("").trim());
  }
  return out.filter(Boolean);
}

function defaultRoadmap(report: WCSReport, weakest: WCSDimension[]): RoadmapPhaseVM[] {
  const [w1, w2, w3] = weakest;
  const gapItems = (report.benchmark_gaps ?? [])
    .slice(0, 3)
    .map((g) => g.gap);
  return [
    {
      phase: 1,
      title: "Stabilize",
      timeline: "Weeks 1–2",
      items: [
        w1 ? `Close the ${w1.label} gap (currently ${w1.score}/100)` : "Close the weakest scoring gap",
        "Stand up your instance: brain seeded, crew configured",
        ...(gapItems.length ? [gapItems[0]] : []),
      ],
      outcome: "The issues actively costing you trust are contained.",
    },
    {
      phase: 2,
      title: "Build",
      timeline: "Weeks 3–6",
      items: [
        w2 ? `Lift ${w2.label} from ${w2.score} toward benchmark` : "Lift the second-weakest dimension",
        w3 ? `Lift ${w3.label} from ${w3.score} toward benchmark` : "Systematize content and proof",
        "Automations from your build sheet go live, approval-gated",
      ],
      outcome: "Compounding engines are running, not just fixes.",
    },
    {
      phase: 3,
      title: "Compound",
      timeline: "Weeks 7–12",
      items: [
        "Monthly re-scans verify movement toward " + BENCHMARK_TARGET,
        "Crew runs the playbook; you approve, they execute",
        "Quarterly deck regeneration keeps this presentation current",
      ],
      outcome: `A ${BENCHMARK_TARGET}+ credit score and a system that maintains it.`,
    },
  ];
}

function targetNoteFor(
  item: AddonItem,
  weakestKeys: Set<DimensionKey>,
  dimensions: WCSDimension[],
): string | undefined {
  if (item.id === "score-recovery") {
    const weakLabels = dimensions
      .filter((d) => weakestKeys.has(d.key))
      .map((d) => `${d.label} (${d.score})`);
    return weakLabels.length ? `Targets ${weakLabels.join(", ")}` : undefined;
  }
  const hits = (item.targets ?? [])
    .map((key) => dimensions.find((d) => d.key === key))
    .filter((d): d is WCSDimension => Boolean(d && weakestKeys.has(d.key)));
  if (!hits.length) return undefined;
  return `Targets your ${hits.map((d) => `${d.label} score (${d.score})`).join(" and ")}`;
}

function buildNextStep(
  clientLabel: string,
  report: WCSReport,
  opts: DeckOptions,
  brainztemBase: string,
): DeckModel["nextStep"] {
  if (opts.sandboxToken) {
    return {
      headline: "Your trial instance is already live.",
      body:
        `A Brainztem instance for ${clientLabel} is running right now, seeded from this scan. ` +
        `It stays open for 48 hours — walk in and meet your crew.`,
      ctaLabel: "Open your live instance",
      ctaHref: `${brainztemBase}/sandbox/${encodeURIComponent(opts.sandboxToken)}`,
    };
  }
  return {
    headline: "See it running before you decide.",
    body:
      `Start a 48-hour trial instance for ${clientLabel}: your brain seeded from ${report.domain}, ` +
      `your crew configured, this roadmap loaded. No card required to look around.`,
    ctaLabel: "Start your 48-hour trial",
    ctaHref: `${brainztemBase}/?domain=${encodeURIComponent(report.domain)}&utm_source=strategypresentation&utm_medium=deck&utm_campaign=next-step`,
  };
}
