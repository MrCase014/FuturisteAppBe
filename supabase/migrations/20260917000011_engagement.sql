-- Badges et défis (docs/04 §10).
-- Ils récompensent le DÉVELOPPEMENT, jamais les buts ni les victoires.

create table badges (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies(id),
  code         text not null,
  name_fr      text not null,
  name_en      text,
  emoji        text,
  domain_id    uuid references development_domains(id),
  description  text,
  criteria     jsonb not null default '{}'::jsonb,
  tier         int not null default 1 check (tier between 1 and 3),
  is_automatic boolean not null default false,
  unique (academy_id, code)
);

create table player_badges (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  badge_id   uuid not null references badges(id),
  awarded_by uuid references profiles(id),
  reason     text,
  awarded_at timestamptz not null default now(),
  unique (player_id, badge_id)
);

create table challenges (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references academies(id),
  title         text not null,
  description   text,
  domain_id     uuid references development_domains(id),
  age_group_ids uuid[] not null default '{}',
  video_url     text,
  duration_days int not null default 7,
  points        int not null default 10,
  is_active     boolean not null default true
);

create table player_challenges (
  id                  uuid primary key default gen_random_uuid(),
  player_id           uuid not null references players(id) on delete cascade,
  challenge_id        uuid not null references challenges(id),
  status              text not null default 'STARTED',
  submitted_media_url text,
  validated_by        uuid references profiles(id),
  validated_at        timestamptz,
  created_at          timestamptz not null default now(),
  unique (player_id, challenge_id)
);
