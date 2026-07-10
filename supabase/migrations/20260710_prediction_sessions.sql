-- Sesiones de predicción de resultado
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

-- Predicciones de usuarios
create table if not exists prediction_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references prediction_sessions(id) on delete cascade,
  fingerprint text not null,
  home_score int not null check (home_score between 0 and 9),
  away_score int not null check (away_score between 0 and 9),
  points int,
  created_at timestamptz not null default now(),
  unique(session_id, fingerprint)
);

-- Índices
create index if not exists prediction_votes_session_idx on prediction_votes(session_id);
create index if not exists prediction_votes_fingerprint_idx on prediction_votes(fingerprint);

-- RLS
alter table prediction_sessions enable row level security;
alter table prediction_votes enable row level security;

-- Lectura pública de sesiones
create policy "prediction_sessions_read" on prediction_sessions for select using (true);
-- Lectura pública de votos
create policy "prediction_votes_read" on prediction_votes for select using (true);
