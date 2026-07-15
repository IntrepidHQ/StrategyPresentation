// ============================================================
//  SP Studio — Strategies List API
//  apps/studio/src/app/api/strategies/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { isStudioAuthorized } from "@/lib/auth";
import { listStrategies } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isStudioAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const strategies = await listStrategies();
    return NextResponse.json({ strategies });
  } catch (e) {
    console.error(`[strategies] ${e}`);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
