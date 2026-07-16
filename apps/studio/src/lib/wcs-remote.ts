// ============================================================
//  SP Studio — WCS over HTTP (the seamless bridge)
//  apps/studio/src/lib/wcs-remote.ts
//
//  Talks to WebsiteCreditScore's public API so SP always sees
//  WCS's REAL, current data — every scan, wherever WCS stores
//  it — instead of a copied database that can drift. This is
//  what makes the flow seamless: SP no longer needs WCS's DB
//  credentials, and a scan run anywhere shows up here.
//
//  Endpoints (WCS): GET /api/scan/{id}, GET /api/scan/latest,
//  POST /api/scan/start. Base URL: WCS_API_BASE (default the
//  production site). Every call is fail-soft: any error → null,
//  and the caller degrades to the shared-DB read / sample deck.
// ============================================================

import type { ScanHit } from "./wcs-scans";
import type { WCSReport } from "./types";

const BASE = (process.env.WCS_API_BASE ?? "https://www.websitecreditscore.com").replace(/\/$/, "");

async function j<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Fetch a finished scan's report by id from WCS. */
export async function remoteScanById(scanId: string): Promise<ScanHit | null> {
  if (!/^[0-9a-f-]{36}$/i.test(scanId)) return null;
  const data = await j<{ id: string; domain: string; status: string; result: WCSReport | null; completedAt: string | null }>(
    `${BASE}/api/scan/${scanId}`,
  );
  if (!data || data.status !== "done" || !data.result) return null;
  return { scanId: data.id, domain: data.domain, report: data.result, completedAt: data.completedAt };
}

/** Newest completed scan for a domain, resolved to a full report. */
export async function remoteLatestByDomain(rawDomain: string): Promise<ScanHit | null> {
  const domain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  if (!domain || !domain.includes(".")) return null;
  const latest = await j<{ found: boolean; id?: string }>(
    `${BASE}/api/scan/latest?domain=${encodeURIComponent(domain)}`,
  );
  if (!latest?.found || !latest.id) return null;
  return remoteScanById(latest.id);
}

/** Kick off a fresh scan on WCS. Returns the new scan id (or null). */
export async function remoteStartScan(rawDomain: string): Promise<string | null> {
  const domain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  if (!domain || !domain.includes(".")) return null;
  const data = await j<{ scanId?: string }>(`${BASE}/api/scan/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ domain, tier: "quick", mode: "standard" }),
  });
  return data?.scanId ?? null;
}

/** Raw status probe for polling. */
export async function remoteScanStatus(scanId: string): Promise<{ status: string; scanId: string } | null> {
  const data = await j<{ id: string; status: string }>(`${BASE}/api/scan/${scanId}`);
  return data ? { status: data.status, scanId: data.id } : null;
}
