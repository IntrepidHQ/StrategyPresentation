"use client";

// ============================================================
//  SP Studio — Dashboard
//  apps/studio/src/app/page.tsx
//
//  Lists all strategy records. Hans's launchpad.
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import type { StrategyCardVM } from "@/lib/types";

const PASSPHRASE = process.env.NEXT_PUBLIC_STUDIO_PASSPHRASE ?? "";

export default function Dashboard() {
  const [strategies, setStrategies] = useState<StrategyCardVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetch("/api/strategies", {
      headers: { "x-studio-passphrase": PASSPHRASE },
    })
      .then((r) => r.json())
      .then((d) => setStrategies(d.strategies ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>SP Studio</span>
          <span style={s.logoSub}>strategypresentation.com</span>
        </div>
        <button onClick={() => setShowNew(true)} style={s.newBtn}>
          + New Strategy
        </button>
      </header>

      <main style={s.main}>
        {loading ? (
          <p style={s.empty}>Loading…</p>
        ) : strategies.length === 0 ? (
          <div style={s.emptyState}>
            <p style={s.emptyTitle}>No strategies yet.</p>
            <p style={s.emptySub}>
              Trigger one from WCS, or paste a WCS payload via{" "}
              <code style={s.code}>POST /api/webhook</code> with the dev bypass header.
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {strategies.map((s_) => (
              <StrategyCard key={s_.id} strategy={s_} />
            ))}
          </div>
        )}
      </main>

      {showNew && <NewStrategyModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

// ── Strategy card ─────────────────────────────────────────────

function StrategyCard({ strategy }: { strategy: StrategyCardVM }) {
  const statusColor: Record<string, string> = {
    draft: "#6b7280",
    generating: "#f59e0b",
    generated: "#3b82f6",
    review: "#8b5cf6",
    published: "#10b981",
  };

  return (
    <Link href={`/studio/${strategy.id}`} style={s.card}>
      <div style={s.cardTop}>
        <span style={s.cardClient}>{strategy.clientName}</span>
        <span
          style={{
            ...s.cardStatus,
            background: statusColor[strategy.status] ?? "#6b7280",
          }}
        >
          {strategy.status}
        </span>
      </div>
      <p style={s.cardDomain}>{strategy.domain}</p>
      <div style={s.cardMeta}>
        <span style={s.scoreChip}>
          {strategy.overallScore} / {strategy.overallGrade}
        </span>
        <span
          style={{
            ...s.tierChip,
            background: strategy.tier === "nonprofit" ? "#1e1a3a" : "#1a2e1a",
            color: strategy.tier === "nonprofit" ? "#818cf8" : "#4ade80",
          }}
        >
          {strategy.tier}
        </span>
      </div>
      {strategy.vercelUrl && (
        <p style={s.liveUrl}>{strategy.vercelUrl.replace("https://", "")}</p>
      )}
      <p style={s.cardDate}>
        Created {new Date(strategy.createdAt).toLocaleDateString()}
        {strategy.publishedAt && (
          <> · Published {new Date(strategy.publishedAt).toLocaleDateString()}</>
        )}
      </p>
    </Link>
  );
}

// ── New strategy modal (paste JSON manually for dev) ──────────

function NewStrategyModal({ onClose }: { onClose: () => void }) {
  const [json, setJson] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientSlug, setClientSlug] = useState("");
  const [tier, setTier] = useState<"standard" | "nonprofit">("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const wcsReport = JSON.parse(json);
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wcs-dev-bypass": "true",
          "x-wcs-timestamp": String(Math.floor(Date.now() / 1000)),
          "x-wcs-signature": "sha256=dev",
        },
        body: JSON.stringify({ wcsReport, clientName, clientSlug, tier }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      window.location.href = `/studio/${data.strategyId}`;
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={s.modalTitle}>New Strategy (Dev Paste)</h2>
        <p style={s.modalSub}>Paste a WCS JSON report and set client metadata.</p>

        {error && <p style={s.modalError}>{error}</p>}

        <label style={s.label}>Client Name</label>
        <input
          style={s.input}
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="AbilitySC"
        />

        <label style={s.label}>Client Slug (subdomain)</label>
        <input
          style={s.input}
          value={clientSlug}
          onChange={(e) => setClientSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="abilitysc"
        />

        <label style={s.label}>Tier</label>
        <select
          style={s.input}
          value={tier}
          onChange={(e) => setTier(e.target.value as "standard" | "nonprofit")}
        >
          <option value="standard">Standard</option>
          <option value="nonprofit">Nonprofit</option>
        </select>

        <label style={s.label}>WCS Report JSON</label>
        <textarea
          style={{ ...s.input, height: "160px", resize: "vertical", fontFamily: "monospace", fontSize: "11px" }}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder='{"domain":"abilitysc.org","overall":{"score":72,...}}'
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button onClick={onClose} style={s.cancelBtn}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !json || !clientName || !clientSlug}
            style={s.submitBtn}
          >
            {loading ? "Creating…" : "Create Strategy →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5", fontFamily: "'Inter', system-ui, sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: "56px", borderBottom: "1px solid #1e1e1e", background: "#111" },
  headerLeft: { display: "flex", alignItems: "baseline", gap: "10px" },
  logo: { fontSize: "18px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" },
  logoSub: { fontSize: "12px", color: "#555" },
  newBtn: { padding: "8px 16px", background: "#C9A44C", border: "none", borderRadius: "8px", color: "#0a0a08", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  main: { padding: "32px" },
  empty: { color: "#555", textAlign: "center", paddingTop: "80px" },
  emptyState: { textAlign: "center", paddingTop: "80px" },
  emptyTitle: { color: "#888", fontSize: "18px", marginBottom: "8px" },
  emptySub: { color: "#555", fontSize: "14px" },
  code: { background: "#1a1a1a", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace", fontSize: "12px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" },
  card: { display: "block", background: "#111", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "20px", textDecoration: "none", color: "inherit", transition: "border-color 0.15s" },
  cardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "6px" },
  cardClient: { fontSize: "15px", fontWeight: 600, color: "#fff" },
  cardStatus: { fontSize: "10px", padding: "2px 8px", borderRadius: "4px", color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 },
  cardDomain: { fontSize: "12px", color: "#555", marginBottom: "12px" },
  cardMeta: { display: "flex", gap: "8px", marginBottom: "10px" },
  scoreChip: { fontSize: "12px", padding: "2px 8px", background: "#1a2e1a", color: "#4ade80", borderRadius: "4px", fontWeight: 600 },
  tierChip: { fontSize: "11px", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.06em" },
  liveUrl: { fontSize: "11px", color: "#C9A44C", marginBottom: "8px" },
  cardDate: { fontSize: "11px", color: "#444" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#111", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "32px", width: "500px", maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "6px" },
  modalSub: { fontSize: "13px", color: "#666", marginBottom: "20px" },
  modalError: { fontSize: "13px", color: "#f87171", background: "#3b0f0f", padding: "8px 12px", borderRadius: "6px", marginBottom: "16px" },
  label: { display: "block", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", marginTop: "14px" },
  input: { width: "100%", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#e5e5e5", fontSize: "13px", padding: "10px 12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  cancelBtn: { flex: 1, padding: "10px", background: "transparent", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#888", fontSize: "13px", cursor: "pointer" },
  submitBtn: { flex: 2, padding: "10px", background: "#C9A44C", border: "none", borderRadius: "8px", color: "#0a0a08", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
};
