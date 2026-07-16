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
  const [scanning, setScanning] = useState(false);

  // Run the scan right here (proxy to WCS), then flip to the live deck —
  // no bounce to websitecreditscore.com.
  async function runScanHere(target: string) {
    if (scanning) return;
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: target }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.scanId && data.status === "done") {
        setResult({ mode: "scan", scanId: data.scanId, domain: data.domain, score: 0, grade: "", companyName: null });
      } else if (data?.fallbackUrl) {
        setError("Still building your scan — this can take a minute. Keep the sample below, or finish it on WebsiteCreditScore.");
      } else {
        setError(data?.error ?? "Couldn't run the scan — showing the sample below.");
      }
    } catch {
      setError("Couldn't reach the scanner — showing the sample below.");
    } finally {
      setScanning(false);
    }
  }

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
          template, // the deck email links the exact look they're previewing
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

  // The phone on the right always has a deck in it: theirs once looked up,
  // the auto-playing sample before that — the preview IS the pitch.
  const phoneSrc = deckSrc ?? `/api/demo/deck?source=sample&template=${template}&autoplay=1`;

  const trialHref = result
    ? `https://brainztem.com/?domain=${encodeURIComponent(result.domain)}&utm_source=strategypresentation&utm_medium=landing&utm_campaign=see-it-in-action`
    : "https://brainztem.com/?utm_source=strategypresentation&utm_medium=landing";

  return (
    <div className="lp-demo-grid" id="demo-widget">
      <div className="lp-demo-col">
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
              <strong>No fresh scan exists for {result.domain} yet.</strong> Below is the sample deck,
              built from a real public scan of apple.com — or build yours right here.
              <span className="lp-scan-actions">
                <button
                  className="lp-btn"
                  type="button"
                  disabled={scanning}
                  onClick={() => runScanHere(result.domain)}
                >
                  {scanning ? `Scanning ${result.domain}…` : `Scan ${result.domain} now`}
                </button>
              </span>
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

          <div className="lp-claim">
            {claimState === "done" ? (
              <p className="lp-status">
                Sent — your deck is on its way from relax@brainztem.com. We&apos;ll follow up personally.
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

      {/* ── The preview, as a phone, to the right of the form ── */}
      <div className="lp-demo-phone-col">
        <div className="lp-phone">
          <iframe
            className="lp-phone-frame"
            key={phoneSrc}
            sandbox="allow-scripts allow-same-origin"
            src={phoneSrc}
            title={`Strategy presentation preview (mobile) — ${template} template`}
          />
        </div>
        <p className="lp-phone-caption" aria-live="polite">
          {result?.mode === "scan"
            ? `${result.domain} · ${template} — tap or use arrow keys`
            : `Sample deck (real apple.com scan) · ${template}`}
        </p>
        <p className="lp-viewer-actions">
          <a href={deckSrc ?? phoneSrc} rel="noopener" target="_blank">
            Open full screen ↗
          </a>
        </p>
      </div>
    </div>
  );
}
