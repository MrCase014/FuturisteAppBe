-- Académie, profils, catégories, équipes (docs/04 §4).

create table academies (
  id             uuid primary key default gen_random_uuid(),
  name           text not null default 'FUTURISTE ACADÉMIE FC',
  slug           text unique not null,
  country        text,
  city           text,
  logo_url       text,
  primary_color  text default '#7C3AED',
  default_locale text not null default 'fr',
  settings       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  academy_id   uuid not null references academies(id),
  role         user_role not null,
  first_name   text not null,
  last_name    text not null,
  email        citext,
  phone        text,
  avatar_url   text,
  locale       text not null default 'fr',
  is_active    boolean not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index profiles_academy_role_idx on profiles (academy_id, role);

create table age_groups (
  id                    uuid primary key default gen_random_uuid(),
  academy_id            uuid not null references academies(id),
  code                  text not null,
  label_fr              text not null,
  label_en              text,
  min_age               int not null,
  max_age               int not null,
  order_index           int not null,
  objectives            text,
  priority_competencies uuid[] not null default '{}',
  session_duration_min  int not null default 75,
  sessions_per_week     int not null default 2,
  complexity_level      int not null default 1 check (complexity_level between 1 and 5),
  physical_guidelines   text,
  content_technical     text,
  content_tactical      text,
  content_cognitive     text,
  content_mental        text,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (academy_id, code),
  check (min_age <= max_age)
);

create table teams (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies(id),
  age_group_id uuid not null references age_groups(id),
  name         text not null,
  season       text not null,
  gender       gender not null default 'MIXED',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index teams_academy_idx on teams (academy_id, season);

-- Pivot de la sécurité coach : un coach ne voit QUE les équipes listées ici.
create table team_coaches (
  team_id     uuid not null references teams(id) on delete cascade,
  coach_id    uuid not null references profiles(id) on delete cascade,
  role        text not null default 'HEAD',
  assigned_at timestamptz not null default now(),
  primary key (team_id, coach_id)
);
create index team_coaches_coach_idx on team_coaches (coach_id);
