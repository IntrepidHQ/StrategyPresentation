import type { StrategyStatus } from "./types";

const ALLOWED: Record<StrategyStatus, StrategyStatus[]> = {
  draft: ["generating"],
  generating: ["generated", "draft"],
  generated: ["review", "generating"],
  review: ["review", "published", "generating"],
  published: ["review", "approved"],
  approved: ["paid"],
  paid: ["project_created"],
  project_created: ["delivered"],
  delivered: [],
};

export function canTransition(from: StrategyStatus, to: StrategyStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: StrategyStatus, to: StrategyStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal status transition: ${from} → ${to}`);
  }
}

export const TERMINAL: StrategyStatus[] = ["delivered"];

export function isLive(status: StrategyStatus): boolean {
  // Statuses where the subdomain page should serve the strategy
  return (
    status === "published" ||
    status === "approved" ||
    status === "paid" ||
    status === "project_created" ||
    status === "delivered"
  );
}
