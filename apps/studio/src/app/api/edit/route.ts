// ============================================================
//  SP Studio — HTML Edit Endpoint (Lovable Mode)
//  apps/studio/src/app/api/edit/route.ts
//
//  Hans prompts Claude to edit the current HTML.
//  Saves edit history, returns updated HTML.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getStrategy, updateStrategyHTML, saveEditHistory } from "@/lib/db";
import { editStrategyHTML } from "@/lib/anthropic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("x-studio-passphrase");
  if (auth !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { strategyId?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.strategyId || !body.prompt?.trim()) {
    return NextResponse.json(
      { error: "strategyId and prompt required" },
      { status: 400 }
    );
  }

  const strategy = await getStrategy(body.strategyId);
  if (!strategy) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }
  if (!strategy.current_html) {
    return NextResponse.json(
      { error: "No HTML to edit — generate first" },
      { status: 400 }
    );
  }

  try {
    const { updatedHtml, tokensUsed } = await editStrategyHTML(
      strategy.current_html,
      body.prompt
    );

    // Save to edit history (captures before/after for undo)
    const edit = await saveEditHistory({
      strategyId: body.strategyId,
      prompt: body.prompt,
      htmlBefore: strategy.current_html,
      htmlAfter: updatedHtml,
      tokensUsed,
      model: "claude-sonnet-4-6",
    });

    // Update current HTML in strategies table
    await updateStrategyHTML(body.strategyId, updatedHtml);

    return NextResponse.json({
      ok: true,
      editId: edit.id,
      tokensUsed,
      // Return updated HTML so client can refresh iframe without another fetch
      html: updatedHtml,
    });
  } catch (e) {
    console.error(`[edit] Error: ${e}`);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ── Undo: revert to N edits ago ───────────────────────────────

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("x-studio-passphrase");
  if (auth !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const strategyId = searchParams.get("strategyId");
  const stepsBack = parseInt(searchParams.get("steps") ?? "1", 10);

  if (!strategyId) {
    return NextResponse.json({ error: "strategyId required" }, { status: 400 });
  }

  const { getEditAtOffset } = await import("@/lib/db");
  const html = await getEditAtOffset(strategyId, stepsBack);

  if (!html) {
    return NextResponse.json({ error: "No edit to undo" }, { status: 404 });
  }

  await updateStrategyHTML(strategyId, html);
  return NextResponse.json({ ok: true, html });
}
