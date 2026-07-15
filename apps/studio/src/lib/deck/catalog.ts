// ============================================================
//  SP Deck Engine — Add-on Catalog (stub)
//  apps/studio/src/lib/deck/catalog.ts
//
//  Phase 3 of the redesign plan moves the source of truth to
//  Brainztem (GET /api/catalog) so pricing never forks. Until
//  that endpoint exists, this stub mirrors the draft catalog in
//  docs/SP-REDESIGN-PLAN.md §5. Every item maps to a real
//  Brainztem primitive — nothing listed here is vaporware.
//
//  The preselected "foundation" group must sum to TARGET_TOTAL.
// ============================================================

import type { DimensionKey, StrategyTier } from "../types";

export const TARGET_TOTAL = 10_500;

export type AddonGroupId = "foundation" | "growth" | "authority" | "ops";

export interface AddonItem {
  id: string;
  name: string;
  description: string;
  price: number;
  group: AddonGroupId;
  /** WCS dimensions this add-on directly improves (for "targets your weakest" callouts). */
  targets?: DimensionKey[];
  /** Brainztem primitive that delivers it — kept for the eventual /api/catalog parity check. */
  mapsTo: string;
  preselected: boolean;
  /** Restrict visibility to a tier (e.g. grant work is nonprofit-only). */
  tiers?: StrategyTier[];
}

export interface AddonGroup {
  id: AddonGroupId;
  label: string;
  blurb: string;
}

export const ADDON_GROUPS: AddonGroup[] = [
  { id: "foundation", label: "Foundation", blurb: "The core build — everything a working instance needs on day one." },
  { id: "growth", label: "Growth", blurb: "Compounding engines that run on a schedule and feed your pipeline." },
  { id: "authority", label: "Authority", blurb: "Proof, credibility, and capital-readiness." },
  { id: "ops", label: "Operations", blurb: "Back-office work your crew takes off your plate." },
];

export const ADDON_CATALOG: AddonItem[] = [
  // ── Foundation (preselected, sums to TARGET_TOTAL) ──────────
  {
    id: "brain-build",
    name: "Brain build",
    description: "Knowledge vault seeded from your website and WCS evidence — your company's living memory.",
    price: 2400,
    group: "foundation",
    targets: ["content", "transparency"],
    mapsTo: "generateBrainPreview + seed-site + vault repo",
    preselected: true,
  },
  {
    id: "agent-crew",
    name: "Agent crew",
    description: "An orchestrator plus four specialists configured to your org, gated behind human approval.",
    price: 2100,
    group: "foundation",
    mapsTo: "agent-templates suggested hires + tool loadouts",
    preselected: true,
  },
  {
    id: "instance-provisioning",
    name: "Isolated instance",
    description: "Your own dedicated database, deployment, and domain — never pooled with anyone else.",
    price: 1800,
    group: "foundation",
    mapsTo: "launch orchestrator (repo + Supabase + Vercel + domain)",
    preselected: true,
  },
  {
    id: "score-recovery",
    name: "Score Recovery Program",
    description: "A 90-day roadmap targeting your three weakest credit-score dimensions, verified by monthly re-scans.",
    price: 1700,
    group: "foundation",
    mapsTo: "wcs_report tool + scheduled re-scans",
    preselected: true,
  },
  {
    id: "outreach-engine",
    name: "Outreach engine",
    description: "Prospect research and drafted outreach, queued for your approval before anything sends.",
    price: 1500,
    group: "foundation",
    targets: ["social_presence", "reputation"],
    mapsTo: "queue_outreach + prospects + approval gates",
    preselected: true,
  },
  {
    id: "sp-pro",
    name: "Strategy Presentation Pro",
    description: "This deck, unlocked: editable, re-brandable, and regenerated quarterly as your score climbs.",
    price: 1000,
    group: "foundation",
    mapsTo: "SP Studio edit pipeline",
    preselected: true,
  },

  // ── Growth ──────────────────────────────────────────────────
  {
    id: "content-engine",
    name: "Weekly content engine",
    description: "Drafted posts and newsletter issues on a weekly schedule, approval-gated.",
    price: 1200,
    group: "growth",
    targets: ["content", "social_presence"],
    mapsTo: "weekly-content cron + social tables",
    preselected: false,
  },
  {
    id: "email-command",
    name: "Email command center",
    description: "Inbox sync, drafted replies, and full thread memory for your crew.",
    price: 1100,
    group: "growth",
    mapsTo: "email-sync cron + email_threads",
    preselected: false,
  },
  {
    id: "seo-pipeline",
    name: "SEO audit & fix pipeline",
    description: "Technical and content SEO issues found, prioritized, and worked down.",
    price: 950,
    group: "growth",
    targets: ["technical", "content"],
    mapsTo: "/api/agent/seo-audit",
    preselected: false,
  },
  {
    id: "review-engine",
    name: "Review & reputation engine",
    description: "Monitors reviews and mentions, drafts responses, and runs review-request campaigns.",
    price: 900,
    group: "growth",
    targets: ["reputation"],
    mapsTo: "monitoring + outreach tools",
    preselected: false,
  },

  // ── Authority ───────────────────────────────────────────────
  {
    id: "grant-agent",
    name: "Grant research & drafting",
    description: "A grant-writer agent that finds programs you qualify for and drafts the applications.",
    price: 1400,
    group: "authority",
    targets: ["financial_signals"],
    mapsTo: "/api/agent/grant-research + grant-writer template",
    preselected: false,
    tiers: ["nonprofit"],
  },
  {
    id: "case-study-factory",
    name: "Case-study factory",
    description: "Customer interviews turned into published, citable proof.",
    price: 850,
    group: "authority",
    targets: ["reputation", "content"],
    mapsTo: "/api/agent/case-study",
    preselected: false,
  },
  {
    id: "investor-pack",
    name: "Investor data-room pack",
    description: "Three additional deck templates plus PDF export, tuned for diligence.",
    price: 750,
    group: "authority",
    targets: ["financial_signals"],
    mapsTo: "SP template engine",
    preselected: false,
  },

  // ── Operations ──────────────────────────────────────────────
  {
    id: "invoice-automation",
    name: "Invoice & billing automation",
    description: "Invoices drafted and sent on approval, with a clean money ledger.",
    price: 850,
    group: "ops",
    mapsTo: "send_invoice + money ledger",
    preselected: false,
  },
  {
    id: "doc-factory",
    name: "Document factory",
    description: "Branded PDF, Word, and spreadsheet deliverables generated on demand.",
    price: 800,
    group: "ops",
    mapsTo: "react-pdf / docx / exceljs pipelines",
    preselected: false,
  },
  {
    id: "crew-scheduling",
    name: "Crew scheduling",
    description: "Recurring tasks assigned across agents and humans on a shared schedule.",
    price: 650,
    group: "ops",
    mapsTo: "schedule store + cron",
    preselected: false,
  },
];

export function catalogForTier(tier: StrategyTier): AddonItem[] {
  return ADDON_CATALOG.filter((item) => !item.tiers || item.tiers.includes(tier));
}

export function preselectedTotal(items: AddonItem[]): number {
  return items.filter((i) => i.preselected).reduce((sum, i) => sum + i.price, 0);
}
