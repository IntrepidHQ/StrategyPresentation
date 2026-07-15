"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StrategyCardVM, StrategyStatus, StrategyTier } from "@/lib/types";

const STATUS_LABELS: Record<StrategyStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  generated: "Generated",
  review: "Review",
  published: "Published",
};

type StatusFilter = "all" | StrategyStatus;

export default function Dashboard() {
  const [strategies, setStrategies] = useState<StrategyCardVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    async function loadStrategies() {
      try {
        // Auth rides on the HttpOnly sp_studio_session cookie.
        const res = await fetch("/api/strategies");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error ?? `Failed to load strategies (${res.status})`);
        }
        setStrategies(data.strategies ?? []);
      } catch (e) {
        setLoadError(String(e));
      } finally {
        setLoading(false);
      }
    }

    loadStrategies();
  }, []);

  const metrics = useMemo(() => {
    const reviewCount = strategies.filter((strategy) => strategy.status === "review").length;
    const publishedCount = strategies.filter((strategy) => strategy.status === "published").length;
    const averageScore =
      strategies.length === 0
        ? 0
        : Math.round(
            strategies.reduce((total, strategy) => total + strategy.overallScore, 0) /
              strategies.length,
          );

    return {
      total: strategies.length,
      reviewCount,
      publishedCount,
      averageScore,
    };
  }, [strategies]);

  const visibleStrategies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return strategies.filter((strategy) => {
      const matchesStatus = statusFilter === "all" || strategy.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        strategy.clientName.toLowerCase().includes(normalizedQuery) ||
        strategy.domain.toLowerCase().includes(normalizedQuery) ||
        strategy.clientSlug.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, strategies]);

  return (
    <div className="app-shell">
      <header className="studio-header">
        <div className="brand-lockup">
          <span className="brand-mark">SP</span>
          <div>
            <p className="brand-title">Strategy Presentation Studio</p>
            <p className="brand-subtitle">AbilitySC scan workspace</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowNew(true)} type="button">
            New Strategy
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-hero">
          <div>
            <p className="eyebrow">Studio Queue</p>
            <h1 className="dashboard-title">Build and review strategy scans.</h1>
            <p className="dashboard-copy">
              A focused review desk for turning WCS scan data into the private strategy presentation.
            </p>
          </div>
        </section>

        <section className="metric-grid" aria-label="Strategy metrics">
          <MetricCard label="Strategies" value={metrics.total} detail="Total records" />
          <MetricCard label="Review" value={metrics.reviewCount} detail="Ready to refine" />
          <MetricCard label="Published" value={metrics.publishedCount} detail="Live presentations" />
          <MetricCard
            label="Average WCS"
            value={metrics.averageScore || "--"}
            detail={metrics.total === 0 ? "No scans yet" : "Across active scans"}
          />
        </section>

        <section className="dashboard-toolbar" aria-label="Strategy filters">
          <input
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by organization or domain"
            type="search"
          />
          <div className="segmented-control" role="tablist" aria-label="Status filter">
            {(["all", "draft", "generated", "review", "published"] as StatusFilter[]).map(
              (status) => (
                <button
                  className={`segment ${statusFilter === status ? "segment-active" : ""}`}
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  type="button"
                >
                  {status === "all" ? "All" : STATUS_LABELS[status]}
                </button>
              ),
            )}
          </div>
        </section>

        {loading ? (
          <div className="empty-state">
            <p className="empty-title">Loading strategies...</p>
          </div>
        ) : loadError ? (
          <div className="empty-state">
            <div>
              <p className="empty-title">Studio setup needs attention.</p>
              <p className="empty-copy">{loadError}</p>
            </div>
          </div>
        ) : visibleStrategies.length === 0 ? (
          <div className="empty-state">
            <div>
              <p className="empty-title">No matching strategies.</p>
              <p className="empty-copy">
                Paste a WCS payload with the dev bypass header or adjust the current filters.
              </p>
            </div>
          </div>
        ) : (
          <section className="strategy-grid" aria-label="Strategies">
            {visibleStrategies.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </section>
        )}
      </main>

      {showNew && <NewStrategyModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <span className="metric-value">{value}</span>
      <span className="metric-detail">{detail}</span>
    </div>
  );
}

function StrategyCard({ strategy }: { strategy: StrategyCardVM }) {
  return (
    <Link className="strategy-card" href={`/studio/${strategy.id}`}>
      <div>
        <div className="card-topline">
          <h2 className="card-title">{strategy.clientName}</h2>
          <span className={`status-pill status-${strategy.status}`}>
            {STATUS_LABELS[strategy.status]}
          </span>
        </div>
        <p className="card-domain">{strategy.domain}</p>
        <div className="card-meta">
          <span className="score-pill">
            {strategy.overallScore} / {strategy.overallGrade}
          </span>
          <span className="tier-pill">{strategy.tier}</span>
        </div>
      </div>

      <div className="card-footer">
        <p className="next-action">{getNextAction(strategy)}</p>
        {strategy.vercelUrl && (
          <span className="date-line">{strategy.vercelUrl.replace("https://", "")}</span>
        )}
        <span className="date-line">
          Created {formatDate(strategy.createdAt)}
          {strategy.publishedAt ? ` | Published ${formatDate(strategy.publishedAt)}` : ""}
        </span>
      </div>
    </Link>
  );
}

function NewStrategyModal({ onClose }: { onClose: () => void }) {
  const [json, setJson] = useState("");
  const [clientName, setClientName] = useState("AbilitySC");
  const [clientSlug, setClientSlug] = useState("abilitysc");
  const [tier, setTier] = useState<StrategyTier>("nonprofit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      if (!data.ok) {
        throw new Error(data.error);
      }
      window.location.href = `/studio/${data.strategyId}`;
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-header">
          <p className="eyebrow">Import Scan</p>
          <h2 className="modal-title">New strategy</h2>
          <p className="modal-copy">Paste the WCS JSON and confirm the presentation slug.</p>
        </div>

        <div className="modal-body form-grid">
          {error && <div className="error-note">{error}</div>}

          <label>
            <span className="field-label">Organization name</span>
            <input
              className="field"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="AbilitySC"
              required
            />
          </label>

          <label>
            <span className="field-label">Presentation slug</span>
            <input
              className="field"
              value={clientSlug}
              onChange={(event) =>
                setClientSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="abilitysc"
              required
            />
          </label>

          <label>
            <span className="field-label">Tier</span>
            <select
              className="select"
              value={tier}
              onChange={(event) => setTier(event.target.value as StrategyTier)}
            >
              <option value="nonprofit">Nonprofit</option>
              <option value="standard">Standard</option>
            </select>
          </label>

          <label>
            <span className="field-label">WCS report JSON</span>
            <textarea
              className="textarea code-textarea"
              value={json}
              onChange={(event) => setJson(event.target.value)}
              placeholder='{"domain":"abilitysc.org","overall":{"score":72,"grade":"C+"}}'
              required
            />
          </label>

          <div className="modal-actions">
            <button className="btn btn-secondary btn-block" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="btn btn-primary btn-block"
              disabled={loading || !json.trim() || !clientName.trim() || !clientSlug.trim()}
              type="submit"
            >
              {loading ? "Creating..." : "Create Strategy"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function getNextAction(strategy: StrategyCardVM) {
  if (strategy.status === "draft") return "Generate presentation HTML.";
  if (strategy.status === "generating") return "Generation is in progress.";
  if (strategy.status === "generated") return "Review and refine the presentation.";
  if (strategy.status === "review") return "Ready for final review.";
  return "Published and available behind the gate.";
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
