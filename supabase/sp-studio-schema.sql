-- ============================================================
--  SP Studio — Supabase Schema
--  Project: strategypresentation.com
--  Run this in: Supabase SQL editor (or via supabase db push)
-- ============================================================

create extension if not exists "pgcrypto";

-- ── strategies ───────────────────────────────────────────────
-- One row per client engagement. The source of truth for
-- everything: the raw WCS scan, the generated narrative,
-- the current editable HTML, and publish state.

create table if not exists strategies (
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

  -- Timestamps
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── edit_history ─────────────────────────────────────────────
-- Append-only log of every Claude edit Hans makes in studio.
-- Enables undo, audit trail, and token cost tracking.

create table if not exists edit_history (
  id             text        primary key default gen_random_uuid()::text,
  strategy_id    text        not null references strategies(id) on delete cascade,

  prompt         text        not null,   -- Hans's instruction verbatim
  html_before    text        not null,   -- snapshot before this edit
  html_after     text        not null,   -- Claude's output
  tokens_used    integer,               -- total tokens (prompt + completion)
  model          text,                  -- e.g. claude-sonnet-4-6

  created_at     timestamptz not null default now()
);

-- ── updated_at trigger ───────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger strategies_updated_at
  before update on strategies
  for each row execute function set_updated_at();

-- ── Row Level Security ───────────────────────────────────────
-- Studio uses the service role key only. No public access.
-- These policies lock out the anon key entirely.

alter table strategies  enable row level security;
alter table edit_history enable row level security;

-- Service role bypasses RLS automatically. Deny all for anon/authenticated.
create policy "deny_all_strategies"  on strategies  for all using (false);
create policy "deny_all_edit_history" on edit_history for all using (false);

-- ── Indexes ──────────────────────────────────────────────────

create index if not exists strategies_slug_idx   on strategies(client_slug);
create index if not exists strategies_status_idx  on strategies(status);
create index if not exists edit_history_strat_idx on edit_history(strategy_id);
create index if not exists edit_history_time_idx  on edit_history(created_at desc);
