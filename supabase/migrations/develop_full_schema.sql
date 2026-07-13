-- =====================================================
-- SCHEMA completo para proyecto develop
-- Aplicar en: https://supabase.com/dashboard/project/ldqwgkrmgekfuplirrda/sql/new
-- =====================================================

create table if not exists standings (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  season text not null,
  position int,
  team_name text,
  team_logo text,
  played int,
  won int,
  drawn int,
  lost int,
  goals_for int,
  goals_against int,
  goal_difference int,
  points int,
  form text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table standings enable row level security;
do $$ begin create policy "standings_read" on standings for select using (true); exception when duplicate_object then null; end $$;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text,
  short_name text,
  logo_url text,
  season text,
  venue text,
  created_at timestamptz default now()
);
alter table teams enable row level security;
do $$ begin create policy "teams_read" on teams for select using (true); exception when duplicate_object then null; end $$;

create table if not exists squad (
  id uuid primary key default gen_random_uuid(),
  dorsal int,
  name text,
  position text,
  position_group text,
  nationality text,
  season text,
  photo_url text,
  height text,
  weight text,
  birth_date text,
  career_history jsonb,
  espn_id text,
  bio text,
  created_at timestamptz default now()
);
alter table squad enable row level security;
do $$ begin create policy "squad_read" on squad for select using (true); exception when duplicate_object then null; end $$;

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  home_team text,
  away_team text,
  home_team_logo text,
  away_team_logo text,
  home_score int,
  away_score int,
  date date,
  matchday text,
  season text,
  competition text,
  status text,
  venue text,
  time text,
  weekday text,
  is_home boolean,
  tickets_url text,
  result text,
  espn_event_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table matches enable row level security;
do $$ begin create policy "matches_read" on matches for select using (true); exception when duplicate_object then null; end $$;

create table if not exists app_config (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
alter table app_config enable row level security;
do $$ begin create policy "app_config_read" on app_config for select using (true); exception when duplicate_object then null; end $$;

create table if not exists player_stats (
  id uuid primary key default gen_random_uuid(),
  espn_id text,
  season text,
  name text,
  short_name text,
  position text,
  position_group text,
  photo_url text,
  appearances int,
  goals int,
  assists int,
  shots int,
  shots_on_target int,
  yellow_cards int,
  red_cards int,
  saves int,
  goals_conceded int,
  updated_at timestamptz default now()
);
alter table player_stats enable row level security;
do $$ begin create policy "player_stats_read" on player_stats for select using (true); exception when duplicate_object then null; end $$;

create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  title text,
  summary text,
  url text,
  source text,
  source_url text,
  image_url text,
  published_at timestamptz,
  external_id text unique,
  description text,
  notify_queued boolean default false,
  published boolean default true,
  discarded boolean default false,
  created_at timestamptz default now()
);
alter table news enable row level security;
do $$ begin create policy "news_read" on news for select using (true); exception when duplicate_object then null; end $$;

create table if not exists cron_logs (
  id uuid primary key default gen_random_uuid(),
  cron_type text not null,
  status text not null,
  duration_ms int,
  details jsonb,
  created_at timestamptz default now()
);
alter table cron_logs enable row level security;
do $$ begin create policy "cron_logs_read" on cron_logs for select using (true); exception when duplicate_object then null; end $$;

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
do $$ begin create policy "push_subscriptions_read" on push_subscriptions for select using (true); exception when duplicate_object then null; end $$;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  url text,
  tag text,
  sent_at timestamptz not null default now()
);
alter table notifications enable row level security;
do $$ begin create policy "notifications_read" on notifications for select using (true); exception when duplicate_object then null; end $$;

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
alter table mvp_sessions enable row level security;
do $$ begin create policy "mvp_sessions_read" on mvp_sessions for select using (true); exception when duplicate_object then null; end $$;

create table if not exists mvp_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references mvp_sessions(id) on delete cascade,
  candidate_id text not null,
  fingerprint text not null,
  nickname text,
  created_at timestamptz default now(),
  unique(session_id, fingerprint)
);
alter table mvp_votes enable row level security;
do $$ begin create policy "mvp_votes_read" on mvp_votes for select using (true); exception when duplicate_object then null; end $$;

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
alter table prediction_sessions enable row level security;
do $$ begin create policy "prediction_sessions_read" on prediction_sessions for select using (true); exception when duplicate_object then null; end $$;

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
alter table prediction_votes enable row level security;
do $$ begin create policy "prediction_votes_read" on prediction_votes for select using (true); exception when duplicate_object then null; end $$;
