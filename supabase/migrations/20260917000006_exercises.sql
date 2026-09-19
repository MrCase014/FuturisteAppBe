-- Bibliothèque d'exercices, médias, schémas tactiques (docs/04 §6).

create table exercises (
  id                 uuid primary key default gen_random_uuid(),
  academy_id         uuid not null references academies(id),
  name               text not null,
  slug               text not null,
  objective          text not null,
  domain_id          uuid references development_domains(id),
  competency_ids     uuid[] not null default '{}',
  age_group_ids      uuid[] not null default '{}',
  min_age            int,
  max_age            int,
  level              exercise_level not null default 'DECOUVERTE',
  default_phase      session_phase,
  duration_min       int not null check (duration_min > 0),
  players_min        int not null check (players_min > 0),
  players_max        int not null,
  goalkeepers        int not null default 0,
  equipment          jsonb not null default '[]'::jsonb,
  area_length_m      int,
  area_width_m       int,
  description        text not null,
  coach_instructions text,
  observation_points text[] not null default '{}',
  common_mistakes    text[] not null default '{}',
  variations         text[] not null default '{}',
  progression        text,
  regression         text,
  intensity          int check (intensity between 1 and 5),
  cognitive_load     int check (cognitive_load between 1 and 5),
  is_published       boolean not null default false,
  usage_count        int not null default 0,
  created_by         uuid references profiles(id),
  deleted_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (academy_id, slug),
  check (players_max >= players_min)
);
create index exercises_competencies_idx on exercises using gin (competency_ids);
create index exercises_lookup_idx on exercises (academy_id, domain_id, level) where deleted_at is null;

-- ADR-12 : provider + external_id, pour changer d'hébergeur vidéo
-- sans migration le jour où l'offre gratuite Supabase est saturée.
create table exercise_media (
  id              uuid primary key default gen_random_uuid(),
  academy_id      uuid not null references academies(id),
  exercise_id     uuid references exercises(id) on delete cascade,
  session_id      uuid,
  kind            text not null check (kind in ('VIDEO','IMAGE','PDF')),
  provider        media_provider not null default 'SUPABASE',
  storage_path    text,
  external_id     text,
  url             text,
  thumbnail_url   text,
  title           text,
  duration_sec    int,
  size_bytes      bigint,
  age_group_ids   uuid[] not null default '{}',
  theme           text,
  language        text not null default 'fr',
  -- Bloque toute publication externe : une vidéo montrant des enfants de
  -- l'académie ne part jamais sur YouTube (docs/12 §3).
  contains_minors boolean not null default false,
  order_index     int not null default 0,
  uploaded_by     uuid references profiles(id),
  created_at      timestamptz not null default now(),
  check (provider <> 'SUPABASE' or storage_path is not null),
  check (provider =  'SUPABASE' or external_id  is not null),
  check (not (contains_minors and provider in ('YOUTUBE','VIMEO')))
);
create index exercise_media_exercise_idx on exercise_media (exercise_id);

-- Un schéma est un fichier de DONNÉES (~20 Ko), pas une image (docs/14).
create table exercise_diagrams (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid not null references academies(id),
  exercise_id uuid references exercises(id) on delete cascade,
  title       text,
  canvas      jsonb not null,
  version     int not null default 1,
  preview_url text,
  order_index int not null default 0,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);
create index exercise_diagrams_exercise_idx on exercise_diagrams (exercise_id);
