-- FocusFlow — Supabase schema for cloud sync (Phase 2)
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
--
-- Design: snapshot sync. Each user has exactly one row holding their full
-- dataset as a JSON snapshot (the same shape the app exports). Row-level
-- security guarantees a user can only read/write their own snapshot.

create table if not exists public.focusflow_snapshots (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  snapshot   jsonb       not null,
  updated_at timestamptz not null default now(),
  device     text,
  primary key (user_id)
);

alter table public.focusflow_snapshots enable row level security;

-- A user may only access their own snapshot row.
drop policy if exists "Users manage their own snapshot" on public.focusflow_snapshots;
create policy "Users manage their own snapshot"
  on public.focusflow_snapshots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
