# Trigger Protocol
## WCS → SP Studio Inter-App Communication

---

## Philosophy

The two apps (WebsiteCreditScore.com and StrategyPresentation.com) need to communicate securely without:
- Exposing API keys in URLs
- Relying on third-party webhook services (Zapier, Make, etc.)
- Requiring shared infrastructure or a shared codebase
- Being susceptible to replay attacks or payload tampering

The solution is a **HMAC-SHA256 signed webhook** — the same protocol used by Stripe, GitHub, and Shopify for their own webhooks. Simple, battle-tested, requires nothing but a shared secret.

---

## The Shared Secret

One 64-character hex string lives in **PasswordN.com** and is injected into both apps as `SP_WEBHOOK_SECRET`. Neither app hardcodes it. It can be rotated in PasswordN and pushed to both apps without a redeploy.

**Generate one:**
```bash
openssl rand -hex 32
# → e.g. a8f3c2d1b9e7f4a2c6d8e1f3a5b7c9d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4
```

---

## Protocol Specification

### Request (WCS → SP)

```
POST https://studio.strategypresentation.com/api/webhook
Content-Type: application/json
X-WCS-Signature: sha256=<hmac_hex>
X-WCS-Timestamp: <unix_seconds_as_string>
```

**Body:**
```json
{
  "wcsReport": { /* complete WCSReport object */ },
  "clientName": "AbilitySC",
  "clientSlug": "abilitysc",
  "tier": "nonprofit",
  "gatePassword": "AbilitySC2026",
  "gateSignedDate": "May 9, 2026"
}
```

### Signing Algorithm

```
signed_payload = timestamp + "." + json_body_string
signature = "sha256=" + HMAC_SHA256(SP_WEBHOOK_SECRET, signed_payload).hex()
```

**Important:** The JSON body must be stringified **before** signing. Do not pretty-print it — the signature is over the exact bytes that will be sent.

### Verification Algorithm (SP side)

1. Extract `X-WCS-Timestamp` and `X-WCS-Signature` headers
2. Reject if timestamp is more than 300 seconds old or more than 60 seconds in the future
3. Recompute: `expected = "sha256=" + HMAC_SHA256(SP_WEBHOOK_SECRET, timestamp + "." + raw_body).hex()`
4. Compare using `timingSafeEqual()` — never use `===` (timing attack vulnerability)
5. If mismatch: return 401

---

## WCS Implementation

Add this file to the WCS codebase:

**`websitecreditscore.com/src/lib/sp-webhook.ts`**

```typescript
import { createHmac } from "crypto";

interface SPWebhookPayload {
  wcsReport: WCSReport;         // import from your existing types
  clientName: string;
  clientSlug: string;
  tier: "standard" | "nonprofit";
  gatePassword?: string;
  gateSignedDate?: string;
}

export async function triggerStrategyPresentation(
  payload: SPWebhookPayload
): Promise<{ ok: boolean; strategyId?: string; error?: string }> {
  const secret = process.env.SP_WEBHOOK_SECRET;
  const url    = process.env.SP_WEBHOOK_URL ?? "https://studio.strategypresentation.com/api/webhook";

  if (!secret) {
    console.error("[sp-webhook] SP_WEBHOOK_SECRET not set — skipping");
    return { ok: false, error: "SP_WEBHOOK_SECRET not configured" };
  }

  const body = JSON.stringify(payload);
  const ts   = Math.floor(Date.now() / 1000).toString();
  const sig  = "sha256=" + createHmac("sha256", secret)
                             .update(`${ts}.${body}`)
                             .digest("hex");

  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "X-WCS-Signature":   sig,
        "X-WCS-Timestamp":   ts,
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[sp-webhook] Failed: ${res.status} ${text}`);
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }

    const data = await res.json();
    return { ok: true, strategyId: data.strategyId };
  } catch (e) {
    console.error(`[sp-webhook] Network error: ${e}`);
    return { ok: false, error: String(e) };
  }
}
```

**Where to call it in WCS:**

After a scan completes and the WCSReport is written to the database, call `triggerStrategyPresentation()` asynchronously. Don't await it in the critical path — it shouldn't block the scan response.

```typescript
// In your scan completion handler:
import { triggerStrategyPresentation } from "@/lib/sp-webhook";

// After scan is saved:
void triggerStrategyPresentation({
  wcsReport: completedReport,
  clientName: lead.companyName ?? domain,
  clientSlug: domain.replace(/\./g, "-").replace(/[^a-z0-9-]/g, ""),
  tier: "standard", // or "nonprofit" based on lead classification
}).catch(console.error);
```

---

## WCS Environment Variables to Add

```bash
# In websitecreditscore.com/.env.local (and Vercel env vars):
SP_WEBHOOK_SECRET=<same 64-char hex as in SP>
SP_WEBHOOK_URL=https://studio.strategypresentation.com/api/webhook
```

---

## PasswordN Integration (Phase 2)

Right now both apps read `SP_WEBHOOK_SECRET` from their own `.env` files. When PasswordN.com has a secrets API, the flow becomes:

```
1. Apps call PasswordN GET /api/secrets/SP_WEBHOOK_SECRET on startup
2. PasswordN returns the current value
3. Secret rotation in PasswordN propagates to both apps on next restart
```

This means you can rotate the secret without touching either codebase or Vercel's env var UI.

---

## Security Properties

| Threat | Mitigation |
|--------|-----------|
| Payload tampering | HMAC signature over entire body |
| Replay attacks | 5-minute timestamp window |
| Timing attacks | `timingSafeEqual()` for comparison |
| MITM | HTTPS enforced by Vercel |
| Unauthorized senders | Only holders of `SP_WEBHOOK_SECRET` can sign |
| Schema injection | Zod validation on SP side regardless of signature |

---

## Dev Bypass (local testing only)

When `NODE_ENV === "development"`, SP Studio accepts:
```
X-WCS-Dev-Bypass: true
```
This skips HMAC verification but still runs Zod validation. **Never allowed in production.**

Use the "New Strategy" modal in the studio dashboard (which sends this header automatically) to test without a real WCS scan.
