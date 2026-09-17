-- Joueurs, rattachements aux équipes, tuteurs légaux (docs/04 §4).

create table players (
  id                    uuid primary key default gen_random_uuid(),
  academy_id            uuid not null references academies(id),
  profile_id            uuid unique references profiles(id),
  first_name            text not null,
  last_name             text not null,
  birth_date            date not null,
  gender                gender not null,
  photo_url             text,
  dominant_foot         dominant_foot,
  -- ADR-13 : taille et poids fermés par défaut, U15+ uniquement,
  -- jamais visibles du joueur ni du parent. Colonnes absentes de la vue coach.
  height_cm             int check (height_cm between 80 and 230),
  weight_kg             numeric(5,2) check (weight_kg between 15 and 150),
  preferred_position    text,
  experienced_positions text[] not null default '{}',   -- pluriel volontaire
  jersey_number         int check (jersey_number between 1 and 99),
  joined_at             date not null default current_date,
  status                player_status not null default 'ACTIVE',
  objectives_note       text,
  observations          text,
  medical_notes         text,                            -- direction uniquement
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index players_academy_status_idx on players (academy_id, status) where deleted_at is null;
-- L'âge n'est PAS stocké : il se calcule, sinon il devient faux chaque année.

create table player_team_memberships (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  team_id    uuid not null references teams(id) on delete cascade,
  season     text not null,
  start_date date not null default current_date,
  end_date   date,
  is_active  boolean not null default true,
  unique (player_id, team_id, season)
);
create index ptm_team_idx on player_team_memberships (team_id) where is_active;
create index ptm_player_idx on player_team_memberships (player_id) where is_active;

create table player_guardians (
  id                 uuid primary key default gen_random_uuid(),
  player_id          uuid not null references players(id) on delete cascade,
  guardian_id        uuid not null references profiles(id) on delete cascade,
  relationship       text,
  is_primary         boolean not null default false,
  -- Trois consentements séparés et indépendants (docs/12 §2).
  consent_data_at    timestamptz,
  consent_media_at   timestamptz,
  consent_medical_at timestamptz,
  created_at         timestamptz not null default now(),
  unique (player_id, guardian_id)
);
create index player_guardians_guardian_idx on player_guardians (guardian_id);
