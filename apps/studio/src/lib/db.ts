// ============================================================
//  SP Studio — Supabase DB Client
//  apps/studio/src/lib/db.ts
//
//  SP shares ONE Supabase project with WCS and Brainztem
//  (IntrepidHQ's Project, xeaeiowwodppqhswotsx) rather than
//  running its own — SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are
//  that project's own values. Own schema, own lane: `sp` (mirrors
//  `public` for WCS and `brainztem` for Brainztem). Full bootstrap
//  SQL: supabase/sp-studio-schema.sql.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  StrategyRecord,
  EditHistoryRecord,
  StrategyNarrative,
  WCSReport,
  StrategyTier,
  StrategyStatus,
  StrategyCardVM,
} from "./types";

interface LocalState {
  strategies: StrategyRecord[];
  editHistory: EditHistoryRecord[];
}

// Accept NEXT_PUBLIC_SUPABASE_URL as an alias — WCS and Brainztem env
// templates use that name, so a key pasted from either "just works" here.
// (The URL is not actually a secret; only the service-role key is.)
export function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}
export function supabaseServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

function shouldUseLocalStore() {
  return (
    process.env.NODE_ENV === "development" &&
    (!supabaseUrl() || !supabaseServiceKey())
  );
}

function getClient() {
  const url = supabaseUrl();
  const key = supabaseServiceKey();
  if (!url || !key) {
    throw new Error("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  // Pinned to "sp" — the shared project's schemas are otherwise ambiguous
  // (the client's default "public" schema belongs to WCS here).
  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "sp" },
  });
}

function localStorePath() {
  return (
    process.env.SP_STUDIO_LOCAL_DB_PATH ??
    path.join(/* turbopackIgnore: true */ process.cwd(), ".sp-studio.local.json")
  );
}

async function readLocalState(): Promise<LocalState> {
  try {
    const raw = await readFile(localStorePath(), "utf-8");
    return JSON.parse(raw) as LocalState;
  } catch {
    return { strategies: [], editHistory: [] };
  }
}

async function writeLocalState(state: LocalState): Promise<void> {
  const file = localStorePath();
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(state, null, 2));
  await rename(tmp, file);
}

function toCard(row: StrategyRecord): StrategyCardVM {
  return {
    id: row.id,
    clientName: row.client_name,
    clientSlug: row.client_slug,
    tier: row.tier,
    status: row.status,
    overallScore: row.wcs_report.overall.score,
    overallGrade: row.wcs_report.overall.grade,
    domain: row.wcs_report.domain,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    vercelUrl: row.vercel_url,
  };
}

// ── strategies ────────────────────────────────────────────────

export async function createStrategy(params: {
  clientName: string;
  clientSlug: string;
  tier: StrategyTier;
  wcsReport: WCSReport;
  templateId?: string;
  source?: StrategyRecord["source"];
  sandboxToken?: string;
  gatePassword?: string;
  gateSignedDate?: string;
}): Promise<StrategyRecord> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    const now = new Date().toISOString();
    const strategy: StrategyRecord = {
      id: randomUUID(),
      client_name: params.clientName,
      client_slug: params.clientSlug,
      tier: params.tier,
      wcs_report: params.wcsReport,
      narrative: null,
      current_html: null,
      gate_password: params.gatePassword ?? generatePassword(params.clientSlug),
      gate_signed_date: params.gateSignedDate ?? formatTodayDate(),
      status: "draft",
      published_at: null,
      vercel_url: null,
      vercel_deploy_id: null,
      template_id: params.templateId ?? null,
      source: params.source ?? null,
      sandbox_token: params.sandboxToken ?? null,
      created_at: now,
      updated_at: now,
    };
    state.strategies.push(strategy);
    await writeLocalState(state);
    return strategy;
  }

  const sb = getClient();
  const { data, error } = await sb
    .from("strategies")
    .insert({
      client_name: params.clientName,
      client_slug: params.clientSlug,
      tier: params.tier,
      wcs_report: params.wcsReport,
      gate_password: params.gatePassword ?? generatePassword(params.clientSlug),
      gate_signed_date: params.gateSignedDate ?? formatTodayDate(),
      status: "draft",
      // Requires migration 002_strategy_deck_fields.sql; only sent when set so
      // legacy WCS payloads keep working against an un-migrated database.
      ...(params.templateId ? { template_id: params.templateId } : {}),
      ...(params.source ? { source: params.source } : {}),
      ...(params.sandboxToken ? { sandbox_token: params.sandboxToken } : {}),
    })
    .select()
    .single();

  if (error) throw new Error(`DB createStrategy: ${error.message}`);
  return data as StrategyRecord;
}

