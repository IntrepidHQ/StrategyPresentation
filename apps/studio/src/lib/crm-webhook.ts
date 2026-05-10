// Stub for the future CRM at crm.hansturner.com. The CRM is out of scope for
// this build; this file defines the wire contract and fires the webhooks. If
// the CRM endpoint is unreachable, we log and persist failure on the strategy
// row — Hans can replay later. See docs/CRM_TRIGGER.md for the spec.

import type { StrategyRecord } from "./types";

const CRM_BASE_URL =
  process.env.CRM_BASE_URL ?? "https://crm.hansturner.com";
const CRM_WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET;

interface CrmFireResult {
  ok: boolean;
  remoteId?: string;
  error?: string;
}

async function fireCrmWebhook(
  path: string,
  body: unknown,
): Promise<CrmFireResult> {
  if (!CRM_WEBHOOK_SECRET) {
    console.warn("[crm-webhook] CRM_WEBHOOK_SECRET not set — skipping fire");
    return { ok: false, error: "CRM_WEBHOOK_SECRET not configured" };
  }

  try {
    const res = await fetch(`${CRM_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": CRM_WEBHOOK_SECRET,
        "X-Webhook-Source": "sp-studio",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, remoteId: data.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// Fired on `paid` → creates a delivery project in the CRM with default tasks.
export async function fireProjectCreate(
  strategy: StrategyRecord,
): Promise<CrmFireResult> {
  return fireCrmWebhook("/api/projects", {
    strategyId: strategy.id,
    clientName: strategy.client_name,
    clientSlug: strategy.client_slug,
    tier: strategy.tier,
    phase: strategy.stripe_phase ?? "phase_1",
    domain: strategy.wcs_report.domain,
    overallScore: strategy.wcs_report.overall.score,
    strategyUrl:
      strategy.vercel_url ?? `https://${strategy.client_slug}.strategypresentation.com`,
    suggestedTasks: defaultTasksFor(strategy.stripe_phase ?? "phase_1"),
    paidAt: strategy.paid_at,
  });
}

// Fired on `generated` (or `review`) — pings Hans's notifications channel
// in the CRM so he knows a draft is ready, even when away from the studio.
export async function fireDraftReadyNotification(
  strategy: StrategyRecord,
): Promise<CrmFireResult> {
  return fireCrmWebhook("/api/notifications", {
    type: "strategy_draft_ready",
    strategyId: strategy.id,
    clientName: strategy.client_name,
    clientSlug: strategy.client_slug,
    tier: strategy.tier,
    overallScore: strategy.wcs_report.overall.score,
    studioUrl: `http://localhost:3001/studio/${strategy.id}`,
  });
}

function defaultTasksFor(phase: "phase_1" | "phase_2"): Array<{
  title: string;
  description: string;
  assignee: "agent" | "human" | "either";
}> {
  if (phase === "phase_1") {
    return [
      {
        title: "Kick-off call with client",
        description: "Confirm scope, brand, content sources, decision-maker access.",
        assignee: "human",
      },
      {
        title: "Audit content + assets supplied by client",
        description: "Cross-check what's promised vs. what was delivered in intake.",
        assignee: "either",
      },
      {
        title: "Build foundation site (per strategy doc)",
        description: "Implement the structure, copy, and tech recommendations from the strategy.",
        assignee: "either",
      },
      {
        title: "QA + fact-check before launch",
        description: "Run a final pre-launch review against the WCS scan baseline.",
        assignee: "human",
      },
      {
        title: "Launch to client domain",
        description: "DNS cutover + post-launch monitoring.",
        assignee: "human",
      },
    ];
  }
  // Phase 2
  return [
    {
      title: "Phase-2 scope alignment with client",
      description: "Reconfirm priorities for the follow-on engagement.",
      assignee: "human",
    },
    {
      title: "Implement phase-2 work items",
      description: "Per the original strategy roadmap.",
      assignee: "either",
    },
    {
      title: "Re-run WCS scan and benchmark improvement",
      description: "Confirm the strategy moved the score in the expected direction.",
      assignee: "either",
    },
  ];
}
