"use client";

// ============================================================
//  SP Studio — Strategy Editor
//  apps/studio/src/app/studio/[id]/page.tsx
//
//  The Lovable-style local editor. Hans only. localhost:3001.
//  Left: prompt input + edit history
//  Right: live iframe preview
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface EditRecord {
  id: string;
  prompt: string;
  tokensUsed: number | null;
  createdAt: string;
}

interface TokenUsage {
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
}

interface StrategyMeta {
  id: string;
  clientName: string;
  clientSlug: string;
  tier: string;
  status: string;
  overallScore: number;
  overallGrade: string;
  domain: string;
  gatePassword: string | null;
  vercelUrl: string | null;
}

const PASSPHRASE = process.env.NEXT_PUBLIC_STUDIO_PASSPHRASE ?? "";

function authHeader() {
  return { "x-studio-passphrase": PASSPHRASE };
}

export default function StudioEditor() {
  const params = useParams();
  const id = params.id as string;

  const [meta, setMeta] = useState<StrategyMeta | null>(null);
  const [currentHtml, setCurrentHtml] = useState<string>("");
  const [editHistory, setEditHistory] = useState<EditRecord[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<"phase_1" | "phase_2" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPublishChecklist, setShowPublishChecklist] = useState(false);
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({});

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // ── Load strategy ─────────────────────────────────────────
  useEffect(() => {
    fetchStrategy();
    fetchEditHistory();
  }, [id]);

  async function fetchStrategy() {
    const res = await fetch(`/api/strategy/${id}`, {
      headers: authHeader(),
    });
    if (!res.ok) {
      setError("Failed to load strategy");
      return;
    }
    const data = await res.json();
    setMeta(data.meta);
    if (data.html) {
      setCurrentHtml(data.html);
      updateIframeHtml(data.html);
    }
  }

  async function fetchEditHistory() {
    const res = await fetch(`/api/edit-history/${id}`, {
      headers: authHeader(),
    });
    if (!res.ok) return;
    const data = await res.json();
    setEditHistory(data.edits ?? []);
  }

  // ── iframe hot reload ─────────────────────────────────────
  const updateIframeHtml = useCallback((html: string) => {
    if (!iframeRef.current) return;

    // Revoke previous blob URL to avoid memory leak
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    iframeRef.current.src = url;
  }, []);

  // ── Generate HTML ─────────────────────────────────────────
  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: id }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccessMsg(`Generated — ${formatUsage(data.usage)} · ${formatCost(data.costUSD)}`);
      await fetchStrategy();
    } catch (e) {
      setError(String(e));
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Submit edit prompt ────────────────────────────────────
  async function handleEdit() {
    if (!prompt.trim() || isEditing) return;
    setIsEditing(true);
    setError(null);

    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: id, prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      setCurrentHtml(data.html);
      updateIframeHtml(data.html);
      setPrompt("");
      await fetchEditHistory();
      setSuccessMsg(`Edit applied — ${formatUsage(data.usage)} · ${formatCost(data.costUSD)}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsEditing(false);
      promptRef.current?.focus();
    }
  }

  async function handleApprove() {
    setIsApproving(true);
    setError(null);
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: id }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccessMsg("Approved — checkout is ready");
      await fetchStrategy();
    } catch (e) {
      setError(String(e));
    } finally {
      setIsApproving(false);
    }
  }

  async function handleCheckout(phase: "phase_1" | "phase_2") {
    setIsCheckingOut(phase);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: id, phase }),
      });
      const data = await res.json();
      if (!data.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(String(e));
      setIsCheckingOut(null);
    }
  }

  // ── Undo ─────────────────────────────────────────────────
  async function handleUndo() {
    const res = await fetch(`/api/edit?strategyId=${id}&steps=1`, {
      method: "DELETE",
      headers: authHeader(),
    });
    const data = await res.json();
    if (!data.ok) {
      setError("Nothing to undo");
      return;
    }
    setCurrentHtml(data.html);
    updateIframeHtml(data.html);
    await fetchEditHistory();
    setSuccessMsg("Undone");
  }

  // ── Publish ───────────────────────────────────────────────
  async function handlePublish() {
    setIsPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: id }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.issues?.join(", ") ?? data.error);
      setSuccessMsg(`Live at ${data.url}`);
      setShowPublishChecklist(false);
      await fetchStrategy();
    } catch (e) {
      setError(String(e));
    } finally {
      setIsPublishing(false);
    }
  }

  // ── Keyboard shortcut: Cmd+Enter to submit ────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleEdit();
    }
  }

  // ── Checklist items ───────────────────────────────────────
  const CHECKLIST = [
    { key: "password", label: `Gate password is set (${meta?.gatePassword ?? "—"})` },
    { key: "client", label: `Client name is correct: "${meta?.clientName}"` },
    { key: "score", label: `Score verified against WCS scan (${meta?.overallScore} / ${meta?.overallGrade})` },
    { key: "nda", label: "NDA signed date is correct in the gate" },
    { key: "investment", label: "Investment section reviewed and approved" },
    { key: "no_tokens", label: 'No unreplaced {{tokens}} visible in preview' },
  ];

  const allChecked = CHECKLIST.every((c) => checklistDone[c.key]);

  // ── Auto-dismiss success ──────────────────────────────────
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  if (!meta) {
    return (
      <div style={styles.loading}>
        <p>Loading strategy...</p>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* ── Top bar ────────────────────────────────────────── */}
      <header style={styles.topbar}>
        <div style={styles.topbarLeft}>
          <Link href="/" style={styles.backLink}>← Dashboard</Link>
          <span style={styles.topbarDivider}>|</span>
          <span style={styles.clientName}>{meta.clientName}</span>
          <span style={styles.tierBadge}>{meta.tier}</span>
          <span style={statusBadgeStyle(meta.status)}>{meta.status}</span>
        </div>
        <div style={styles.topbarRight}>
          <span style={styles.domain}>{meta.domain}</span>
          <span style={styles.scoreChip}>{meta.overallScore} / {meta.overallGrade}</span>
          {meta.vercelUrl && (
            <a href={meta.vercelUrl} target="_blank" rel="noreferrer" style={styles.liveLink}>
              View Live ↗
            </a>
          )}
        </div>
      </header>

      {/* ── Status bar ─────────────────────────────────────── */}
      {(error || successMsg) && (
        <div style={error ? styles.errorBar : styles.successBar}>
          {error ?? successMsg}
          <button onClick={() => { setError(null); setSuccessMsg(null); }} style={styles.dismissBtn}>×</button>
        </div>
      )}

      {/* ── Main layout ────────────────────────────────────── */}
      <div style={styles.main}>

        {/* ── Left: Editor pane ──────────────────────────── */}
        <aside style={styles.editorPane}>

          {/* Generate button (if no HTML yet) */}
          {!currentHtml && (
            <div style={styles.generateSection}>
              <p style={styles.generateHint}>No HTML yet. Generate the strategy first.</p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={styles.generateBtn}
              >
                {isGenerating ? "Generating… (1-2 min)" : "⚡ Generate Strategy"}
              </button>
            </div>
          )}

          {/* Prompt box */}
          {currentHtml && (
            <>
              <div style={styles.promptSection}>
                <label style={styles.promptLabel}>Tell Claude what to change</label>
                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`e.g. "Make the hero headline larger"\n"Change the accent color to navy"\n"Add a testimonial from Matt Price in section 3"`}
                  style={styles.promptTextarea}
                  rows={5}
                  disabled={isEditing}
                />
                <div style={styles.promptActions}>
                  <button
                    onClick={handleUndo}
                    disabled={isEditing || editHistory.length === 0}
                    style={styles.undoBtn}
                    title="Undo last edit"
                  >
                    ↩ Undo
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={!prompt.trim() || isEditing}
                    style={styles.sendBtn}
                  >
                    {isEditing ? "Editing…" : "Send ⌘↩"}
                  </button>
                </div>
              </div>

              {/* Publish section */}
              <div style={styles.publishSection}>
                {!showPublishChecklist ? (
                  <button
                    onClick={() => setShowPublishChecklist(true)}
                    style={styles.publishBtn}
                  >
                    Publish →
                  </button>
                ) : (
                  <div style={styles.checklist}>
                    <p style={styles.checklistTitle}>Pre-publish checklist</p>
                    {CHECKLIST.map((c) => (
                      <label key={c.key} style={styles.checklistItem}>
                        <input
                          type="checkbox"
                          checked={!!checklistDone[c.key]}
                          onChange={(e) =>
                            setChecklistDone((prev) => ({
                              ...prev,
                              [c.key]: e.target.checked,
                            }))
                          }
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                    <button
                      onClick={handlePublish}
                      disabled={!allChecked || isPublishing}
                      style={{
                        ...styles.publishConfirmBtn,
                        opacity: allChecked ? 1 : 0.4,
                      }}
                    >
                      {isPublishing ? "Publishing…" : `Publish to ${meta.clientSlug}.strategypresentation.com`}
                    </button>
                    <button
                      onClick={() => setShowPublishChecklist(false)}
                      style={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div style={styles.checkoutSection}>
                <p style={styles.checklistTitle}>Approval + checkout</p>
                <p style={styles.checkoutHint}>
                  Publish first, then approve the strategy before creating a Stripe checkout link.
                </p>
                <button
                  onClick={handleApprove}
                  disabled={isApproving || !["published", "approved"].includes(meta.status)}
                  style={{
                    ...styles.approveBtn,
                    opacity: ["published", "approved"].includes(meta.status) ? 1 : 0.4,
                  }}
                >
                  {meta.status === "approved" ? "Approved" : isApproving ? "Approving…" : "Approve strategy"}
                </button>
                <div style={styles.checkoutButtons}>
                  <button
                    onClick={() => handleCheckout("phase_1")}
                    disabled={meta.status !== "approved" || isCheckingOut !== null}
                    style={{
                      ...styles.checkoutBtn,
                      opacity: meta.status === "approved" ? 1 : 0.4,
                    }}
                  >
                    {isCheckingOut === "phase_1" ? "Opening…" : "Phase 1 · $6,000"}
                  </button>
                  <button
                    onClick={() => handleCheckout("phase_2")}
                    disabled={meta.status !== "approved" || isCheckingOut !== null}
                    style={{
                      ...styles.checkoutBtnSecondary,
                      opacity: meta.status === "approved" ? 1 : 0.4,
                    }}
                  >
                    {isCheckingOut === "phase_2" ? "Opening…" : "Phase 2 · $4,500"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Edit history */}
          {editHistory.length > 0 && (
            <div style={styles.historySection}>
              <p style={styles.historyTitle}>Edit history</p>
              {editHistory.map((edit) => (
                <div key={edit.id} style={styles.historyItem}>
                  <span style={styles.historyTime}>
                    {new Date(edit.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span style={styles.historyPrompt}>
                    {edit.prompt.slice(0, 60)}{edit.prompt.length > 60 ? "…" : ""}
                  </span>
                  {edit.tokensUsed && (
                    <span style={styles.historyTokens}>{edit.tokensUsed.toLocaleString()} tok</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── Right: iframe preview ──────────────────────── */}
        <main style={styles.previewPane}>
          {currentHtml ? (
            <iframe
              ref={iframeRef}
              style={styles.iframe}
              title="Strategy Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div style={styles.emptyPreview}>
              <p>Preview appears here after generation.</p>
            </div>
          )}
        </main>
      </div>

      {/* Publishing overlay */}
      {isPublishing && (
        <div style={styles.publishingOverlay}>
          <p>Deploying to Vercel…</p>
        </div>
      )}
    </div>
  );
}

// ── Status badge color ────────────────────────────────────────
function statusBadgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, string> = {
    draft: "#6b7280",
    generating: "#f59e0b",
    generated: "#3b82f6",
    review: "#8b5cf6",
    published: "#10b981",
    approved: "#22c55e",
    paid: "#14b8a6",
    project_created: "#06b6d4",
    delivered: "#a3e635",
  };
  return {
    ...styles.statusBadge,
    background: colors[status] ?? "#6b7280",
  };
}

// ── Styles (CSS-in-JS, dark theme) ───────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0a0a0a",
    color: "#e5e5e5",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: "14px",
    overflow: "hidden",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#0a0a0a",
    color: "#888",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    height: "48px",
    borderBottom: "1px solid #1e1e1e",
    background: "#111",
    flexShrink: 0,
  },
  topbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  backLink: {
    color: "#888",
    textDecoration: "none",
    fontSize: "13px",
  },
  topbarDivider: {
    color: "#333",
  },
  clientName: {
    fontWeight: 600,
    color: "#fff",
  },
  tierBadge: {
    fontSize: "11px",
    padding: "2px 8px",
    background: "#1a1a2e",
    color: "#818cf8",
    borderRadius: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  statusBadge: {
    fontSize: "11px",
    padding: "2px 8px",
    color: "#fff",
    borderRadius: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  domain: {
    color: "#666",
    fontSize: "12px",
  },
  scoreChip: {
    fontSize: "12px",
    padding: "2px 8px",
    background: "#1a2e1a",
    color: "#4ade80",
    borderRadius: "4px",
    fontWeight: 600,
  },
  liveLink: {
    fontSize: "12px",
    color: "#C9A44C",
    textDecoration: "none",
  },
  errorBar: {
    padding: "10px 20px",
    background: "#3b0f0f",
    color: "#f87171",
    fontSize: "13px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  },
  successBar: {
    padding: "10px 20px",
    background: "#0f2b1a",
    color: "#4ade80",
    fontSize: "13px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  },
  dismissBtn: {
    background: "none",
    border: "none",
    color: "inherit",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: 1,
    padding: "0 4px",
  },
  main: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  editorPane: {
    width: "320px",
    flexShrink: 0,
    borderRight: "1px solid #1e1e1e",
    background: "#111",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  generateSection: {
    padding: "20px",
    borderBottom: "1px solid #1e1e1e",
  },
  generateHint: {
    color: "#666",
    fontSize: "13px",
    marginBottom: "12px",
  },
  generateBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "#C9A44C",
    color: "#0a0a08",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  promptSection: {
    padding: "16px",
    borderBottom: "1px solid #1e1e1e",
  },
  promptLabel: {
    display: "block",
    fontSize: "11px",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "8px",
  },
  promptTextarea: {
    width: "100%",
    background: "#0a0a0a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#e5e5e5",
    fontSize: "13px",
    padding: "10px 12px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.5,
    boxSizing: "border-box",
  },
  promptActions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  undoBtn: {
    padding: "8px 12px",
    background: "transparent",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    color: "#888",
    fontSize: "13px",
    cursor: "pointer",
  },
  sendBtn: {
    flex: 1,
    padding: "8px 12px",
    background: "#C9A44C",
    border: "none",
    borderRadius: "6px",
    color: "#0a0a08",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  publishSection: {
    padding: "16px",
    borderBottom: "1px solid #1e1e1e",
  },
  publishBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "transparent",
    border: "1px solid #10b981",
    borderRadius: "8px",
    color: "#10b981",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  checklist: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  checklistTitle: {
    fontSize: "11px",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "4px",
  },
  checklistItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "12px",
    color: "#ccc",
    cursor: "pointer",
  },
  publishConfirmBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "#10b981",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "8px",
  },
  cancelBtn: {
    width: "100%",
    padding: "6px",
    background: "transparent",
    border: "none",
    color: "#666",
    fontSize: "12px",
    cursor: "pointer",
  },
  checkoutSection: {
    padding: "16px",
    borderBottom: "1px solid #1e1e1e",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  checkoutHint: {
    color: "#777",
    fontSize: "12px",
    lineHeight: 1.5,
    margin: 0,
  },
  approveBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "#22c55e",
    border: "none",
    borderRadius: "8px",
    color: "#07110a",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  checkoutButtons: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
  },
  checkoutBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "#C9A44C",
    border: "none",
    borderRadius: "8px",
    color: "#0a0a08",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  checkoutBtnSecondary: {
    width: "100%",
    padding: "10px 16px",
    background: "transparent",
    border: "1px solid #C9A44C",
    borderRadius: "8px",
    color: "#C9A44C",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  historySection: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px",
  },
  historyTitle: {
    fontSize: "11px",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "10px",
  },
  historyItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "6px 0",
    borderBottom: "1px solid #1a1a1a",
  },
  historyTime: {
    fontSize: "11px",
    color: "#555",
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
    paddingTop: "1px",
  },
  historyPrompt: {
    fontSize: "12px",
    color: "#888",
    flex: 1,
    lineHeight: 1.4,
  },
  historyTokens: {
    fontSize: "10px",
    color: "#444",
    flexShrink: 0,
  },
  previewPane: {
    flex: 1,
    overflow: "hidden",
    background: "#000",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },
  emptyPreview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#333",
    fontSize: "14px",
  },
  publishingOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#10b981",
    fontSize: "18px",
    fontWeight: 600,
    zIndex: 9999,
  },
};

function formatUsage(usage?: TokenUsage): string {
  if (!usage) return "token usage unavailable";
  const total = usage.input + usage.output + usage.cacheCreate + usage.cacheRead;
  return `${total.toLocaleString()} tokens`;
}

function formatCost(cost?: number): string {
  return typeof cost === "number" ? `$${cost.toFixed(4)}` : "cost unavailable";
}
