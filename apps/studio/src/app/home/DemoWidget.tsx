"use client";

// ============================================================
//  SP Landing — "See it in action" widget
//  apps/studio/src/app/home/DemoWidget.tsx
//
//  Domain input → /api/demo/lookup → deck viewer with template
//  switcher (all six styles of the same deck) → email claim →
//  Brainztem trial CTA. Honesty rule: we never invent a score —
//  no fresh scan means a clearly-labeled sample deck plus a link
//  to run the real scan on websitecreditscore.com.
// ============================================================

import { FormEvent, useState } from "react";

const TEMPLATES = [
  { id: "signal", label: "Signal" },
  { id: "summit", label: "Summit" },
  { id: "editorial", label: "Editorial" },
  { id: "monospace", label: "Monospace" },
  { id: "gallery", label: "Gallery" },
  { id: "beacon", label: "Beacon" },
];

type Lookup =
  | { mode: "scan"; scanId: string; domain: string; score: number; grade: string; companyName: string | null }
  | { mode: "sample"; domain: string; scanUrl: string };

export default function DemoWidget() {
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Lookup | null>(null);
  const [template, setTemplate] = useState("signal");
  const [email, setEmail] = useState("");
  const [claimState, setClaimState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !domain.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setClaimState("idle");

    try {
      const res = await fetch(`/api/demo/lookup?domain=${encodeURIComponent(domain.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Lookup failed — try again.");
      setResult(data as Lookup);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (claimState === "busy" || !email.trim() || !result) return;
    setClaimState("busy");
    try {
      const res = await fetch("/api/demo/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          domain: result.domain,
          source: result.mode,
          scanId: result.mode === "scan" ? result.scanId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not save.");
      setClaimState("done");
    } catch {
      setClaimState("error");
    }
  }

  const deckSrc = result
    ? result.mode === "scan"
      ? `/api/demo/deck?source=scan&id=${encodeURIComponent(result.scanId)}&template=${template}`
      : `/api/demo/deck?source=sample&template=${template}`
    : null;

  const trialHref = result
    ? `https://brainztem.com/?domain=${encodeURIComponent(result.domain)}&utm_source=strategypresentation&utm_medium=landing&utm_campaign=see-it-in-action`
    : "https://brainztem.com/?utm_source=strategypresentation&utm_medium=landing";

  return (
    <div id="demo">
      <form className="lp-domain-form" onSubmit={handleLookup}>
        <label className="lp-visually-hidden" htmlFor="lp-domain">
          Your website domain
        </label>
        <input
          autoComplete="url"
          className="lp-domain-input"
          id="lp-domain"
          inputMode="url"
          onChange={(event) => setDomain(event.target.value)}
          placeholder="yourcompany.com"
          type="text"
          value={domain}
        />
        <button className="lp-btn" disabled={busy} type="submit">
          {busy ? "Checking…" : "Build my deck"}
        </button>
      </form>
      <p className="lp-fineprint">
        Free preview · built from public evidence via WebsiteCreditScore · no signup to look
      </p>

      {error && (
        <p aria-live="polite" className="lp-status" data-tone="error">
          {error}
        </p>
      )}

      {result && (
        <div aria-live="polite" className="lp-result">
          {result.mode === "scan" ? (
            <div className="lp-result-banner">
              <strong>
                {result.companyName ?? result.domain} — credit score {result.score} ({result.grade}).
              </strong>{" "}
              Built from the most recent completed scan of {result.domain}. Flip it through all six
              templates below.
            </div>
          ) : (
            <div className="lp-result-banner">
              <strong>No fresh scan exists for {result.domain} yet</strong> — so here is the sample
              deck, built from a real public scan of apple.com. Want yours?{" "}
              <a href={result.scanUrl} rel="noopener" target="_blank">
                Run a free scan of {result.domain}
              </a>{" "}
              and come back — the deck builds itself.
            </div>
          )}

          <div aria-label="Deck template" className="lp-tabs" role="group">
            {TEMPLATES.map((t) => (
              <button
                aria-pressed={template === t.id}
                className="lp-tab"
                key={t.id}
                onClick={() => setTemplate(t.id)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>

          {deckSrc && (
            <>
              <iframe
                className="lp-viewer"
                sandbox="allow-scripts allow-same-origin"
                src={deckSrc}
                title={`Strategy presentation preview — ${template} template`}
              />
              <p className="lp-viewer-actions">
                <a href={deckSrc} rel="noopener" target="_blank">
                  Open full screen ↗
                </a>
                <span className="lp-muted">Arrow keys move between slides.</span>
              </p>
            </>
          )}

          <div className="lp-claim">
            {claimState === "done" ? (
              <p className="lp-status">
                Got it — we&apos;ll send your deck link and follow up personally.
              </p>
            ) : (
              <form onSubmit={handleClaim}>
                <label className="lp-visually-hidden" htmlFor="lp-email">
                  Email address
                </label>
                <input
                  autoComplete="email"
                  id="lp-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  type="email"
                  value={email}
                />
                <button className="lp-btn lp-btn-ghost" disabled={claimState === "busy"} type="submit">
                  {claimState === "busy" ? "Saving…" : "Email me this deck"}
                </button>
                <a className="lp-btn" href={trialHref} rel="noopener" target="_blank">
                  Start a 48-hour trial instance
                </a>
              </form>
            )}
            {claimState === "error" && (
              <p aria-live="polite" className="lp-status" data-tone="error">
                Could not save your email — try again in a minute.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
