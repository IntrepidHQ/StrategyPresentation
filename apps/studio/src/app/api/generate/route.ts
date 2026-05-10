// ============================================================
//  SP Studio — Strategy Generation Endpoint
//  apps/studio/src/app/api/generate/route.ts
//
//  Two-pass pipeline:
//  1. Claude Opus → StrategyNarrative JSON
//  2. Token replacement → final HTML
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import {
  getStrategy,
  updateStrategyNarrative,
  updateStrategyHTML,
  updateStrategyStatus,
} from "@/lib/db";
import {
  generateStrategyNarrative,
  renderStrategyHTML,
} from "@/lib/anthropic";

// Template paths (relative to repo root, accessible at runtime)
const TEMPLATE_DIR = path.join(process.cwd(), "..", "..", "templates");

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Studio-only: verify local passphrase
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

  // ── Load strategy record ──────────────────────────────────
  const strategy = await getStrategy(body.strategyId);
  if (!strategy) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }

  if (strategy.status === "generating") {
    return NextResponse.json({ error: "Generation already in progress" }, { status: 409 });
  }

  // ── Mark as generating ────────────────────────────────────
  await updateStrategyStatus(body.strategyId, "generating");

  try {
    // ── Pass 1: Generate narrative ────────────────────────
    console.log(`[generate] Pass 1 — narrative for ${strategy.client_slug}`);
    const { narrative, tokensUsed: pass1Tokens } = await generateStrategyNarrative(
      strategy.wcs_report,
      strategy.client_name,
      strategy.client_slug,
      strategy.tier
    );

    await updateStrategyNarrative(body.strategyId, narrative);
    console.log(`[generate] Pass 1 complete — ${pass1Tokens} tokens`);

    // ── Pass 2: Render HTML ───────────────────────────────
    console.log(`[generate] Pass 2 — HTML render`);
    const templateFile =
      strategy.tier === "nonprofit"
        ? "nonprofit-strategy.html"
        : "base-strategy.html";

    const templateHtml = await readFile(
      path.join(TEMPLATE_DIR, templateFile),
      "utf-8"
    );

    const html = renderStrategyHTML(
      templateHtml,
      narrative,
      strategy.wcs_report,
      strategy.gate_password ?? `${capitalize(strategy.client_slug)}2026`,
      strategy.gate_signed_date ?? formatTodayDate()
    );

    await updateStrategyHTML(body.strategyId, html, "review");
    console.log(`[generate] Pass 2 complete — HTML saved (${html.length} chars)`);

    return NextResponse.json({
      ok: true,
      strategyId: body.strategyId,
      status: "review",
      pass1Tokens,
    });
  } catch (e) {
    // Reset to generated state on error so Hans can retry
    await updateStrategyStatus(body.strategyId, "generated").catch(() => {});
    console.error(`[generate] Error: ${e}`);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
