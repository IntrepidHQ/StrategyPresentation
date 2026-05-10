import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import {
  getStrategy,
  updateStrategyNarrative,
  updateStrategyHTML,
  transitionStatus,
} from "@/lib/db";
import {
  generateStrategyNarrative,
  renderStrategyHTML,
  estimateCostUSD,
} from "@/lib/anthropic";
import { fireDraftReadyNotification } from "@/lib/crm-webhook";

const TEMPLATE_DIR = path.join(process.cwd(), "templates");

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
  if (strategy.status === "generating") {
    return NextResponse.json({ error: "Generation already in progress" }, { status: 409 });
  }

  await transitionStatus(body.strategyId, "generating");

  try {
    console.log(`[generate] Pass 1 — narrative for ${strategy.client_slug}`);
    const { narrative, usage } = await generateStrategyNarrative(
      strategy.wcs_report,
      strategy.client_name,
      strategy.client_slug,
      strategy.tier,
    );
    await updateStrategyNarrative(body.strategyId, narrative);
    const pass1Cost = estimateCostUSD(usage);
    console.log(
      `[generate] Pass 1 done — in=${usage.input} cacheRead=${usage.cacheRead} cacheCreate=${usage.cacheCreate} out=${usage.output} cost=$${pass1Cost.toFixed(4)}`,
    );

    console.log(`[generate] Pass 2 — HTML render`);
    const templateFile =
      strategy.tier === "nonprofit" ? "nonprofit-strategy.html" : "base-strategy.html";
    const templateHtml = await readFile(path.join(TEMPLATE_DIR, templateFile), "utf-8");

    const html = renderStrategyHTML(
      templateHtml,
      narrative,
      strategy.wcs_report,
      strategy.gate_password ?? `${capitalize(strategy.client_slug)}2026`,
      strategy.gate_signed_date ?? formatTodayDate(),
    );

    await updateStrategyHTML(body.strategyId, html, "review");
    console.log(`[generate] Pass 2 done — HTML saved (${html.length} chars)`);

    // Best-effort CRM notification — don't block on failure
    fireDraftReadyNotification({ ...strategy, narrative, current_html: html, status: "review" })
      .then((r) => {
        if (!r.ok) console.warn(`[generate] CRM notify failed: ${r.error}`);
      })
      .catch(() => {});

    return NextResponse.json({
      ok: true,
      strategyId: body.strategyId,
      status: "review",
      usage,
      costUSD: pass1Cost,
    });
  } catch (e) {
    // On failure, push back to draft so Hans can retry
    await transitionStatus(body.strategyId, "draft").catch(() => {});
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
