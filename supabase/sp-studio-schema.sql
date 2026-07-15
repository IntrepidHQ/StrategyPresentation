-- ============================================================
--  SP Studio — Supabase Schema
--  Project: IntrepidHQ's Project (xeaeiowwodppqhswotsx) — the SAME
--  Supabase project WCS and Brainztem already share, one schema each:
--    public     → WCS  (scans, workspaces, saved_reports, ...)
--    brainztem  → Brainztem (sandboxes, client_instances, ...)
--    sp         → this file (strategies, edit_history, demo_leads)
--  Run this in: Supabase SQL editor (or via supabase db push)
-- ============================================================

create extension if not exists "pgcrypto";

create schema if not exists sp;

-- ── sp.strategies ────────────────────────────────────────────
-- One row per client engagement. The source of truth for
-- everything: the raw WCS scan, the generated narrative,
-- the current editable HTML, and publish state.

create table if not exists sp.strategies (
  id            text        primary key default gen_random_uuid()::text,
  client_name   text        not null,
  client_slug   text        not null unique,  -- becomes the subdomain slug
  tier          text        not null default 'standard'
                            check (tier in ('standard', 'nonprofit')),

  -- Raw WCS data (WCSReport JSON)
  wcs_report    jsonb       not null,

  -- Pass 1 Claude output (StrategyNarrative JSON)
  narrative     jsonb,

  -- Current working HTML (the file Claude edits in studio)
  current_html  text,

  -- Gate credentials for this client's presentation
  gate_password text,
  gate_signed_date text,   -- e.g. "May 9, 2026"

  -- Workflow state
  status        text        not null default 'draft'
                            check (status in ('draft', 'generating', 'generated', 'review', 'published')),

  -- Publish metadata
  published_at  timestamptz,
  vercel_url    text,        -- e.g. https://abilitysc.strategypresentation.com
  vercel_deploy_id text,     -- Vercel deployment ID for rollback

  -- Deck engine (Phase 4)
  template_id   text,        -- summit | signal | editorial | monospace | gallery | beacon
  source        text check (source in ('wcs', 'brainztem', 'sp-demo')),
  sandbox_token text,        -- Brainztem trial token: deck CTA deep-links back

  -- Timestamps
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── sp.edit_history ──────────────────────────────────────────
-- Append-only log of every Claude edit Hans makes in studio.
-- Enables undo, audit trail, and token cost tracking.

create table if not exists sp.edit_history (
  id             text        primary key default gen_random_uuid()::text,
  strategy_id    text        not null references sp.strategies(id) on delete cascade,

  prompt         text        not null,   -- Hans's instruction verbatim
  html_before    text        not null,   -- snapshot before this edit
  html_after     text        not null,   -- Claude's output
  tokens_used    integer,               -- total tokens (prompt + completion)
  model          text,                  -- e.g. claude-sonnet-4-6

  created_at     timestamptz not null default now()
);

-- ── sp.demo_leads ────────────────────────────────────────────
-- Email captures from the "see it in action" landing-page demo
-- (apps/studio/src/app/api/demo/claim/route.ts).

create table if not exists sp.demo_leads (
  id         text        primary key default gen_random_uuid()::text,
  email      text        not null,
  domain     text,
  source     text        not null default 'sample' check (source in ('scan', 'sample')),
  scan_id    uuid,        -- references public.scans(id) informally (cross-schema, no FK)
  created_at timestamptz not null default now()
);

-- ── updated_at trigger ───────────────────────────────────────

create or replace function sp.set_updated_at()
returns trigger
language plpgsql
set search_path = ''  -- pin: mutable search_path on SECURITY INVOKER trigger fns is a lint warning
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists strategies_updated_at on sp.strategies;
create trigger strategies_updated_at
  before update on sp.strategies
  for each row execute function sp.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────
-- Studio uses the service role key only. No public access.
-- These policies lock out the anon key entirely — same posture
-- as every other table in this project (public.* and brainztem.*).

alter table sp.strategies   enable row level security;
alter table sp.edit_history enable row level security;
alter table sp.demo_leads   enable row level security;

-- Service role bypasses RLS automatically. Deny all for anon/authenticated.
drop policy if exists "deny_all_strategies"   on sp.strategies;
drop policy if exists "deny_all_edit_history" on sp.edit_history;
drop policy if exists "deny_all_demo_leads"   on sp.demo_leads;
create policy "deny_all_strategies"   on sp.strategies   for all using (false);
create policy "deny_all_edit_history" on sp.edit_history for all using (false);
create policy "deny_all_demo_leads"   on sp.demo_leads   for all using (false);

-- ── Indexes ──────────────────────────────────────────────────

create index if not exists strategies_slug_idx    on sp.strategies(client_slug);
create index if not exists strategies_status_idx   on sp.strategies(status);
create index if not exists edit_history_strat_idx  on sp.edit_history(strategy_id);
create index if not exists edit_history_time_idx   on sp.edit_history(created_at desc);
create index if not exists demo_leads_email_idx    on sp.demo_leads(email);
create index if not exists demo_leads_created_idx  on sp.demo_leads(created_at desc);

-- ── Grants ───────────────────────────────────────────────────
-- The service role bypasses RLS but Postgres still checks schema/table
-- USAGE and privileges first (schema creation defaults grant nothing to
-- service_role automatically the way `public` gets it out of the box).

grant usage on schema sp to service_role;
grant all on all tables in schema sp to service_role;
grant all on all sequences in schema sp to service_role;
alter default privileges in schema sp grant all on tables to service_role;
alter default privileges in schema sp grant all on sequences to service_role;
