// ============================================================
//  SP Studio — Inbound Webhook from WCS
//  apps/studio/src/app/api/webhook/route.ts
//
//  WCS POSTs here after a scan completes.
//  Verifies HMAC signature, validates payload, creates DB record.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyWebhook } from "@/lib/webhook-verify";
import { createStrategy, getStrategyBySlug } from "@/lib/db";
import type { WebhookPayload } from "@/lib/types";

// Minimal Zod validation for the webhook body
const WebhookBodySchema = z.object({
  wcsReport: z.object({
    domain: z.string(),
    company_name: z.string().optional(),
    scanned_at: z.string(),
    overall: z.object({
      score: z.number(),
      grade: z.string(),
      headline: z.string(),
      one_liner: z.string(),
    }),
    dimensions: z.array(z.any()).length(10),
    red_flags: z.array(z.any()),
    green_flags: z.array(z.any()),
    sources: z.array(z.any()).min(12),
    summary: z.string(),
  }),
  clientName: z.string().min(1),
  clientSlug: z
    .string()
    .min(1)
    .max(63)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens"),
  tier: z.enum(["standard", "nonprofit"]),
  gatePassword: z.string().optional(),
  gateSignedDate: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Read raw body for HMAC ────────────────────────────────
  const rawBody = await req.text();

  // ── Verify signature ──────────────────────────────────────
  const result = verifyWebhook(
    rawBody,
    req.headers.get("x-wcs-signature"),
    req.headers.get("x-wcs-timestamp"),
    req.headers.get("x-wcs-dev-bypass")
  );

  if (!result.ok) {
    console.warn(`[webhook] Rejected: ${result.reason}`);
    return NextResponse.json({ error: result.reason }, { status: result.status });
  }

  // ── Parse and validate body ───────────────────────────────
  let body: WebhookPayload;
  try {
    const parsed = JSON.parse(rawBody);
    const validated = WebhookBodySchema.parse(parsed);
    body = validated as WebhookPayload;
  } catch (e) {
    console.warn(`[webhook] Invalid payload: ${e}`);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // ── Idempotency: check if slug already exists ─────────────
  const existing = await getStrategyBySlug(body.clientSlug);
  if (existing) {
    // Return the existing ID — don't create a duplicate
    console.log(`[webhook] Strategy already exists for slug: ${body.clientSlug} (id: ${existing.id})`);
    return NextResponse.json({
      ok: true,
      strategyId: existing.id,
      status: existing.status,
      new: false,
    });
  }

  // ── Create strategy record ────────────────────────────────
  try {
    const strategy = await createStrategy({
      clientName: body.clientName,
      clientSlug: body.clientSlug,
      tier: body.tier,
      wcsReport: body.wcsReport,
      gatePassword: body.gatePassword,
      gateSignedDate: body.gateSignedDate,
    });

    console.log(`[webhook] Created strategy ${strategy.id} for ${body.clientSlug}`);

    return NextResponse.json({
      ok: true,
      strategyId: strategy.id,
      status: strategy.status,
      new: true,
    });
  } catch (e) {
    console.error(`[webhook] DB error: ${e}`);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
