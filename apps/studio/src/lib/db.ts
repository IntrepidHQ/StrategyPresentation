// ============================================================
//  SP Studio — Supabase DB Client
//  apps/studio/src/lib/db.ts
// ============================================================

import { createClient } from "@supabase/supabase-js";
import type {
  StrategyRecord,
  EditHistoryRecord,
  StrategyNarrative,
  WCSReport,
  StrategyTier,
  StrategyStatus,
  StrategyCardVM,
} from "./types";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ── strategies ────────────────────────────────────────────────

export async function createStrategy(params: {
  clientName: string;
  clientSlug: string;
  tier: StrategyTier;
  wcsReport: WCSReport;
  gatePassword?: string;
  gateSignedDate?: string;
}): Promise<StrategyRecord> {
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
    })
    .select()
    .single();

  if (error) throw new Error(`DB createStrategy: ${error.message}`);
  return data as StrategyRecord;
}

export async function getStrategy(id: string): Promise<StrategyRecord | null> {
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
