import { NextRequest, NextResponse } from "next/server";
import { getStrategy, markApproved } from "@/lib/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("x-studio-passphrase");
  if (auth !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const strategyId = typeof body.strategyId === "string" ? body.strategyId : null;
  if (!strategyId) {
    return NextResponse.json({ error: "strategyId required" }, { status: 400 });
  }

  const strategy = await getStrategy(strategyId);
  if (!strategy) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }
  if (strategy.status !== "published" && strategy.status !== "approved") {
    return NextResponse.json(
      { error: `Cannot approve from status ${strategy.status}; publish first.` },
      { status: 409 },
    );
  }

  if (strategy.status === "approved") {
    return NextResponse.json({ ok: true, status: "approved" });
  }

  const updated = await markApproved(strategyId);
  return NextResponse.json({ ok: true, status: updated.status });
}
