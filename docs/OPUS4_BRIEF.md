# SP Studio — Opus 4 Engineering Brief

**Author:** Hans Turner (hansturner.com)  
**Date:** May 2026  
**Scope:** Complete production system — not a prototype

---

## 0. What You're Building

A private, Hans-only web studio that:

1. Receives a validated `WCSReport` JSON from WebsiteCreditScore.com via a signed webhook
2. Uses Claude (Sonnet via the Anthropic API) to generate a complete strategy narrative on top of that data
3. Renders a polished, client-facing HTML strategy presentation — styled after the Saunders Wood Works presentation system (Minerva Modern + Degular, dark/light toggle, animated sections)
4. Deploys it to `[client-slug].strategypresentation.com` on Vercel automatically
5. Provides a local Lovable-style GUI (Next.js app, localhost only) where Hans can prompt Claude to edit any part of the rendered HTML, preview changes live in an iframe, and publish with one click
6. Requires human review (Hans) before anything goes public

This is **not** a SaaS product. It is Hans's internal toolchain. No customer ever logs in. The "product" that customers see is the deployed strategy URL.

---

## 1. Monorepo Structure

All of this lives in the `strategypresentation.com` GitHub repo. The WCS repo is untouched.

```
strategypresentation.com/
├── apps/
│   ├── studio/                  # Local Lovable-style editor (localhost:3001)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx            # Dashboard: list of generated strategies
│   │   │   │   ├── studio/[id]/page.tsx # The editor for a specific strategy
│   │   │   │   └── api/
│   │   │   │       ├── generate/route.ts    # Trigger generation from WCS payload
│   │   │   │       ├── edit/route.ts        # Hans prompts Claude to edit HTML
│   │   │   │       ├── preview/route.ts     # Returns current HTML for iframe
│   │   │   │       ├── publish/route.ts     # Triggers Vercel deploy
│   │   │   │       └── webhook/route.ts     # Receives signed payload from WCS
│   │   │   ├── components/
│   │   │   │   ├── EditorPane.tsx       # Prompt input + send button
│   │   │   │   ├── PreviewFrame.tsx     # iframe that hot-reloads
│   │   │   │   ├── StrategyCard.tsx     # Dashboard card per strategy
│   │   │   │   └── PublishPanel.tsx     # Review checklist + publish CTA
│   │   │   └── lib/
│   │   │       ├── types.ts             # StrategyRecord, EditRequest, etc.
│   │   │       ├── anthropic.ts         # Claude API wrapper
│   │   │       ├── db.ts                # Supabase client (strategies table)
│   │   │       ├── vercel-deploy.ts     # Vercel Deploy API wrapper
│   │   │       └── webhook-verify.ts    # HMAC signature verification
│   │   ├── package.json
│   │   └── .env.local.example
│   │
│   └── web/                     # The public strategypresentation.com homepage
│       └── ...                  # (separate concern, minimal)
│
├── templates/
│   ├── base-strategy.html       # The master HTML template (tokens replaced at gen time)
│   ├── nonprofit-strategy.html  # Nonprofit/Ad Grant variant
│   └── partials/
│       ├── gate.js              # Access gate (port of Saunders gate.js, generalized)
│       ├── shared-header.js     # Generalized header
│       └── score-ring.js        # Animated WCS score ring component
│
├── supabase/
│   └── schema.sql               # strategies table, edit_history table
│
├── scripts/
│   ├── deploy-strategy.ts       # CLI: manually deploy a strategy by ID
│   └── seed-dev.ts              # Seed local DB with a test WCS payload
│
├── docs/
│   ├── OPUS4_BRIEF.md           # This file
│   ├── VERCEL_SETUP.md          # Step-by-step Vercel config
│   ├── PASSWORDN_INTEGRATION.md # How PasswordN feeds secrets
│   └── TRIGGER_PROTOCOL.md      # WCS → SP webhook spec
│
├── package.json                 # Workspace root
├── turbo.json                   # Turborepo config
└── vercel.json                  # Root Vercel config (wildcard subdomain)
```

---

## 2. The Three Gaps (What Needs to Be Built)

### Gap 1: WCS → SP Trigger (Secure Inter-App Communication)

WCS needs to POST a signed payload to SP Studio's webhook endpoint after a scan completes. This must be tamper-proof and require zero third-party services.

**Protocol: HMAC-SHA256 signed webhook**

