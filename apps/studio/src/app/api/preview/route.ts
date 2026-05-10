// ============================================================
//  SP Studio - HTML Preview API
//  apps/studio/src/app/api/preview/route.ts
//
//  Returns the current strategy HTML for iframe previews.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getStrategy } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("x-studio-passphrase");
  if (auth !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const strategyId = req.nextUrl.searchParams.get("strategyId");
  if (!strategyId) {
    return NextResponse.json({ error: "strategyId required" }, { status: 400 });
  }

  const strategy = await getStrategy(strategyId);
  if (!strategy) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }
  if (!strategy.current_html) {
    return NextResponse.json({ error: "No HTML generated yet" }, { status: 404 });
  }

  return new NextResponse(strategy.current_html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
