// ============================================================
//  SP Studio — Publish Endpoint
//  apps/studio/src/app/api/publish/route.ts
//
//  Hans presses Publish → strategy goes live at
//  [slug].strategypresentation.com via Vercel Deploy API.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getStrategy, markStrategyPublished, deleteDeployment } from "@/lib/db";
import { deployStrategy } from "@/lib/vercel-deploy";

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

  // ── Pre-publish validation ────────────────────────────────
  const issues: string[] = [];
  if (!strategy.gate_password) issues.push("Gate password not set");
  if (strategy.current_html.includes("{{")) {
    issues.push("HTML still contains unreplaced tokens ({{...}})");
  }
  if (strategy.current_html.length < 5000) {
    issues.push("HTML seems too short — possible generation error");
  }

  if (issues.length > 0) {
    return NextResponse.json({ error: "Pre-publish check failed", issues }, { status: 400 });
  }

  try {
    // ── Delete old deployment if republishing ─────────────
    if (strategy.vercel_deploy_id) {
      await deleteDeployment(strategy.vercel_deploy_id).catch((e) => {
        console.warn(`[publish] Old deployment cleanup failed: ${e}`);
      });
    }

    // ── Deploy to Vercel ──────────────────────────────────
    console.log(`[publish] Deploying ${strategy.client_slug} to Vercel...`);
    const { deploymentId, aliasUrl } = await deployStrategy({
      slug: strategy.client_slug,
      html: strategy.current_html,
      clientName: strategy.client_name,
    });

    // ── Save to DB ────────────────────────────────────────
    await markStrategyPublished(body.strategyId, aliasUrl, deploymentId);

    console.log(`[publish] Live at ${aliasUrl}`);

    return NextResponse.json({
      ok: true,
      url: aliasUrl,
      deployId: deploymentId,
    });
  } catch (e) {
    console.error(`[publish] Error: ${e}`);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
