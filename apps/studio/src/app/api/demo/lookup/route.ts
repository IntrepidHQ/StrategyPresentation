// ============================================================
//  SP Demo — Scan lookup
//  apps/studio/src/app/api/demo/lookup/route.ts    (public)
//
//  GET /api/demo/lookup?domain=example.com
//  Finds a fresh completed WCS scan for the domain. We never
//  fabricate scores: when no real scan exists the client is told
//  to either view the clearly-labeled sample deck or run a real
//  scan at websitecreditscore.com.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { cleanDomain, getRecentScanByDomain } from "@/lib/wcs-scans";

const WCS_SCAN_URL = "https://www.websitecreditscore.com";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!rateLimit(`demo-lookup:${clientKey(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Rate limit reached — try again in an hour." },
      { status: 429 },
    );
  }

  const domain = cleanDomain(req.nextUrl.searchParams.get("domain") ?? "");
  if (!domain || !domain.includes(".") || domain.length > 253) {
    return NextResponse.json({ ok: false, error: "Enter a valid domain." }, { status: 400 });
  }

  const hit = await getRecentScanByDomain(domain);
  if (hit) {
    return NextResponse.json({
      ok: true,
      mode: "scan",
      scanId: hit.scanId,
      domain: hit.domain,
      score: hit.report.overall.score,
      grade: hit.report.overall.grade,
      companyName: hit.report.company_name ?? null,
      completedAt: hit.completedAt,
    });
  }

  return NextResponse.json({
    ok: true,
    mode: "sample",
    domain,
    scanUrl: `${WCS_SCAN_URL}/?domain=${encodeURIComponent(domain)}&utm_source=strategypresentation&utm_medium=demo&utm_campaign=see-it-in-action`,
  });
}
