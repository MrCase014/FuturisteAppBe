-- Calendrier unifié et présences (docs/04 §9).

create table events (
  id         uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id),
  team_id    uuid references teams(id),
  type       event_type not null,
  session_id uuid references training_sessions(id) on delete cascade,
  match_id   uuid,
  title      text not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  location   text,
  notes      text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index events_agenda_idx on events (academy_id, starts_at);
create index events_team_idx on events (team_id, starts_at);

create table attendance (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references events(id) on delete cascade,
  player_id           uuid not null references players(id) on delete cascade,
  status              attendance_status not null,
  minutes_late        int not null default 0 check (minutes_late >= 0),
  reason              text,
  recorded_by         uuid references profiles(id),
  recorded_at         timestamptz not null default now(),
  client_generated_id uuid unique,
  unique (event_id, player_id)
);
create index attendance_player_idx on attendance (player_id);
