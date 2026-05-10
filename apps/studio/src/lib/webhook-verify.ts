// ============================================================
//  SP Studio — Webhook Signature Verification
//  apps/studio/src/lib/webhook-verify.ts
//
//  Protocol: HMAC-SHA256 signed payloads from WCS.
//  Replay protection: reject payloads older than 5 minutes.
//  Dev bypass: X-WCS-Dev-Bypass header (NODE_ENV=development only)
// ============================================================

import { createHmac, timingSafeEqual } from "crypto";

const MAX_AGE_SECONDS = 5 * 60; // 5 minutes

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string; status: 400 | 401 | 403 };

/**
 * Verify an inbound webhook from WCS.
 *
 * @param rawBody   - The raw request body as a string (not parsed JSON)
 * @param signature - Value of X-WCS-Signature header (e.g. "sha256=abc123...")
 * @param timestamp - Value of X-WCS-Timestamp header (unix seconds as string)
 * @param devBypass - Value of X-WCS-Dev-Bypass header
 */
export function verifyWebhook(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  devBypass: string | null
): VerifyResult {
  // ── Dev bypass (never allow in production) ────────────────
  if (devBypass === "true") {
    if (process.env.NODE_ENV !== "development") {
      return { ok: false, reason: "Dev bypass not allowed in production", status: 403 };
    }
    return { ok: true };
  }

  // ── Required headers ──────────────────────────────────────
  if (!signature || !timestamp) {
    return {
      ok: false,
      reason: "Missing X-WCS-Signature or X-WCS-Timestamp",
      status: 400,
    };
  }

  // ── Replay attack protection ──────────────────────────────
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) {
    return { ok: false, reason: "Invalid timestamp", status: 400 };
  }
  const ageSeconds = Math.floor(Date.now() / 1000) - ts;
  if (ageSeconds > MAX_AGE_SECONDS || ageSeconds < -60) {
    return {
      ok: false,
      reason: `Timestamp out of window (age: ${ageSeconds}s)`,
      status: 401,
    };
  }

  // ── HMAC verification ─────────────────────────────────────
  const secret = process.env.SP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook-verify] SP_WEBHOOK_SECRET is not set");
    return { ok: false, reason: "Server misconfiguration", status: 400 };
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedHex = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
  const expected = `sha256=${expectedHex}`;

  // Constant-time comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expected, "utf8");

    if (sigBuf.length !== expBuf.length) {
      return { ok: false, reason: "Invalid signature", status: 401 };
    }

    if (!timingSafeEqual(sigBuf, expBuf)) {
      return { ok: false, reason: "Invalid signature", status: 401 };
    }
  } catch {
    return { ok: false, reason: "Signature comparison failed", status: 401 };
  }

  return { ok: true };
}

// ============================================================
//  WCS-side signing utility (copy this into WCS when wiring up)
//  Place in: websitecreditscore.com/src/lib/sp-webhook.ts
// ============================================================

/*
import { createHmac } from "crypto";

export async function signAndPostToSP(payload: WebhookPayload): Promise<void> {
  const secret = process.env.SP_WEBHOOK_SECRET;
  if (!secret) throw new Error("SP_WEBHOOK_SECRET not set");

  const url = process.env.SP_WEBHOOK_URL ?? "https://studio.strategypresentation.com/api/webhook";
  const body = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000).toString();
  const signedPayload = `${ts}.${body}`;
  const sig = "sha256=" + createHmac("sha256", secret).update(signedPayload).digest("hex");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WCS-Signature": sig,
      "X-WCS-Timestamp": ts,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SP webhook failed: ${res.status} ${text}`);
  }
}
*/
