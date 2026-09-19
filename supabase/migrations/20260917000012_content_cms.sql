-- CMS football : méthodologie, FUTURISTE FAMILY, annonces (docs/04 §10).

create table methodology (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies(id),
  age_group_id uuid references age_groups(id),
  domain_id    uuid references development_domains(id),
  section      text not null,
  title_fr     text not null,
  title_en     text,
  body_fr      text,
  body_en      text,
  order_index  int not null default 0,
  updated_by   uuid references profiles(id),
  updated_at   timestamptz not null default now()
);

create table family_resources (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references academies(id),
  category      text not null check (category in
                  ('SOMMEIL','NUTRITION','COMPORTEMENT','ECOLE','MENTAL','COMMUNICATION','MATCH')),
  title_fr      text not null,
  title_en      text,
  body_fr       text,
  body_en       text,
  media_url     text,
  age_group_ids uuid[] not null default '{}',
  is_published  boolean not null default false,
  order_index   int not null default 0,
  updated_at    timestamptz not null default now()
);

create table announcements (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies(id),
  team_id      uuid references teams(id),
  author_id    uuid references profiles(id),
  title        text not null,
  body         text not null,
  audience     text not null default 'ALL'
                 check (audience in ('ALL','COACHES','PARENTS','PLAYERS')),
  is_pinned    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_inbox_idx on notifications (profile_id, read_at);

create table academy_settings (
  academy_id uuid primary key references academies(id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);
