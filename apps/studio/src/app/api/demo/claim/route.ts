// ============================================================
//  SP Demo — Lead capture
//  apps/studio/src/app/api/demo/claim/route.ts    (public)
//
//  POST { email, domain, source: "scan" | "sample", scanId? }
//  Stores the lead in Supabase (table sp.demo_leads — SQL in
//  supabase/sp-studio-schema.sql) when configured, and always
//  appends to a local JSONL file as a dev/backstop record.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { appendFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { cleanDomain } from "@/lib/wcs-scans";
import { supabaseServiceKey, supabaseUrl } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!rateLimit(`demo-claim:${clientKey(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Rate limit reached." }, { status: 429 });
  }

  let body: { email?: string; domain?: string; source?: string; scanId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
  }

  const lead = {
    email,
    domain: cleanDomain(body.domain ?? "").slice(0, 253) || null,
    source: body.source === "scan" ? "scan" : "sample",
    scan_id: body.scanId && /^[0-9a-f-]{36}$/i.test(body.scanId) ? body.scanId : null,
    created_at: new Date().toISOString(),
  };

  let stored = false;
  const url = supabaseUrl();
  const key = supabaseServiceKey();
  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false }, db: { schema: "sp" } });
      const { error } = await supabase.from("demo_leads").insert(lead);
      stored = !error;
      if (error) console.error(`[demo/claim] supabase insert failed: ${error.message}`);
    } catch (e) {
      console.error(`[demo/claim] supabase error: ${e}`);
    }
  }

  try {
    const file = path.join(process.cwd(), ".sp-demo-leads.local.jsonl");
    await appendFile(file, JSON.stringify(lead) + "\n");
    stored = true;
  } catch (e) {
    if (!stored) console.error(`[demo/claim] local append failed: ${e}`);
  }

  if (!stored) {
    return NextResponse.json(
      { ok: false, error: "Could not save right now — email hans directly." },
      { status: 500 },
    );
  }
  console.log(`[demo/claim] lead: ${email} (${lead.domain ?? "no domain"}, ${lead.source})`);
  return NextResponse.json({ ok: true });
}
