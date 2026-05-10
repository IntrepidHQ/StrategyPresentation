// ============================================================
//  SP Studio — Strategies List API
//  apps/studio/src/app/api/strategies/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { listStrategies } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("x-studio-passphrase");
  if (auth !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const strategies = await listStrategies();
  return NextResponse.json({ strategies });
}
