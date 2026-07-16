// ============================================================
//  SP Demo — Deck renderer
//  apps/studio/src/app/api/demo/deck/route.ts    (public)
//
//  GET /api/demo/deck?source=sample&template=signal
//  GET /api/demo/deck?source=scan&id=<scanUuid>&template=summit
//
//  Returns a complete self-contained deck as text/html — used
//  both as the iframe src for the landing-page viewer and as an
//  "open full screen" URL. Deterministic DeckModel only (no
//  Claude call): demo decks must be instant and free.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { buildDeckModel, fetchRemoteCatalog, renderDeck, TEMPLATE_IDS } from "@/lib/deck";
import type { TemplateId } from "@/lib/deck";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getScanById } from "@/lib/wcs-scans";
import type { WCSReport } from "@/lib/types";
import sampleReport from "@/lib/fixtures/wcs-mock.json";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!rateLimit(`demo-deck:${clientKey(req)}`, 120, 60 * 60 * 1000)) {
    return new NextResponse("Rate limit reached — try again in an hour.", { status: 429 });
  }

  const params = req.nextUrl.searchParams;
  const templateParam = params.get("template") ?? "signal";
  const templateId: TemplateId = (TEMPLATE_IDS as readonly string[]).includes(templateParam)
    ? (templateParam as TemplateId)
    : "signal";

  // Brainztem embeds decks for live trials: &sandbox=<token>&src=brainztem
  // makes the deck's closing CTA deep-link back into the trial instance.
  const sandboxParam = params.get("sandbox") ?? "";
  const sandboxToken = /^[a-z0-9]{16,64}$/i.test(sandboxParam) ? sandboxParam : undefined;
  const source = params.get("src") === "brainztem" ? "brainztem" : "sp-demo";

  let report: WCSReport;
  let isSample = false;

  if (params.get("source") === "scan" && params.get("id")) {
    // getScanById checks SP's shared copy, then WCS over HTTP. If the scan
    // still can't be resolved (e.g. still processing), never dead-end on a
    // raw error — present the clearly-labeled sample so the flow keeps moving.
    const hit = await getScanById(params.get("id")!);
    if (hit) {
      report = hit.report;
    } else {
      report = sampleReport as unknown as WCSReport;
      isSample = true;
    }
  } else {
    report = sampleReport as unknown as WCSReport;
    isSample = true;
  }

  const clientName = report.company_name ?? report.domain;
  const model = buildDeckModel(report, {
    clientName: isSample ? `${clientName} (sample)` : clientName,
    clientSlug: "demo",
    tier: "standard",
    templateId,
    source,
    sandboxToken,
    catalog: await fetchRemoteCatalog(),
  });

  const html = renderDeck(model);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
