import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getStrategy,
  getStrategyByStripeSession,
  markPaid,
  markProjectCreated,
} from "@/lib/db";
import { fireProjectCreate } from "@/lib/crm-webhook";
import { getStripe, isStripePhase } from "@/lib/stripe";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Invalid Stripe signature", detail }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const existing = await getStrategyByStripeSession(session.id);
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const strategyId =
    session.metadata?.strategy_id ??
    session.client_reference_id ??
    null;
  const phase = isStripePhase(session.metadata?.phase) ? session.metadata.phase : "phase_1";

  if (!strategyId) {
    return NextResponse.json({ error: "Missing strategy metadata" }, { status: 400 });
  }

  const strategy = await getStrategy(strategyId);
  if (!strategy) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }
  if (strategy.status !== "approved") {
    return NextResponse.json({ ok: true, ignored: `status:${strategy.status}` });
  }

  const paid = await markPaid(strategy.id, session.id, phase);
  const crm = await fireProjectCreate(paid);
  if (crm.ok && crm.remoteId) {
    await markProjectCreated(paid.id, crm.remoteId);
  } else if (!crm.ok) {
    console.warn(`[checkout-webhook] CRM project create failed: ${crm.error}`);
  }

  return NextResponse.json({ ok: true });
}
