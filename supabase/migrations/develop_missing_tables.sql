-- Tablas que faltaban en develop

create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  article_title text,
  article_source text,
  recipients int,
  sent_ok int,
  sent_fail int,
  article_url text
);
alter table notification_logs enable row level security;
do $$ begin create policy "notification_logs_read" on notification_logs for select using (true); exception when duplicate_object then null; end $$;

create table if not exists history_players (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);
alter table history_players enable row level security;
do $$ begin create policy "history_players_read" on history_players for select using (true); exception when duplicate_object then null; end $$;

create table if not exists player_status (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);
alter table player_status enable row level security;
do $$ begin create policy "player_status_read" on player_status for select using (true); exception when duplicate_object then null; end $$;

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);
alter table players enable row level security;
do $$ begin create policy "players_read" on players for select using (true); exception when duplicate_object then null; end $$;

create table if not exists prediction_contests (
  id uuid primary key default gen_random_uuid(),
  match_id text,
  rival text,
  match_date timestamptz,
  prize_description text,
  prize_image_url text,
  status text,
  notification_sent boolean default false,
  winner_anonymous_id text,
  is_home boolean,
  home_team text,
  away_team text,
  created_at timestamptz default now()
);
alter table prediction_contests enable row level security;
do $$ begin create policy "prediction_contests_read" on prediction_contests for select using (true); exception when duplicate_object then null; end $$;

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  name text,
  position text,
  type text,
  club_from text,
  club_to text,
  reliability text,
  photo_url text,
  notes text,
  created_at timestamptz default now()
);
alter table transfers enable row level security;
do $$ begin create policy "transfers_read" on transfers for select using (true); exception when duplicate_object then null; end $$;

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  alias text,
  email text,
  contest_id uuid,
  result_vote text,
  home_score_vote int,
  away_score_vote int,
  goalscorers_vote text,
  points_earned int,
  created_at timestamptz default now()
);
alter table predictions enable row level security;
do $$ begin create policy "predictions_read" on predictions for select using (true); exception when duplicate_object then null; end $$;

create table if not exists tweets (
  id uuid primary key default gen_random_uuid(),
  tweet_id text unique,
  text text,
  created_at_twitter timestamptz,
  url text,
  image_url text,
  created_at timestamptz default now()
);
alter table tweets enable row level security;
do $$ begin create policy "tweets_read" on tweets for select using (true); exception when duplicate_object then null; end $$;