export async function getStrategy(id: string): Promise<StrategyRecord | null> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    return state.strategies.find((strategy) => strategy.id === id) ?? null;
  }

  const sb = getClient();
  const { data, error } = await sb
    .from("strategies")
    .select("*")
    .eq("id", id)
    .single();

  if (error?.code === "PGRST116") return null; // not found
  if (error) throw new Error(`DB getStrategy: ${error.message}`);
  return data as StrategyRecord;
}

export async function getStrategyBySlug(slug: string): Promise<StrategyRecord | null> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    return state.strategies.find((strategy) => strategy.client_slug === slug) ?? null;
  }

  const sb = getClient();
  const { data, error } = await sb
    .from("strategies")
    .select("*")
    .eq("client_slug", slug)
    .single();

  if (error?.code === "PGRST116") return null;
  if (error) throw new Error(`DB getStrategyBySlug: ${error.message}`);
  return data as StrategyRecord;
}

export async function listStrategies(): Promise<StrategyCardVM[]> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    return state.strategies
      .toSorted((a, b) => b.created_at.localeCompare(a.created_at))
      .map(toCard);
  }

  const sb = getClient();
  const { data, error } = await sb
    .from("strategies")
    .select("id, client_name, client_slug, tier, status, wcs_report, created_at, published_at, vercel_url")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`DB listStrategies: ${error.message}`);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const report = row.wcs_report as WCSReport;
    return {
      id: row.id as string,
      clientName: row.client_name as string,
      clientSlug: row.client_slug as string,
      tier: row.tier as StrategyTier,
      status: row.status as StrategyStatus,
      overallScore: report.overall.score,
      overallGrade: report.overall.grade,
      domain: report.domain,
      createdAt: row.created_at as string,
      publishedAt: row.published_at as string | null,
      vercelUrl: row.vercel_url as string | null,
    };
  });
}

export async function updateStrategyNarrative(
  id: string,
  narrative: StrategyNarrative
): Promise<void> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    const strategy = state.strategies.find((item) => item.id === id);
    if (!strategy) throw new Error("DB updateStrategyNarrative: strategy not found");
    strategy.narrative = narrative;
    strategy.status = "generated";
    strategy.updated_at = new Date().toISOString();
    await writeLocalState(state);
    return;
  }

  const sb = getClient();
  const { error } = await sb
    .from("strategies")
    .update({ narrative, status: "generated" })
    .eq("id", id);

  if (error) throw new Error(`DB updateStrategyNarrative: ${error.message}`);
}

export async function updateStrategyHTML(
  id: string,
  html: string,
  status?: StrategyStatus
): Promise<void> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    const strategy = state.strategies.find((item) => item.id === id);
    if (!strategy) throw new Error("DB updateStrategyHTML: strategy not found");
    strategy.current_html = html;
    if (status) strategy.status = status;
    strategy.updated_at = new Date().toISOString();
    await writeLocalState(state);
    return;
  }

  const sb = getClient();
  const update: Record<string, unknown> = { current_html: html };
  if (status) update.status = status;

  const { error } = await sb.from("strategies").update(update).eq("id", id);
  if (error) throw new Error(`DB updateStrategyHTML: ${error.message}`);
}

