-- Évaluations, objectifs MY NEXT LEVEL, progression, PLAYER DNA (docs/04 §8).

create table player_evaluations (
  id                        uuid primary key default gen_random_uuid(),
  academy_id                uuid not null references academies(id),
  player_id                 uuid not null references players(id) on delete cascade,
  session_id                uuid references training_sessions(id) on delete set null,
  match_id                  uuid,
  evaluator_id              uuid not null references profiles(id),
  context                   evaluation_context not null default 'SESSION',
  evaluated_at              timestamptz not null default now(),
  engagement                int check (engagement between 1 and 5),
  effort                    int check (effort between 1 and 5),
  behaviour                 int check (behaviour between 1 and 5),
  session_objective_reached boolean,
  qualitative_comment       text,      -- le plus précieux : il devient un objectif
  is_visible_to_parent      boolean not null default true,
  is_visible_to_player      boolean not null default true,
  client_generated_id       uuid unique,
  created_at                timestamptz not null default now()
);
create index player_evaluations_player_idx on player_evaluations (player_id, evaluated_at desc);

create table player_evaluation_scores (
  id            uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references player_evaluations(id) on delete cascade,
  competency_id uuid not null references competencies(id),
  level         int not null check (level between 1 and 5),
  comment       text,
  unique (evaluation_id, competency_id)
);

create table player_goals (
  id                   uuid primary key default gen_random_uuid(),
  academy_id           uuid not null references academies(id),
  player_id            uuid not null references players(id) on delete cascade,
  competency_id        uuid references competencies(id),
  title                text not null,
  description          text,
  status               goal_status not null default 'ACTIVE',
  progress_pct         int not null default 0 check (progress_pct between 0 and 100),
  start_level          int check (start_level between 1 and 5),
  target_level         int check (target_level between 1 and 5),
  target_date          date,
  source_evaluation_id uuid references player_evaluations(id),
  created_by           uuid references profiles(id),
  achieved_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index player_goals_active_idx on player_goals (player_id, status);

-- Maximum 3 objectifs ACTIVE par joueur (docs/11 §8).
-- Quatre objectifs, c'est aucun objectif — la règle est verrouillée en base,
-- pas seulement dans l'interface. Un index ne sait pas exprimer « au plus N
-- lignes par groupe » : c'est un trigger.
create or replace function futuriste.enforce_max_active_goals()
returns trigger language plpgsql as $$
declare
  active_count int;
begin
  if new.status <> 'ACTIVE' then
    return new;
  end if;
  select count(*) into active_count
  from player_goals
  where player_id = new.player_id
    and status = 'ACTIVE'
    and id <> new.id;
  if active_count >= 3 then
    raise exception 'MAX_ACTIVE_GOALS: 3 objectifs actifs maximum par joueur (docs/11 §8).'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger player_goals_max_active
  before insert or update on player_goals
  for each row execute function futuriste.enforce_max_active_goals();

create table player_goal_checkins (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null references player_goals(id) on delete cascade,
  session_id uuid references training_sessions(id),
  rating     int check (rating between 1 and 5),
  comment    text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table player_development_snapshots (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  domain_id   uuid not null references development_domains(id),
  period      date not null,
  avg_level   numeric(3,2),
  sample_size int,
  computed_at timestamptz not null default now(),
  unique (player_id, domain_id, period)
);

create table player_dna_profiles (
  id                  uuid primary key default gen_random_uuid(),
  player_id           uuid unique not null references players(id) on delete cascade,
  primary_archetype   player_archetype,
  secondary_archetype player_archetype,
  scores              jsonb not null default '{}'::jsonb,
  confidence          numeric(3,2) not null default 0 check (confidence between 0 and 1),
  is_manual_override  boolean not null default false,
  computed_at         timestamptz not null default now()
);
