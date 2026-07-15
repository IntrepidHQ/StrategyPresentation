#!/usr/bin/env tsx
// ============================================================
//  SP — Contract tests
//  scripts/test-sp.ts       Run with: npm test
//
//  Fast, dependency-free assertions over the pure core:
//   - webhook HMAC verification (signature, replay window, bypass)
//   - DeckModel invariants (catalog totals, slide contract, CTA
//     deep-linking, tier filtering, XSS escaping)
//   - remote catalog mapping + fallback behavior
// ============================================================

import { createHmac } from "crypto";
import { createServer } from "http";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { verifyWebhook } from "../apps/studio/src/lib/webhook-verify";
import { buildDeckModel, SLIDE_IDS } from "../apps/studio/src/lib/deck/deck-model";
import { renderDeck } from "../apps/studio/src/lib/deck/render";
import { ADDON_CATALOG, preselectedTotal, TARGET_TOTAL } from "../apps/studio/src/lib/deck/catalog";
import { fetchRemoteCatalog } from "../apps/studio/src/lib/deck/catalog-remote";
import type { WCSReport } from "../apps/studio/src/lib/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(path.join(__dirname, "..", "apps", "studio", "src", "lib", "fixtures", "wcs-mock.json"), "utf-8"),
) as WCSReport;

let failures = 0;
function assert(name: string, cond: boolean, detail?: string) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? ` — ${detail}` : ""}`);
  if (!cond) failures += 1;
}

// ── Webhook HMAC ──────────────────────────────────────────────
{
  process.env.SP_WEBHOOK_SECRET = "test-secret";
  const body = JSON.stringify({ hello: "world" });
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = "sha256=" + createHmac("sha256", "test-secret").update(`${ts}.${body}`).digest("hex");

  assert("webhook: valid signature accepted", verifyWebhook(body, sig, ts, null).ok);
  assert("webhook: tampered body rejected", !verifyWebhook(body + " ", sig, ts, null).ok);
  assert("webhook: wrong secret rejected",
    !verifyWebhook(body, "sha256=" + createHmac("sha256", "other").update(`${ts}.${body}`).digest("hex"), ts, null).ok);
  const staleTs = String(Math.floor(Date.now() / 1000) - 600);
  const staleSig = "sha256=" + createHmac("sha256", "test-secret").update(`${staleTs}.${body}`).digest("hex");
  const stale = verifyWebhook(body, staleSig, staleTs, null);
  assert("webhook: 10-minute-old timestamp rejected (replay window)", !stale.ok && stale.status === 401);
  assert("webhook: missing headers rejected", !verifyWebhook(body, null, null, null).ok);
  const oldEnv = process.env.NODE_ENV;
  (process.env as Record<string, string>).NODE_ENV = "production";
  assert("webhook: dev bypass refused in production", !verifyWebhook(body, null, null, "true").ok);
  (process.env as Record<string, string | undefined>).NODE_ENV = oldEnv;
}

// ── Catalog invariants ────────────────────────────────────────
{
  assert(
    `catalog: preselected foundation sums to $${TARGET_TOTAL.toLocaleString()}`,
    preselectedTotal(ADDON_CATALOG) === TARGET_TOTAL,
    `got ${preselectedTotal(ADDON_CATALOG)}`,
  );
  const ids = new Set(ADDON_CATALOG.map((i) => i.id));
  assert("catalog: ids unique", ids.size === ADDON_CATALOG.length);
}

// ── DeckModel contract ────────────────────────────────────────
{
  const model = buildDeckModel(fixture, {
    clientName: "Test Co",
    clientSlug: "test-co",
    tier: "standard",
    templateId: "signal",
    source: "brainztem",
    sandboxToken: "abc123def456abc123def456abc12345",
  });
  assert("deck: canonical slide order", model.slideOrder.join(",") === SLIDE_IDS.join(","));
  assert("deck: 10 dimensions, weight-sorted",
    model.scorecard.dimensions.length === 10 &&
    model.scorecard.dimensions.every((d, i, a) => i === 0 || a[i - 1].weight >= d.weight));
  assert("deck: sandbox CTA deep-links to trial",
    model.nextStep.ctaHref.includes("/sandbox/abc123def456abc123def456abc12345"));
  assert("deck: benchmark delta consistent",
    model.score.benchmarkDelta === Math.max(0, 90 - fixture.overall.score));

  const std = buildDeckModel(fixture, { clientName: "x", clientSlug: "x", tier: "standard", templateId: "summit" });
  const npo = buildDeckModel(fixture, { clientName: "x", clientSlug: "x", tier: "nonprofit", templateId: "beacon" });
  const flat = (m: typeof std) => m.buildSheet.groups.flatMap((g) => g.items.map((i) => i.id));
  assert("deck: grant add-on nonprofit-only",
    !flat(std).includes("grant-agent") && flat(npo).includes("grant-agent"));
  assert("deck: no-sandbox CTA starts a trial", std.nextStep.ctaHref.includes("brainztem.com"));
}

// ── XSS escaping ──────────────────────────────────────────────
{
  const hostile = structuredClone(fixture) as WCSReport;
  hostile.overall.headline = `<script>alert(1)</script>`;
  hostile.green_flags = [{ title: `"><img src=x onerror=alert(2)>`, detail: "</style><script>x</script>" }];
  const html = renderDeck(
    buildDeckModel(hostile, { clientName: `<b>Evil</b>`, clientSlug: "evil", tier: "standard", templateId: "signal" }),
  );
  assert("xss: injected script tags neutralized", !html.includes("<script>alert(1)") && !html.includes("<img src=x"));
  assert("xss: escaped forms present", html.includes("&lt;script&gt;alert(1)"));
}

// ── Remote catalog mapping ────────────────────────────────────
// (async main: the repo compiles scripts as CJS, so no top-level await)
async function remoteCatalogTests() {
  process.env.SP_CATALOG_REMOTE = "off";
  assert("remote catalog: SP_CATALOG_REMOTE=off returns null", (await fetchRemoteCatalog()) === null);
  delete process.env.SP_CATALOG_REMOTE;

  const server = createServer((_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      ok: true,
      targetTotalUsd: 10500,
      groups: [{ id: "foundation", label: "Foundation", blurb: "core" }],
      items: [
        { id: "brain-build", name: "Brain build", description: "d", priceUsd: 2400, group: "foundation", mapsTo: "x", preselected: true },
        { id: "bad-group", name: "n", description: "d", priceUsd: 1, group: "nope", mapsTo: "x", preselected: false },
        { id: 42, name: "bad-id" },
      ],
    }));
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as { port: number }).port;
  process.env.BRAINZTEM_CATALOG_URL = `http://localhost:${port}/api/catalog`;

  const bundle = await fetchRemoteCatalog();
  assert("remote catalog: valid item mapped (priceUsd→price)",
    bundle?.items.length === 1 && bundle.items[0].id === "brain-build" && bundle.items[0].price === 2400);
  assert("remote catalog: malformed items dropped", !bundle?.items.some((i) => i.id === "bad-group"));
  server.close();
  delete process.env.BRAINZTEM_CATALOG_URL;
}

remoteCatalogTests().then(() => {
  console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASS");
  process.exit(failures ? 1 : 0);
});