export async function updateStrategyStatus(
  id: string,
  status: StrategyStatus
): Promise<void> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    const strategy = state.strategies.find((item) => item.id === id);
    if (!strategy) throw new Error("DB updateStrategyStatus: strategy not found");
    strategy.status = status;
    strategy.updated_at = new Date().toISOString();
    await writeLocalState(state);
    return;
  }

  const sb = getClient();
  const { error } = await sb
    .from("strategies")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(`DB updateStrategyStatus: ${error.message}`);
}

export async function markStrategyPublished(
  id: string,
  vercelUrl: string,
  vercelDeployId: string
): Promise<void> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    const strategy = state.strategies.find((item) => item.id === id);
    if (!strategy) throw new Error("DB markStrategyPublished: strategy not found");
    strategy.status = "published";
    strategy.published_at = new Date().toISOString();
    strategy.vercel_url = vercelUrl;
    strategy.vercel_deploy_id = vercelDeployId;
    strategy.updated_at = new Date().toISOString();
    await writeLocalState(state);
    return;
  }

  const sb = getClient();
  const { error } = await sb
    .from("strategies")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      vercel_url: vercelUrl,
      vercel_deploy_id: vercelDeployId,
    })
    .eq("id", id);

  if (error) throw new Error(`DB markStrategyPublished: ${error.message}`);
}

// ── edit_history ──────────────────────────────────────────────

export async function saveEditHistory(params: {
  strategyId: string;
  prompt: string;
  htmlBefore: string;
  htmlAfter: string;
  tokensUsed?: number;
  model?: string;
}): Promise<EditHistoryRecord> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    const edit: EditHistoryRecord = {
      id: randomUUID(),
      strategy_id: params.strategyId,
      prompt: params.prompt,
      html_before: params.htmlBefore,
      html_after: params.htmlAfter,
      tokens_used: params.tokensUsed ?? null,
      model: params.model ?? null,
      created_at: new Date().toISOString(),
    };
    state.editHistory.push(edit);
    await writeLocalState(state);
    return edit;
  }

  const sb = getClient();
  const { data, error } = await sb
    .from("edit_history")
    .insert({
      strategy_id: params.strategyId,
      prompt: params.prompt,
      html_before: params.htmlBefore,
      html_after: params.htmlAfter,
      tokens_used: params.tokensUsed ?? null,
      model: params.model ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`DB saveEditHistory: ${error.message}`);
  return data as EditHistoryRecord;
}

export async function getEditHistory(strategyId: string): Promise<EditHistoryRecord[]> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    return state.editHistory
      .filter((edit) => edit.strategy_id === strategyId)
      .toSorted((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50);
  }

  const sb = getClient();
  const { data, error } = await sb
    .from("edit_history")
    .select("*")
    .eq("strategy_id", strategyId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`DB getEditHistory: ${error.message}`);
  return (data ?? []) as EditHistoryRecord[];
}

// Get the HTML from Nth edit back (for undo)
export async function getEditAtOffset(
  strategyId: string,
  offset: number // 1 = one step back
): Promise<string | null> {
  if (shouldUseLocalStore()) {
    const state = await readLocalState();
    const edit = state.editHistory
      .filter((item) => item.strategy_id === strategyId)
      .toSorted((a, b) => b.created_at.localeCompare(a.created_at))[offset - 1];
    return edit?.html_before ?? null;
  }

  const sb = getClient();
  const { data, error } = await sb
    .from("edit_history")
    .select("html_before")
    .eq("strategy_id", strategyId)
    .order("created_at", { ascending: false })
    .range(offset - 1, offset - 1)
    .single();

  if (error) return null;
  return (data as EditHistoryRecord)?.html_before ?? null;
}

// ── Helpers ───────────────────────────────────────────────────

function generatePassword(slug: string): string {
  const year = new Date().getFullYear();
  return `${capitalize(slug)}${year}`;
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
