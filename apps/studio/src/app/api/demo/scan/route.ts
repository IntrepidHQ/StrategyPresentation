// ============================================================
//  SP Demo — Run a scan without leaving SP
//  apps/studio/src/app/api/demo/scan/route.ts   (public)
//
//  POST { domain } → starts a WebsiteCreditScore scan on the
//  user's behalf and drives it to completion server-side, so
//  the visitor never has to bounce to websitecreditscore.com.
//  Returns { scanId, status }. The deck then renders from that
//  scan id via /api/demo/deck?source=scan&id=…
//
//  Fail-soft: if WCS can't start or finish the scan, we return
//  a clear status and the client falls back to the labeled
//  sample deck + a link to run it on WCS directly.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { cleanDomain } from "@/lib/wcs-scans";
import { remoteScanStatus, remoteStartScan } from "@/lib/wcs-remote";
import { notifyBrainztem } from "@/lib/notify";

export const runtime = "nodejs";
export const maxDuration = 300;

const BASE = (process.env.WCS_API_BASE ?? "https://www.websitecreditscore.com").replace(/\/$/, "");

/** Drain WCS's SSE stream — GET-ing it runs the research to completion. */
async function driveScan(scanId: string, budgetMs: number): Promise<void> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), budgetMs);
  try {
    const res = await fetch(`${BASE}/api/scan/${scanId}/stream`, { signal: ctrl.signal });
    if (!res.body) return;
    const reader = res.body.getReader();
    // Drain until the stream closes (scan done) or the budget aborts.
    for (;;) {
      const { done } = await reader.read();
      if (done) break;
    }
  } catch {
    /* aborted or network error — the poll below reports real status */
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!rateLimit(`demo-scan:${clientKey(req)}`, 6, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Rate limit reached — try again in an hour." }, { status: 429 });
  }
  let body: { domain?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const domain = cleanDomain(typeof body.domain === "string" ? body.domain : "");
  if (!domain || !domain.includes(".") || domain.length > 253) {
    return NextResponse.json({ ok: false, error: "Enter a valid domain." }, { status: 400 });
  }

  const scanId = await remoteStartScan(domain);
  if (!scanId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Couldn't start a scan right now.",
        fallbackUrl: `${BASE}/?domain=${encodeURIComponent(domain)}&utm_source=strategypresentation&utm_medium=demo`,
      },
      { status: 502 },
    );
  }

  // Drive the research (WCS runs it when the stream is read). Leave headroom
  // under the 300s function cap for the final status probe.
  await driveScan(scanId, 270_000);
  const status = (await remoteScanStatus(scanId))?.status ?? "pending";

  // Lead alert to relax@brainztem.com — someone cared enough to run a scan.
  await notifyBrainztem({ kind: "scan", domain, scanId });

  return NextResponse.json({
    ok: true,
    scanId,
    domain,
    status, // "done" → render the deck; anything else → still processing
    fallbackUrl: `${BASE}/scan/${scanId}`,
  });
}
