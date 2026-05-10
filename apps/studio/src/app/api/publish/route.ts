import { NextRequest, NextResponse } from "next/server";
import { getStrategy, markPublished } from "@/lib/db";

// In the rewrites-based serving model, "publish" is a status flip — the
// /strategies/[slug] route serves current_html from Supabase whenever
// status is `published` or beyond. No Vercel Deploy API call needed.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("x-studio-passphrase");
  if (auth !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { strategyId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.strategyId) {
    return NextResponse.json({ error: "strategyId required" }, { status: 400 });
  }

  const strategy = await getStrategy(body.strategyId);
  if (!strategy) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }
  if (!strategy.current_html) {
    return NextResponse.json({ error: "No HTML to publish" }, { status: 400 });
  }

  // Pre-publish checks
  const issues: string[] = [];
  if (!strategy.gate_password) issues.push("Gate password not set");
  if (strategy.current_html.includes("{{")) {
    issues.push("HTML still contains unreplaced tokens ({{...}})");
  }
  if (strategy.current_html.length < 5000) {
    issues.push("HTML seems too short — possible generation error");
  }
  if (issues.length > 0) {
    return NextResponse.json(
      { error: "Pre-publish check failed", issues },
      { status: 400 },
    );
  }

  // status flip: review (or already-published) → published
  if (strategy.status !== "published" && strategy.status !== "review") {
    return NextResponse.json(
      {
        error: `Cannot publish from status ${strategy.status}; expected 'review' or 'published'.`,
      },
      { status: 409 },
    );
  }

  try {
    const url = `https://${strategy.client_slug}.strategypresentation.com`;
    await markPublished(body.strategyId, url);
    console.log(`[publish] ${strategy.client_slug} → ${url}`);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error(`[publish] Error: ${e}`);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
