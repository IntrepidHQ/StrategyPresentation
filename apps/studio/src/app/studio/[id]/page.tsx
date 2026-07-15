"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface EditRecord {
  id: string;
  prompt: string;
  tokensUsed: number | null;
  createdAt: string;
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

const PREVIEW_STORAGE_SHIM = `<script>
(function () {
  var store = {};
  try {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: function (key) {
          return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
        },
        setItem: function (key, value) {
          store[key] = String(value);
        },
        removeItem: function (key) {
          delete store[key];
        },
        clear: function () {
          store = {};
        }
      }
    });
  } catch (error) {}
})();
<\/script>`;

// Auth rides on the HttpOnly sp_studio_session cookie; no header needed.
function authHeader(): Record<string, string> {
  return {};
}

export default function StudioEditor() {
  const params = useParams();
  const id = params.id as string;

  const [meta, setMeta] = useState<StrategyMeta | null>(null);
  const [currentHtml, setCurrentHtml] = useState("");
  const [editHistory, setEditHistory] = useState<EditRecord[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateChoice, setTemplateChoice] = useState("signal");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPublishChecklist, setShowPublishChecklist] = useState(false);
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({});

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const previewHtml = useMemo(() => buildPreviewHtml(currentHtml), [currentHtml]);

  useEffect(() => {
    fetchStrategy();
    fetchEditHistory();
  }, [id]);

  useEffect(() => {
    if (!successMsg) return;
    const timeout = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timeout);
  }, [successMsg]);

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

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(
          templateChoice === "legacy"
            ? { strategyId: id, engine: "legacy" }
            : { strategyId: id, engine: "deck", templateId: templateChoice },
        ),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccessMsg(`Generated with ${data.pass1Tokens?.toLocaleString() ?? "local"} tokens`);
      await fetchStrategy();
    } catch (e) {
      setError(String(e));
    } finally {
      setIsGenerating(false);
    }
  }

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
      setPrompt("");
      await fetchEditHistory();
      setSuccessMsg(`Edit applied with ${data.tokensUsed?.toLocaleString() ?? "local"} tokens`);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsEditing(false);
      promptRef.current?.focus();
    }
  }

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
    await fetchEditHistory();
    setSuccessMsg("Last edit undone");
  }

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

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleEdit();
    }
  }

  if (!meta) {
    return (
      <div className="loading-state">
        <p className="empty-title">Loading strategy...</p>
      </div>
    );
  }

  const checklist = getChecklist(meta);
  const allChecked = checklist.every((item) => checklistDone[item.key]);

  return (
    <div className="editor-root">
      <header className="editor-topbar">
        <div className="topbar-left">
          <Link className="back-link" href="/">
            Dashboard
          </Link>
          <span className="topbar-divider" aria-hidden="true" />
          <span className="organization-title">{meta.clientName}</span>
          <span className="tier-pill">{meta.tier}</span>
          <span className={`status-pill status-${meta.status}`}>{meta.status}</span>
        </div>
        <div className="topbar-right">
          <span className="domain-text">{meta.domain}</span>
          <span className="score-pill">
            {meta.overallScore} / {meta.overallGrade}
          </span>
          {meta.vercelUrl && (
            <a className="btn btn-secondary" href={meta.vercelUrl} rel="noreferrer" target="_blank">
              View live
            </a>
          )}
        </div>
      </header>

      {(error || successMsg) && (
        <div className={`notice-bar ${error ? "notice-error" : "notice-success"}`}>
          <span>{error ?? successMsg}</span>
          <button
            aria-label="Dismiss notice"
            className="notice-close"
            onClick={() => {
              setError(null);
              setSuccessMsg(null);
            }}
            type="button"
          >
            x
          </button>
        </div>
      )}

      <div className="editor-main">
        <aside className="editor-sidebar">
          {!currentHtml && (
            <section className="editor-panel">
              <p className="panel-title">Generate presentation</p>
              <p className="panel-copy">
                No HTML exists for this scan yet. Generate the first strategy draft from the WCS data.
              </p>
              <label>
                <span className="field-label">Template</span>
                <select
                  className="select"
                  disabled={isGenerating}
                  onChange={(event) => setTemplateChoice(event.target.value)}
                  value={templateChoice}
                >
                  <option value="signal">Signal — dark modern SaaS</option>
                  <option value="summit">Summit — light boardroom</option>
                  <option value="editorial">Editorial — magazine</option>
                  <option value="monospace">Monospace — technical</option>
                  <option value="gallery">Gallery — airy minimal</option>
                  <option value="beacon">Beacon — warm nonprofit</option>
                  <option value="legacy">Legacy — scroll page</option>
                </select>
              </label>
              <button
                className="btn btn-primary btn-block"
                disabled={isGenerating}
                onClick={handleGenerate}
                type="button"
              >
                {isGenerating ? "Generating..." : "Generate Strategy"}
              </button>
            </section>
          )}

          {currentHtml && (
            <>
              <section className="editor-panel">
                <label>
                  <span className="field-label">Edit instruction</span>
                  <textarea
                    className="textarea prompt-textarea"
                    disabled={isEditing}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      "Tighten the Google Ad Grant section around the $120K opportunity.\nMake the executive summary more direct.\nReduce the investment options to two tiers."
                    }
                    ref={promptRef}
                    rows={5}
                    value={prompt}
                  />
                </label>
                <div className="prompt-actions">
                  <button
                    className="btn btn-secondary"
                    disabled={isEditing || editHistory.length === 0}
                    onClick={handleUndo}
                    title="Undo last edit"
                    type="button"
                  >
                    Undo
                  </button>
                  <button
                    className="btn btn-primary btn-block"
                    disabled={!prompt.trim() || isEditing}
                    onClick={handleEdit}
                    type="button"
                  >
                    {isEditing ? "Applying..." : "Apply Edit"}
                  </button>
                </div>
              </section>

              <section className="editor-panel">
                {!showPublishChecklist ? (
                  <button
                    className="btn btn-success btn-block"
                    onClick={() => setShowPublishChecklist(true)}
                    type="button"
                  >
                    Publish
                  </button>
                ) : (
                  <div className="publish-checklist">
                    <p className="panel-title">Pre-publish checklist</p>
                    {checklist.map((item) => (
                      <label className="checklist-row" key={item.key}>
                        <input
                          checked={!!checklistDone[item.key]}
                          onChange={(event) =>
                            setChecklistDone((prev) => ({
                              ...prev,
                              [item.key]: event.target.checked,
                            }))
                          }
                          type="checkbox"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                    <button
                      className="btn btn-success btn-block"
                      disabled={!allChecked || isPublishing}
                      onClick={handlePublish}
                      type="button"
                    >
                      {isPublishing
                        ? "Publishing..."
                        : `Publish to ${meta.clientSlug}.strategypresentation.com`}
                    </button>
                    <button
                      className="btn btn-ghost btn-block"
                      onClick={() => setShowPublishChecklist(false)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          {editHistory.length > 0 && (
            <section className="history-section">
              <p className="panel-title">Edit history</p>
              <div className="history-list">
                {editHistory.map((edit) => (
                  <div className="history-item" key={edit.id}>
                    <span className="history-time">
                      {new Date(edit.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <p className="history-prompt">
                      {edit.prompt.slice(0, 80)}
                      {edit.prompt.length > 80 ? "..." : ""}
                    </p>
                    {edit.tokensUsed && (
                      <span className="history-tokens">{edit.tokensUsed.toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        <main className="preview-workspace">
          <div className="preview-toolbar">
            <p className="preview-title">Live preview</p>
            <div className="status-line">
              <span className="domain-text">{meta.clientSlug}.strategypresentation.com</span>
            </div>
          </div>
          <div className="preview-shell">
            {previewHtml ? (
              <iframe
                className="preview-frame"
                sandbox="allow-scripts"
                srcDoc={previewHtml}
                title="Strategy presentation preview"
              />
            ) : (
              <div className="empty-preview">
                <p>Generate the presentation to load the preview.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {isPublishing && (
        <div className="publishing-overlay">
          <p>Deploying to Vercel...</p>
        </div>
      )}
    </div>
  );
}

function buildPreviewHtml(html: string) {
  if (!html) return "";
  if (html.includes("<head>")) return html.replace("<head>", `<head>${PREVIEW_STORAGE_SHIM}`);
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/(<html[^>]*>)/i, `$1${PREVIEW_STORAGE_SHIM}`);
  }
  return `${PREVIEW_STORAGE_SHIM}${html}`;
}

function getChecklist(meta: StrategyMeta) {
  return [
    { key: "password", label: `Gate password is set (${meta.gatePassword ?? "not set"})` },
    { key: "domain", label: `WCS scan domain matches ${meta.domain}` },
    {
      key: "score",
      label: `Score has been reviewed (${meta.overallScore} / ${meta.overallGrade})`,
    },
    {
      key: "grant",
      label:
        meta.tier === "nonprofit"
          ? "$120K Google Ad Grant section is accurate"
          : "Investment section is accurate",
    },
    { key: "tokens", label: "No unreplaced template tokens are visible" },
  ];
}