```
POST https://studio.strategypresentation.com/api/webhook
Headers:
  X-WCS-Signature: sha256=<hmac_hex>
  X-WCS-Timestamp: <unix_seconds>
  Content-Type: application/json
Body: { wcsReport: WCSReport, clientName: string, clientSlug: string, tier: "standard" | "nonprofit" }
```

**Signing (WCS side):**
```ts
const secret = process.env.SP_WEBHOOK_SECRET; // from PasswordN
const ts = Math.floor(Date.now() / 1000).toString();
const payload = ts + '.' + JSON.stringify(body);
const sig = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
```

**Verification (SP Studio side):**
```ts
// 1. Reject if timestamp is >5 minutes old (replay attack protection)
// 2. Recompute HMAC on ts + '.' + rawBody
// 3. timingSafeEqual comparison
// 4. Parse and validate against WCSReportSchema (Zod)
```

The shared secret (`SP_WEBHOOK_SECRET`) lives in PasswordN and is injected into both apps as an environment variable. It never appears in source code or GitHub.

**Local dev override:** Studio also accepts a `X-WCS-Dev-Bypass: true` header when `NODE_ENV === 'development'`, which skips HMAC but still validates the Zod schema.

---

### Gap 2: Strategy Generation (WCS JSON → HTML)

This is a two-pass Claude pipeline:

**Pass 1: Narrative generation**

Prompt Sonnet with the WCSReport and client context. Get back a structured JSON object with the strategy narrative:

```ts
interface StrategyNarrative {
  clientName: string;
  clientSlug: string;
  tier: "standard" | "nonprofit";
  heroHeadline: string;          // e.g. "Your trust score is holding you back."
  executiveSummary: string;      // 2-3 paragraphs, written as if from Hans personally
  dimensionNarratives: {         // One paragraph per WCS dimension
    key: DimensionKey;
    headline: string;
    body: string;
    recommendation: string;
  }[];
  whatIsWorking: string[];       // Pulled from green_flags, rephrased
  whatIsCostingYou: string[];    // Pulled from red_flags, with business impact framing
  strategyRoadmap: {             // 3 phases
    phase: number;
    title: string;
    timeline: string;
    items: string[];
    outcome: string;
  }[];
  // Nonprofit-only fields (populated when tier === "nonprofit")
  googleAdGrantSection?: {
    eligibilityStatus: string;
    grantAmount: string;
    whyYouQualify: string[];
    whatWeWouldDo: string[];
    estimatedImpact: string;
  };
  investmentSection: {
    headline: string;
    options: { label: string; price: string; includes: string[] }[];
  };
  closingStatement: string;      // Personal note from Hans
}
```

System prompt instructs Claude to:
- Write as if Hans Turner personally audited the site
- Never reveal that WCS or AI was involved — the quality speaks for itself
- Use the WCS data as evidence, not as the story itself
- For nonprofits: always include the Google Ad Grant section prominently
- Tone: confident, calm, analytical — like a McKinsey partner who also builds things

**Pass 2: HTML rendering**

Inject `StrategyNarrative` into the base HTML template using token replacement:
```
{{CLIENT_NAME}} → Matt Price / Saunders Wood Works LLC
{{HERO_HEADLINE}} → narrative.heroHeadline
{{OVERALL_SCORE}} → wcsReport.overall.score
{{OVERALL_GRADE}} → wcsReport.overall.grade
... etc
```

The final HTML file is a self-contained single file (no external JS deps other than Adobe Fonts CDN and Chart.js CDN, same as Saunders). It includes the gate.js access system, the shared header, and the WCS score visualization.

---

### Gap 3: Local Lovable-Style Editor

