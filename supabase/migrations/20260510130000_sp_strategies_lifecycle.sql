-- Extend SP studio strategies for the full lifecycle.
-- Apply via supabase SQL editor against the shared WCS Supabase project.
-- Run AFTER 20260510120000_sp_strategies_initial.sql.

alter table strategies
  drop constraint if exists strategies_status_check;

alter table strategies
  add constraint strategies_status_check
  check (status in (
    'draft', 'generating', 'generated', 'review',
    'published', 'approved', 'paid', 'project_created', 'delivered'
  ));

alter table strategies add column if not exists approved_at        timestamptz;
alter table strategies add column if not exists paid_at            timestamptz;
alter table strategies add column if not exists project_created_at timestamptz;
alter table strategies add column if not exists delivered_at       timestamptz;
alter table strategies add column if not exists stripe_session_id  text;
alter table strategies add column if not exists stripe_phase       text
  check (stripe_phase is null or stripe_phase in ('phase_1', 'phase_2'));
alter table strategies add column if not exists crm_project_id     text;
alter table strategies add column if not exists source_scan_id     text;

-- vercel_deploy_id is unused by the rewrites-based publish flow; drop it cleanly.
alter table strategies drop column if exists vercel_deploy_id;

-- Capture cache hit/miss splits for cost-per-build telemetry.
alter table edit_history add column if not exists cache_create_tokens integer;
alter table edit_history add column if not exists cache_read_tokens   integer;
alter table edit_history add column if not exists output_tokens       integer;

create index if not exists strategies_source_scan_idx on strategies(source_scan_id);
create unique index if not exists strategies_stripe_session_idx on strategies(stripe_session_id) where stripe_session_id is not null;
