-- Séances et timeline (docs/04 §7).

create table training_sessions (
  id                    uuid primary key default gen_random_uuid(),
  academy_id            uuid not null references academies(id),
  team_id               uuid references teams(id),
  age_group_id          uuid references age_groups(id),
  coach_id              uuid references profiles(id),
  title                 text not null,
  scheduled_at          timestamptz not null,
  duration_min          int not null default 75 check (duration_min > 0),
  location              text,
  objective             text,
  theme                 text,
  main_domain_id        uuid references development_domains(id),
  target_competency_ids uuid[] not null default '{}',
  level                 exercise_level not null default 'DECOUVERTE',
  players_expected      int,
  equipment             jsonb not null default '[]'::jsonb,
  status                session_status not null default 'DRAFT',
  origin                session_origin not null default 'MANUAL',
  ai_request_id         uuid,
  coach_notes           text,
  debrief               text,
  client_generated_id   uuid unique,     -- anti-doublon hors ligne
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index training_sessions_agenda_idx on training_sessions (academy_id, scheduled_at desc);
create index training_sessions_team_idx on training_sessions (team_id, status);

-- Un bloc de la timeline : pointe un exercice OU reste libre.
create table session_exercises (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid not null references training_sessions(id) on delete cascade,
  exercise_id           uuid references exercises(id),
  phase                 session_phase not null,
  order_index           int not null,
  duration_min          int not null check (duration_min > 0),
  custom_title          text,
  custom_notes          text,
  coaching_points       text[],
  adapted_players_count int,
  completed_at          timestamptz,
  unique (session_id, order_index)
);

create table session_templates (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies(id),
  name         text not null,
  age_group_id uuid references age_groups(id),
  theme        text,
  blocks       jsonb not null,
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now()
);
