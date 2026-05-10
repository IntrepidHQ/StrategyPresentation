import { NextRequest, NextResponse } from "next/server";
import {
  getStrategy,
  updateStrategyHTML,
  saveEditHistory,
  getEditAtOffset,
} from "@/lib/db";
import { editStrategyHTML, estimateCostUSD, MODELS } from "@/lib/anthropic";

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
      { status: 400 },
    );
  }

  const strategy = await getStrategy(body.strategyId);
  if (!strategy) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }
  if (!strategy.current_html) {
    return NextResponse.json(
      { error: "No HTML to edit — generate first" },
      { status: 400 },
    );
  }

  try {
    const { updatedHtml, usage } = await editStrategyHTML(
      strategy.current_html,
      body.prompt,
    );

    const edit = await saveEditHistory({
      strategyId: body.strategyId,
      prompt: body.prompt,
      htmlBefore: strategy.current_html,
      htmlAfter: updatedHtml,
      usage,
      model: MODELS.edit,
    });

    await updateStrategyHTML(body.strategyId, updatedHtml);

    return NextResponse.json({
      ok: true,
      editId: edit.id,
      usage,
      costUSD: estimateCostUSD(usage),
      html: updatedHtml,
    });
  } catch (e) {
    console.error(`[edit] Error: ${e}`);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Undo: revert to N edits ago
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

  const html = await getEditAtOffset(strategyId, stepsBack);
  if (!html) {
    return NextResponse.json({ error: "No edit to undo" }, { status: 404 });
  }
  await updateStrategyHTML(strategyId, html);
  return NextResponse.json({ ok: true, html });
}
