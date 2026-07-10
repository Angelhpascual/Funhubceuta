-- MVP Voting tables
-- Run this in Supabase SQL Editor

create table if not exists mvp_sessions (
  id uuid primary key default gen_random_uuid(),
  match_label text not null,           -- "vs Oviedo · 12 Jul"
  candidates jsonb not null default '[]', -- [{id, name, number, position, photo_url}]
  status text not null default 'pending', -- pending | open | closed
  winner_id text,                      -- candidate id of winner
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
  fingerprint text not null,           -- localStorage fingerprint (anon)
  created_at timestamptz default now(),
  unique(session_id, fingerprint)      -- one vote per session per device
);

-- Index for fast vote counts
create index if not exists mvp_votes_session_candidate on mvp_votes(session_id, candidate_id);
