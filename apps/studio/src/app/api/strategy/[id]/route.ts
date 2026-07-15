// ============================================================
//  SP Studio — Strategy Detail API
//  apps/studio/src/app/api/strategy/[id]/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { isStudioAuthorized } from "@/lib/auth";
import { getStrategy } from "@/lib/db";
import type { StrategyCardVM } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  if (!isStudioAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const strategy = await getStrategy(id);
  if (!strategy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meta: StrategyCardVM = {
    id: strategy.id,
    clientName: strategy.client_name,
    clientSlug: strategy.client_slug,
    tier: strategy.tier,
    status: strategy.status,
    overallScore: strategy.wcs_report.overall.score,
    overallGrade: strategy.wcs_report.overall.grade,
    domain: strategy.wcs_report.domain,
    createdAt: strategy.created_at,
    publishedAt: strategy.published_at,
    vercelUrl: strategy.vercel_url,
  };

  return NextResponse.json({
    meta: { ...meta, gatePassword: strategy.gate_password },
    html: strategy.current_html,
    narrative: strategy.narrative,
  });
}