A Next.js app running at `localhost:3001`. Hans only. Never deployed.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ SP Studio                              [Dashboard]       │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│  EDITOR PANE     │  PREVIEW IFRAME                     │
│                  │  (renders current HTML)              │
│  Current file:   │                                      │
│  abilitysc       │                                      │
│                  │                                      │
│  [Prompt input]  │                                      │
│  Tell Claude     │                                      │
│  what to change  │                                      │
│                  │                                      │
│  [Send ↗]        │                                      │
│                  │                                      │
│  Edit history:   │                                      │
│  • 14:22 Fixed   │                                      │
│  • 14:18 Added   │                                      │
│                  │                                      │
│  [Publish →]     │                                      │
└──────────────────┴──────────────────────────────────────┘
```

**Edit flow:**
1. Hans types: "Make the hero headline larger and change the accent color to navy"
2. Studio POSTs to `/api/edit` with the prompt + current HTML
3. Claude receives: system prompt (HTML editor mode) + current HTML + Hans's instruction
4. Claude returns: the complete updated HTML (full file, not a diff)
5. Studio saves the new HTML to Supabase (`edit_history` table) and updates `current_html`
6. iframe src reloads (blob URL swap) — no page refresh
7. Edit appears in history panel with timestamp and prompt preview

**Publish flow:**
1. Hans clicks "Publish"
2. Pre-publish checklist shown:
   - ✓ Access gate password set?
   - ✓ Client name correct?
   - ✓ Score verified against WCS?
   - ✓ NDA signed date correct?
   - ✓ Investment section reviewed?
3. Hans confirms → POST to `/api/publish`
4. Publish endpoint:
   a. Fetches current HTML from Supabase
   b. Calls Vercel Deploy API to create/update deployment
   c. Sets `published_at` in DB
   d. Returns the live URL: `[slug].strategypresentation.com`

---

## 3. Database Schema (Supabase)

```sql
-- strategies: one row per client engagement
create table strategies (
  id            text primary key default gen_random_uuid()::text,
  client_name   text not null,
  client_slug   text not null unique,  -- becomes the subdomain
  tier          text not null check (tier in ('standard', 'nonprofit')),
  wcs_report    jsonb not null,         -- raw WCSReport
  narrative     jsonb,                  -- StrategyNarrative (after pass 1)
  current_html  text,                   -- current editable HTML
  gate_password text,                   -- access gate password for this client
  status        text not null default 'draft'
                check (status in ('draft', 'generated', 'review', 'published')),
  published_at  timestamptz,
  vercel_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- edit_history: every Claude edit for audit trail
create table edit_history (
  id             text primary key default gen_random_uuid()::text,
  strategy_id    text not null references strategies(id) on delete cascade,
  prompt         text not null,           -- what Hans asked for
  html_before    text not null,           -- snapshot before edit
  html_after     text not null,           -- result of edit
  tokens_used    integer,
  created_at     timestamptz default now()
);

-- RLS: lock everything down (service role key only, no public access)
alter table strategies enable row level security;
alter table edit_history enable row level security;

-- Indexes
create index on strategies(client_slug);
create index on strategies(status);
create index on edit_history(strategy_id);
```

---

## 4. Environment Variables

### Studio app (.env.local)
```
# Anthropic
ANTHROPIC_API_KEY=<from PasswordN>

# Supabase
SUPABASE_URL=<project url>
SUPABASE_SERVICE_ROLE_KEY=<service role key — never anon key>

# Vercel Deploy API
VERCEL_TOKEN=<deploy token>
VERCEL_TEAM_ID=<optional>
VERCEL_PROJECT_ID=<strategypresentation project id>

# Inter-app security
SP_WEBHOOK_SECRET=<32+ byte random hex — same value in WCS and SP>

# Local only gate
STUDIO_PASSPHRASE=<simple local password for studio app itself>

# Dev
NODE_ENV=development
```

### Vercel (Production — strategypresentation.com)
```
# Only the webhook receiver needs these in production:
SP_WEBHOOK_SECRET=<same as above>
SUPABASE_URL=<same>
SUPABASE_SERVICE_ROLE_KEY=<same>
ANTHROPIC_API_KEY=<same>
VERCEL_TOKEN=<same>
```

---

## 5. Vercel Configuration

See `docs/VERCEL_SETUP.md` for step-by-step. Summary:

- **Project:** `strategypresentation` on Vercel
- **Framework:** Next.js (App Router)
- **Root directory:** `apps/studio`
- **Wildcard domain:** `*.strategypresentation.com` → points to published HTML files
- **Production branch:** `main`
- **Preview branch:** `develop` → `develop.strategypresentation.com`
- **Deployment method for client strategies:** Vercel Deploy API (not Git push) — each client strategy is deployed as a file upload via the Files API

**Subdomain routing strategy:**
Each `[slug].strategypresentation.com` is not a Next.js route — it's a separately deployed static HTML file via the Vercel Deploy API. The studio app handles the orchestration. This keeps client strategies isolated and not dependent on the Next.js runtime.

---

## 6. PasswordN Integration

PasswordN.com is Hans's credential vault. For this system, PasswordN should expose:

```
GET /api/secrets/:key
Authorization: Bearer <passwordn_api_key>
```

Returns: `{ key: string, value: string, rotated_at: string }`

The studio app fetches secrets at startup (or on-demand) rather than baking them into `.env.local` long-term. This means rotating `SP_WEBHOOK_SECRET` in PasswordN propagates to both apps without a redeploy.

For now, secrets can be stored in `.env.local` files (which are gitignored) and PasswordN integration can be wired in Phase 2.

---

## 7. The HTML Template System

The base template (`templates/base-strategy.html`) is a parameterized version of the Saunders strategy HTML. It:

- Uses the same design tokens (Minerva Modern + Degular via Adobe Fonts `syk8hlp`)
- Has the same gate.js access system (generalized — takes `{{GATE_PASSWORD}}` and `{{CLIENT_NAME}}` tokens)
- Has the same light/dark toggle
- Has 8 sections (all token-driven):
  1. Hero — score reveal with animated ring
  2. Executive Summary
  3. What's Working (green flags)
  4. What's Costing You (red flags + dimension breakdown)
  5. Technical Deep Dive (SiteObservation data — PageSpeed, schema, etc.)
  6. Strategy Roadmap (3 phases)
  7. [NONPROFIT ONLY] Google Ad Grant Opportunity
  8. Investment Options
  9. How to Work Together (closing + Hans's contact)

The nonprofit template swaps Section 7 in prominently and reframes the investment section around grant ROI.

---

## 8. The Claude System Prompts

### Generation prompt (Pass 1 — Narrative)
```
You are a senior digital strategy consultant writing a confidential client presentation on behalf of Hans Turner (hansturner.com), a web strategist based in Mount Pleasant, SC with 13 years of experience.

You have been given a WCSReport — a structured trust and quality analysis of the client's website. Your job is to transform this data into a compelling, evidence-based strategy narrative.

Rules:
- Write as if Hans personally audited the site. First person singular where appropriate.
- Never mention WCS, AI, or automated analysis.
- Never use the word "deliverable" — say "what we build."
- For nonprofits: the Google Ad Grant section is the most important section. Frame the $120K/year grant as the headline opportunity.
- Tone: confident, calm, and specific. Like a McKinsey partner who also ships code.
- Use the WCS dimension scores as evidence for claims, but don't quote them mechanically.
- The strategy should feel custom-written for this exact organization — because it is.

Return ONLY valid JSON matching the StrategyNarrative schema. No markdown, no preamble.
```

### Edit prompt (Lovable mode)
```
You are an expert HTML/CSS developer editing a client-facing strategy presentation for Hans Turner.

The current HTML file is provided below. Hans has given you an instruction. Apply it precisely and return the COMPLETE updated HTML file.

Rules:
- Return ONLY the complete HTML file. No explanation, no markdown fences, no preamble.
- Preserve all existing functionality (gate.js, shared-header.js, theme toggle, Chart.js charts).
- Match the existing design language exactly (Minerva Modern display font, Degular body font, gold accent #C9A44C).
- Do not add new external dependencies.
- If the instruction is ambiguous, make the most conservative interpretation.
- HTML must be valid and complete — from <!DOCTYPE> to </html>.

Hans's instruction: {{HANS_INSTRUCTION}}
```

---

## 9. Build Order for Claude Code

Implement in this exact order:

1. `supabase/schema.sql` — DB first
2. `apps/studio/src/lib/types.ts` — types before anything that uses them
3. `apps/studio/src/lib/db.ts` — DB client
4. `apps/studio/src/lib/anthropic.ts` — Claude wrapper
5. `apps/studio/src/lib/webhook-verify.ts` — HMAC verification
6. `apps/studio/src/lib/vercel-deploy.ts` — Vercel Deploy API
7. `apps/studio/src/app/api/webhook/route.ts` — inbound trigger from WCS
8. `apps/studio/src/app/api/generate/route.ts` — narrative + HTML generation
9. `apps/studio/src/app/api/edit/route.ts` — Lovable edit endpoint
10. `apps/studio/src/app/api/publish/route.ts` — Vercel deploy trigger
11. `templates/base-strategy.html` — master template
12. `templates/nonprofit-strategy.html` — nonprofit variant
13. `apps/studio/src/components/*` — UI components
14. `apps/studio/src/app/page.tsx` — dashboard
15. `apps/studio/src/app/studio/[id]/page.tsx` — editor page
16. `scripts/` — dev utilities

---

## 10. What NOT to Build

- No auth system (studio is localhost only, protected by `STUDIO_PASSPHRASE` env var check in middleware)
- No multi-user support
- No customer-facing login
- No SaaS billing
- No public API
- No mobile layout for the studio app (Hans uses it on desktop)
- No WCS code changes (WCS is a separate repo and is complete)
