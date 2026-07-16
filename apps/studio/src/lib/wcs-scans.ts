// ============================================================
//  SP Studio — Read-only WCS scan lookup
//  apps/studio/src/lib/wcs-scans.ts
//
//  Reads completed scans from WCS's own Supabase project
//  (public.scans — the same table brainztem's lookupWcsLive
//  reads). Env: WCS_SUPABASE_URL / WCS_SUPABASE_SERVICE_KEY,
//  falling back to the studio's own SUPABASE_* pair when WCS
//  shares the project. Every path is fail-soft: any error or
//  missing config returns null and the demo falls back to the
//  sample deck.
// ============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { WCSReport } from "./types";
import { remoteLatestByDomain, remoteScanById } from "./wcs-remote";

const SCAN_FRESHNESS_DAYS = 7; // matches WCS's own domain cache window

export interface ScanHit {
  scanId: string;
  domain: string;
  report: WCSReport;
  completedAt: string | null;
}

let client: SupabaseClient | null | undefined;

function wcsClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.WCS_SUPABASE_URL ?? process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.WCS_SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

/** Strips protocol/www/path and lowercases — mirrors WCS's cleanDomain(). */
export function cleanDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0];
}

export async function getRecentScanByDomain(rawDomain: string): Promise<ScanHit | null> {
  const supabase = wcsClient();
  if (!supabase) return null;
  const domain = cleanDomain(rawDomain);
  if (!domain || !domain.includes(".")) return null;

  try {
    const since = new Date(Date.now() - SCAN_FRESHNESS_DAYS * 86_400_000).toISOString();
    const { data, error } = await supabase
      .from("scans")
      .select("id, domain, result, completed_at, created_at")
      .eq("domain", domain)
      .eq("status", "done")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error || !data?.length || !data[0].result) return remoteLatestByDomain(domain);
    return {
      scanId: data[0].id,
      domain: data[0].domain,
      report: data[0].result as WCSReport,
      completedAt: data[0].completed_at ?? data[0].created_at ?? null,
    };
  } catch {
    return remoteLatestByDomain(domain);
  }
}

export async function getScanById(scanId: string): Promise<ScanHit | null> {
  if (!/^[0-9a-f-]{36}$/i.test(scanId)) return null;
  const supabase = wcsClient();
  if (!supabase) return remoteScanById(scanId);

  try {
    const { data, error } = await supabase
      .from("scans")
      .select("id, domain, result, completed_at, created_at")
      .eq("id", scanId)
      .eq("status", "done")
      .limit(1);
    // Not in SP's shared copy? Ask WCS directly (it owns the real data).
    if (error || !data?.length || !data[0].result) return remoteScanById(scanId);
    return {
      scanId: data[0].id,
      domain: data[0].domain,
      report: data[0].result as WCSReport,
      completedAt: data[0].completed_at ?? data[0].created_at ?? null,
    };
  } catch {
    return remoteScanById(scanId);
  }
}
