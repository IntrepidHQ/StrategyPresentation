// ============================================================
//  SP Studio — Strategy Detail API
//  apps/studio/src/app/api/strategy/[id]/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getStrategy } from "@/lib/db";
import type { StrategyCardVM } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const auth = req.headers.get("x-studio-passphrase");
  if (auth !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const strategy = await getStrategy(params.id);
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
