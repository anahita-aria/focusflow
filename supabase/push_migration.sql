-- FocusFlow — Web Push schema (background timer notifications).
-- Run once in the Supabase SQL editor. See WEBPUSH_SETUP.md for the full flow
-- (VAPID keys, Edge Function deploy, pg_cron scheduling).

-- Devices subscribed to push, one row per browser/device endpoint.
create table if not exists public.push_subscriptions (
  endpoint     text        primary key,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  subscription jsonb       not null,
  created_at   timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage their own push subscriptions"
  on public.push_subscriptions;
create policy "Users manage their own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Pushes to be sent at a future time (e.g. when a focus timer ends).
create table if not exists public.scheduled_pushes (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  fire_at    timestamptz not null,
  title      text        not null default 'FocusFlow',
  body       text        not null default '',
  sent       boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists scheduled_pushes_due_idx
  on public.scheduled_pushes (sent, fire_at);

alter table public.scheduled_pushes enable row level security;

drop policy if exists "Users manage their own scheduled pushes"
  on public.scheduled_pushes;
create policy "Users manage their own scheduled pushes"
  on public.scheduled_pushes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
