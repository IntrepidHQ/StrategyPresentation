// ============================================================
//  SP Studio — Core Types
//  apps/studio/src/lib/types.ts
// ============================================================

// ── Re-export WCS types we depend on ─────────────────────────
// These mirror the WCSReport schema from websitecreditscore.com/src/lib/schema.ts
// Kept here so SP Studio has no import dependency on the WCS repo.

export const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"] as const;
export type Grade = (typeof GRADES)[number];

export const DIMENSION_KEYS = [
  "legitimacy",
  "reputation",
  "visual_design",
  "ux_conversion",
  "transparency",
  "technical",
  "content",
  "social_presence",
  "longevity",
  "financial_signals",
] as const;
export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export interface WCSEvidenceItem {
  claim: string;
  url: string;
  title?: string;
}

export interface WCSDimension {
  key: DimensionKey;
  label: string;
  score: number;
  grade: Grade;
  weight: number;
  verdict: string;
  evidence: WCSEvidenceItem[];
}

export interface WCSFlag {
  title: string;
  detail: string;
  url?: string;
}

export interface WCSRedFlag extends WCSFlag {
  severity: "low" | "medium" | "high" | "critical";
}

export interface WCSTimelineItem {
  year: number;
  event: string;
  url?: string;
}

export interface WCSPeer {
  domain: string;
  comparison: string;
}

export interface WCSSource {
  url: string;
  title: string;
  domain?: string;
}

export interface WCSReport {
  domain: string;
  company_name?: string;
  scanned_at: string;
  overall: {
    score: number;
    grade: Grade;
    headline: string;
    one_liner: string;
  };
  dimensions: WCSDimension[];
  red_flags: WCSRedFlag[];
  green_flags: WCSFlag[];
  timeline?: WCSTimelineItem[];
  peers?: WCSPeer[];
  sources: WCSSource[];
  summary: string;
}

// ── Webhook payload (WCS → SP Studio) ────────────────────────

export type StrategyTier = "standard" | "nonprofit";

export interface WebhookPayload {
  wcsReport: WCSReport;
  clientName: string;       // e.g. "AbilitySC"
  clientSlug: string;       // e.g. "abilitysc" — becomes subdomain
  tier: StrategyTier;
  gatePassword?: string;    // if Hans pre-sets it; otherwise auto-generated
  gateSignedDate?: string;  // e.g. "May 9, 2026"
}

// ── Strategy Narrative (Pass 1 Claude output) ─────────────────

export interface DimensionNarrative {
  key: DimensionKey;
  headline: string;         // 1 punchy sentence
  body: string;             // 2-3 sentences of context
  recommendation: string;   // What we'd do about it
}

export interface RoadmapPhase {
  phase: number;            // 1, 2, or 3
  title: string;
  timeline: string;         // e.g. "Weeks 1–2"
  items: string[];          // bullet list of deliverables
  outcome: string;          // the "so you can..." result
}

export interface InvestmentOption {
  label: string;            // e.g. "Foundation", "Growth"
  price: string;            // e.g. "$4,500"
  includes: string[];
}

export interface GoogleAdGrantSection {
  eligibilityStatus: string;
  grantAmount: string;      // "$120,000/year"
  whyYouQualify: string[];
  whatWeWouldDo: string[];
  estimatedImpact: string;
}

export interface StrategyNarrative {
  clientName: string;
  clientSlug: string;
  tier: StrategyTier;
  heroHeadline: string;
  executiveSummary: string;           // 2-3 paragraphs, HTML-safe
  whatIsWorking: string[];            // 3-5 items from green_flags
  whatIsCostingYou: string[];         // 3-5 items from red_flags
  dimensionNarratives: DimensionNarrative[];
  strategyRoadmap: RoadmapPhase[];
  googleAdGrantSection?: GoogleAdGrantSection; // nonprofit only
  investmentSection: {
    headline: string;
    options: InvestmentOption[];
  };
  closingStatement: string;           // Personal note from Hans
}

// ── DB Records ────────────────────────────────────────────────

// Lifecycle: scan → manual promote → draft → generating → generated → review →
// published (visible at slug.sp.com) → approved (client said yes) → paid (Stripe
// completed) → project_created (CRM webhook fired) → delivered (work done).
export type StrategyStatus =
  | "draft"
  | "generating"
  | "generated"
  | "review"
  | "published"
  | "approved"
  | "paid"
  | "project_created"
  | "delivered";

export type StripePhase = "phase_1" | "phase_2";

export interface StrategyRecord {
  id: string;
  client_name: string;
  client_slug: string;
  tier: StrategyTier;
  wcs_report: WCSReport;
  narrative: StrategyNarrative | null;
  current_html: string | null;
  gate_password: string | null;
  gate_signed_date: string | null;
  status: StrategyStatus;
  published_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  project_created_at: string | null;
  delivered_at: string | null;
  stripe_session_id: string | null;
  stripe_phase: StripePhase | null;
  vercel_url: string | null;
  crm_project_id: string | null;
  source_scan_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditHistoryRecord {
  id: string;
  strategy_id: string;
  prompt: string;
  html_before: string;
  html_after: string;
  tokens_used: number | null;
  model: string | null;
  created_at: string;
}

// ── API Request/Response shapes ───────────────────────────────

export interface GenerateRequest {
  strategyId: string;
}

export interface TokenUsageShape {
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
}

export type GenerateResponse = {
  ok: true;
  strategyId: string;
  status: StrategyStatus;
  usage?: TokenUsageShape;
  costUSD?: number;
} | {
  ok: false;
  error: string;
};

export interface EditRequest {
  strategyId: string;
  prompt: string;
}

export type EditResponse = {
  ok: true;
  editId: string;
  usage: TokenUsageShape;
  costUSD: number;
  html: string;
} | {
  ok: false;
  error: string;
};

export interface PublishRequest {
  strategyId: string;
}

export type PublishResponse = {
  ok: true;
  url: string;
} | {
  ok: false;
  error: string;
  issues?: string[];
};

// ── UI view models ────────────────────────────────────────────

export interface StrategyCardVM {
  id: string;
  clientName: string;
  clientSlug: string;
  tier: StrategyTier;
  status: StrategyStatus;
  overallScore: number;
  overallGrade: Grade;
  domain: string;
  createdAt: string;
  publishedAt: string | null;
  vercelUrl: string | null;
}

export interface EditHistoryVM {
  id: string;
  prompt: string;          // truncated for display
  tokensUsed: number | null;
  createdAt: string;
}
