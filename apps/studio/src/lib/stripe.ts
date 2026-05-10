import "server-only";
import Stripe from "stripe";
import type { StripePhase } from "./types";

export const STRIPE_PHASES: Record<StripePhase, {
  label: string;
  amountCents: number;
  description: string;
}> = {
  phase_1: {
    label: "Phase 1 Strategy Build",
    amountCents: 600_000,
    description: "Phase 1 implementation kickoff from the approved strategy presentation.",
  },
  phase_2: {
    label: "Phase 2 Follow-On Build",
    amountCents: 450_000,
    description: "Phase 2 follow-on implementation after Phase 1 foundation is in place.",
  },
};

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY or STRIPE_SECRET");
  }
  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
  });
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STUDIO_URL ??
    process.env.STUDIO_URL ??
    "https://studio.strategypresentation.com"
  ).replace(/\/$/, "");
}

export function isStripePhase(value: unknown): value is StripePhase {
  return value === "phase_1" || value === "phase_2";
}
