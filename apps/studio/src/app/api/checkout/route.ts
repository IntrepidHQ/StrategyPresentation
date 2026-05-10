import { NextRequest, NextResponse } from "next/server";
import { getStrategy } from "@/lib/db";
import { getAppUrl, getStripe, isStripePhase, STRIPE_PHASES } from "@/lib/stripe";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("x-studio-passphrase");
  if (auth !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    strategyId?: unknown;
    phase?: unknown;
  };
  const strategyId = typeof body.strategyId === "string" ? body.strategyId : null;
  const phase = isStripePhase(body.phase) ? body.phase : "phase_1";

  if (!strategyId) {
    return NextResponse.json({ error: "strategyId required" }, { status: 400 });
  }

  const strategy = await getStrategy(strategyId);
  if (!strategy) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }
  if (strategy.status !== "approved" && strategy.status !== "paid") {
    return NextResponse.json(
      { error: `Cannot create checkout from status ${strategy.status}; approve first.` },
      { status: 409 },
    );
  }

  if (strategy.status === "paid") {
    return NextResponse.json({ error: "Strategy is already paid" }, { status: 409 });
  }

  const item = STRIPE_PHASES[phase];
  const appUrl = getAppUrl();
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${appUrl}/studio/${strategy.id}?checkout=success`,
    cancel_url: `${appUrl}/studio/${strategy.id}?checkout=cancelled`,
    client_reference_id: strategy.id,
    metadata: {
      strategy_id: strategy.id,
      client_slug: strategy.client_slug,
      phase,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: item.amountCents,
          product_data: {
            name: `${strategy.client_name} — ${item.label}`,
            description: item.description,
          },
        },
      },
    ],
  });

  return NextResponse.json({ ok: true, url: session.url });
}
