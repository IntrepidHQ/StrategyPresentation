# CRM Trigger Contract
## SP Studio → crm.hansturner.com (Hans-Turner-Portfolio repo)

---

## Status

The CRM is **out of scope** for the SP Studio build. This document defines the
wire contract that SP fires today (best-effort, non-blocking) so that when the
CRM is built it can implement these endpoints and existing strategy webhooks
will start landing without a redeploy.

SP-side stub: `apps/studio/src/lib/crm-webhook.ts`. If the CRM is unreachable,
the call logs and returns `{ ok: false }`; the SP strategy row is unaffected.

---

## Auth

All requests carry:

```
X-Webhook-Secret: <CRM_WEBHOOK_SECRET>
X-Webhook-Source: sp-studio
Content-Type:    application/json
```

`CRM_WEBHOOK_SECRET` is a 32-byte hex string shared between SP and CRM. Set in
both apps' Vercel env vars and rotated via PasswordN when wired up.

The CRM endpoints should:

1. Reject if `X-Webhook-Secret` is missing or doesn't match.
2. Reject if `X-Webhook-Source` is not in an allowlist (`sp-studio` for now;
   later, `wcs` for direct WCS→CRM lead-import flows).
3. Use timing-safe comparison (`crypto.timingSafeEqual`).

---

## Endpoint 1: Project Create — fired on `paid`

**When:** Stripe `checkout.session.completed` event for an SP strategy with
status `approved`. SP transitions the strategy to `paid` and fires this
webhook. On a 2xx response, SP transitions to `project_created` and stores
the returned `id` as `crm_project_id`.

```
POST https://crm.hansturner.com/api/projects
```

Body:

```ts
{
  strategyId:   string;        // SP strategy UUID
  clientName:   string;        // "AbilitySC"
  clientSlug:   string;        // "abilitysc" — also the strategy subdomain slug
  tier:         "standard" | "nonprofit";
  phase:        "phase_1" | "phase_2";
  domain:       string;        // client's website domain
  overallScore: number;        // WCS overall score
  strategyUrl:  string;        // https://abilitysc.strategypresentation.com
  paidAt:       string;        // ISO timestamp
  suggestedTasks: Array<{
    title:       string;
    description: string;
    assignee:    "agent" | "human" | "either";
  }>;
}
```

Expected response (2xx):

```ts
{ id: string }   // CRM project ID, persisted on the SP strategy row
```

The CRM should:
- Create a project record
- Seed it with the `suggestedTasks` (CRM may rename/reassign them at any time)
- Surface it in Hans's project board for human assignment

Failures (4xx/5xx, network) are logged in SP and the strategy stays at `paid`.
Hans can manually retry from the studio UI (TODO in a later turn).

---

## Endpoint 2: Notification — fired on `review` (draft ready)

**When:** SP studio finishes generating a strategy and transitions it to
`review`. Fires this webhook so Hans gets a chat-bar notification in the CRM
even when he's not in the studio.

```
POST https://crm.hansturner.com/api/notifications
```

Body:

```ts
{
  type:        "strategy_draft_ready";
  strategyId:  string;
  clientName:  string;
  clientSlug:  string;
  tier:        "standard" | "nonprofit";
  overallScore: number;
  studioUrl:   string;   // http://localhost:3001/studio/<id> (Hans's local editor)
}
```

Response: any 2xx, body ignored.

The CRM should:
- Persist the notification
- Surface it in the chat-bar agent's queue (so the agent can mention it
  proactively when Hans next opens chat)
- Optionally trigger a push/email/SMS depending on Hans's preference settings

---

## Endpoint 3 (future): Lead Import from WCS

Not implemented in this build. Reserved name:

```
POST https://crm.hansturner.com/api/leads
```

When WCS scans a domain that matches Hans's company-fit filters
(mid-size/large, not Fortune 500, target verticals), WCS would fire this. The
CRM agent then nurtures the lead, possibly suggesting "promote to strategy"
when conditions are right.

For now: Hans manually promotes from the WCS `/scans` admin view.

---

## Status state machine (SP side)

```
draft → generating → generated → review → published → approved → paid
                                                                    ↓
                                                          project_created → delivered
```

| Transition | Fired by | CRM webhook |
|---|---|---|
| `* → review` (after generation) | studio /api/generate | `notifications` (draft ready) |
| `review → published` | studio /api/publish | — |
| `published → approved` | client clicks Approve on their subdomain | — |
| `approved → paid` | Stripe `checkout.session.completed` | — |
| `paid → project_created` | SP /api/checkout-webhook | `projects` (project create) |
| `project_created → delivered` | manual or CRM webhook back to SP | — |

---

## CRM-side reference implementation (sketch, for the future build)

```ts
// crm.hansturner.com — apps/crm/src/app/api/projects/route.ts
import { timingSafeEqual } from "crypto";

export async function POST(req: Request) {
  const sig = req.headers.get("x-webhook-secret") ?? "";
  const expected = process.env.CRM_WEBHOOK_SECRET ?? "";
  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  // ... validate with Zod, create project, seed tasks ...
  return Response.json({ id: project.id });
}
```
