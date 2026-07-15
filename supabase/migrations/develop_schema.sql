-- =====================================================
-- FUNHUB CEUTA — Schema completo para proyecto develop
-- Aplicar en el SQL Editor del proyecto Supabase develop
-- =====================================================

-- ----------------
-- PUSH SUBSCRIPTIONS
-- ----------------
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_admin boolean not null default false,
  environment text not null default 'production',
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
create policy "push_subscriptions_read" on push_subscriptions for select using (true);

-- ----------------
-- NOTIFICATIONS
-- ----------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  url text,
  tag text,
  sent_at timestamptz not null default now()
);

alter table notifications enable row level security;
create policy "notifications_read" on notifications for select using (true);

-- ----------------
-- MVP
-- ----------------
create table if not exists mvp_sessions (
  id uuid primary key default gen_random_uuid(),
  match_label text not null,
  jornada text,
  candidates jsonb not null default '[]',
  status text not null default 'pending',
  winner_id text,
  winner_name text,
  winner_votes int,
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists mvp_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references mvp_sessions(id) on delete cascade,
  candidate_id text not null,
  fingerprint text not null,
  nickname text,
  created_at timestamptz default now(),
  unique(session_id, fingerprint)
);

create index if not exists mvp_votes_session_candidate on mvp_votes(session_id, candidate_id);

alter table mvp_sessions enable row level security;
alter table mvp_votes enable row level security;
create policy "mvp_sessions_read" on mvp_sessions for select using (true);
create policy "mvp_votes_read" on mvp_votes for select using (true);

-- ----------------
-- PREDICTIONS
-- ----------------
create table if not exists prediction_sessions (
  id uuid primary key default gen_random_uuid(),
  match_label text not null,
  match_meta jsonb,
  jornada text,
  status text not null default 'pending' check (status in ('pending','open','closed')),
  result jsonb,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  closed_at timestamptz
);

create table if not exists prediction_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references prediction_sessions(id) on delete cascade,
  fingerprint text not null,
  nickname text,
  home_score int not null check (home_score between 0 and 9),
  away_score int not null check (away_score between 0 and 9),
  points int,
  created_at timestamptz not null default now(),
  unique(session_id, fingerprint)
);

create index if not exists prediction_votes_session_idx on prediction_votes(session_id);
create index if not exists prediction_votes_fingerprint_idx on prediction_votes(fingerprint);

alter table prediction_sessions enable row level security;
alter table prediction_votes enable row level security;
create policy "prediction_sessions_read" on prediction_sessions for select using (true);
create policy "prediction_votes_read" on prediction_votes for select using (true);
