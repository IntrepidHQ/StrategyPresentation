// ============================================================
//  SP Studio — Strategy Generation Endpoint
//  apps/studio/src/app/api/generate/route.ts
//
//  Two engines:
//  - "deck" (default): Claude narrative (optional) → DeckModel →
//    slide-based template (summit/signal/editorial/monospace/
//    gallery/beacon). Falls back to deterministic copy when no
//    ANTHROPIC_API_KEY is configured, so local dev works offline.
//  - "legacy": the original scroll-page pipeline
//    (StrategyNarrative JSON → token replacement into
//    templates/base-strategy.html or nonprofit-strategy.html).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { isStudioAuthorized } from "@/lib/auth";
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
import { buildDeckModel, fetchRemoteCatalog, renderDeck, TEMPLATE_IDS } from "@/lib/deck";
import type { TemplateId } from "@/lib/deck";
import type { StrategyNarrative } from "@/lib/types";

// Template paths (relative to repo root, accessible at runtime)
const REPO_ROOT = path.join(process.cwd(), "..", "..");
const TEMPLATE_DIR = path.join(REPO_ROOT, "templates");
const PARTIAL_DIR = path.join(TEMPLATE_DIR, "partials");

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Studio-only: verify local passphrase
  if (!isStudioAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { strategyId?: string; engine?: "deck" | "legacy"; templateId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.strategyId) {
    return NextResponse.json({ error: "strategyId required" }, { status: 400 });
  }

  const engine = body.engine === "legacy" ? "legacy" : "deck";

  // ── Load strategy record ──────────────────────────────────
  const strategy = await getStrategy(body.strategyId);
  if (!strategy) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }

  if (strategy.status === "generating") {
    return NextResponse.json({ error: "Generation already in progress" }, { status: 409 });
  }

  // Explicit request wins, then the template stored on the record (from the
  // webhook), then the house default.
  const requested = body.templateId ?? strategy.template_id ?? "";
  const templateId: TemplateId = (TEMPLATE_IDS as readonly string[]).includes(requested)
    ? (requested as TemplateId)
    : "signal";

  // ── Mark as generating ────────────────────────────────────
  await updateStrategyStatus(body.strategyId, "generating");

  try {
    if (engine === "deck") {
      // ── Deck engine: optional narrative pass, then slides ──
      let narrative: StrategyNarrative | null = null;
      let pass1Tokens = 0;
      if (process.env.ANTHROPIC_API_KEY) {
        console.log(`[generate] deck — narrative pass for ${strategy.client_slug}`);
        const result = await generateStrategyNarrative(
          strategy.wcs_report,
          strategy.client_name,
          strategy.client_slug,
          strategy.tier
        );
        narrative = result.narrative;
        pass1Tokens = result.tokensUsed;
        await updateStrategyNarrative(body.strategyId, narrative);
      } else {
        console.log(`[generate] deck — no ANTHROPIC_API_KEY, deterministic copy`);
      }

      const model = buildDeckModel(strategy.wcs_report, {
        clientName: strategy.client_name,
        clientSlug: strategy.client_slug,
        tier: strategy.tier,
        templateId,
        source: strategy.source ?? "wcs",
        sandboxToken: strategy.sandbox_token ?? undefined,
        narrative,
        catalog: await fetchRemoteCatalog(),
      });
      const html = renderDeck(model);

      await updateStrategyHTML(body.strategyId, html, "review");
      console.log(`[generate] deck complete — ${templateId} (${html.length} chars)`);

      return NextResponse.json({
        ok: true,
        strategyId: body.strategyId,
        status: "review",
        engine,
        templateId,
        pass1Tokens,
      });
    }

    // ── Legacy engine ─────────────────────────────────────
    // Pass 1: Generate narrative
    console.log(`[generate] Pass 1 — narrative for ${strategy.client_slug}`);
    const { narrative, tokensUsed: pass1Tokens } = await generateStrategyNarrative(
      strategy.wcs_report,
      strategy.client_name,
      strategy.client_slug,
      strategy.tier
    );

    await updateStrategyNarrative(body.strategyId, narrative);
    console.log(`[generate] Pass 1 complete — ${pass1Tokens} tokens`);

    // Pass 2: Render HTML
    console.log(`[generate] Pass 2 — HTML render`);
    const templateFile =
      strategy.tier === "nonprofit"
        ? "nonprofit-strategy.html"
        : "base-strategy.html";

    const templateHtml = await loadTemplate(templateFile);

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
      engine,
      pass1Tokens,
    });
  } catch (e) {
    // Reset to generated state on error so Hans can retry
    await updateStrategyStatus(body.strategyId, "generated").catch(() => {});
    console.error(`[generate] Error: ${e}`);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

async function loadTemplate(templateFile: string): Promise<string> {
  let templateHtml = await readFile(path.join(TEMPLATE_DIR, templateFile), "utf-8");

  const partials = [
    {
      src: "../../templates/partials/gate.js",
      file: "gate.js",
    },
    {
      src: "../../templates/partials/shared-header.js",
      file: "shared-header.js",
    },
  ];

  for (const partial of partials) {
    const script = await readFile(path.join(PARTIAL_DIR, partial.file), "utf-8");
    templateHtml = templateHtml.replace(
      `<script src="${partial.src}"></script>`,
      `<script>\n${script}\n</script>`
    );
  }

  return templateHtml;
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
