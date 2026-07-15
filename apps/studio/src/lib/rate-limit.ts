// ============================================================
//  SP Studio — In-memory rate limiter
//  apps/studio/src/lib/rate-limit.ts
//
//  Fixed-window per-key counter. In-memory is acceptable for the
//  demo endpoints: a serverless instance restart resets counters,
//  which fails open — the hard cost controls live in WCS itself
//  (Phase 5 adds a shared store if abuse shows up).
// ============================================================

import type { NextRequest } from "next/server";

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const win = windows.get(key);
  if (!win || now >= win.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  win.count += 1;
  if (windows.size > 10_000) {
    // Shed expired windows so the map cannot grow unbounded.
    for (const [k, v] of windows) {
      if (now >= v.resetAt) windows.delete(k);
    }
  }
  return win.count <= max;
}

export function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : null) ?? req.headers.get("x-real-ip") ?? "unknown";
}
