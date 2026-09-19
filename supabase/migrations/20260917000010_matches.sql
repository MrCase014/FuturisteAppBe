-- Matchs, feuille de match, événements, statistiques (docs/04 §9).

create table matches (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references academies(id),
  team_id       uuid not null references teams(id),
  opponent      text not null,
  kickoff_at    timestamptz not null,
  venue         text,
  is_home       boolean not null default true,
  competition   text,
  score_for     int check (score_for >= 0),
  score_against int check (score_against >= 0),
  formation     text,
  status        text not null default 'SCHEDULED',
  coach_report  text,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index matches_team_idx on matches (team_id, kickoff_at desc);

create table match_players (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references matches(id) on delete cascade,
  player_id      uuid not null references players(id) on delete cascade,
  is_starter     boolean not null default false,
  position       text,
  minutes_played int not null default 0 check (minutes_played between 0 and 150),
  comment        text,
  unique (match_id, player_id)
);

create table match_events (
  id                  uuid primary key default gen_random_uuid(),
  match_id            uuid not null references matches(id) on delete cascade,
  player_id           uuid references players(id),
  related_player_id   uuid references players(id),
  type                match_event_type not null,
  minute              int check (minute between 0 and 150),
  pitch_x             numeric(5,2) check (pitch_x between 0 and 100),
  pitch_y             numeric(5,2) check (pitch_y between 0 and 100),
  notes               text,
  recorded_by         uuid references profiles(id),
  client_generated_id uuid unique,
  created_at          timestamptz not null default now()
);
create index match_events_match_idx on match_events (match_id, minute);

create table player_statistics (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid not null references players(id) on delete cascade,
  season            text not null,
  matches_played    int not null default 0,
  minutes_played    int not null default 0,
  goals             int not null default 0,
  assists           int not null default 0,
  shots             int not null default 0,
  recoveries        int not null default 0,
  losses            int not null default 0,
  duels_won         int not null default 0,
  duels_lost        int not null default 0,
  attendance_rate   numeric(5,2),
  sessions_attended int not null default 0,
  sessions_total    int not null default 0,
  computed_at       timestamptz not null default now(),
  unique (player_id, season)
);
