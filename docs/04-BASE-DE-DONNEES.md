# 04 — BASE DE DONNÉES

> **Le document le plus important du projet.** Un écran se refait en 2 jours.
> Un schéma mal conçu se paie pendant 3 ans.

**42 tables, réparties en 11 domaines fonctionnels.**

> ✅ **Appliqué et vérifié en Phase 2** : 18 migrations, 85 politiques RLS,
> 6 vues, 15 types énumérés. Les 12 tests de sécurité passent
> (`pnpm db:test`). Le schéma décrit ci-dessous est celui qui tourne.

---

## 1. Le schéma en un coup d'œil

```
                              ┌─────────────┐
                              │  academies  │  (une seule ligne au MVP,
                              └──────┬──────┘   mais prêt pour plusieurs)
                                     │
        ┌──────────────┬─────────────┼───────────────┬─────────────────┐
        │              │             │               │                 │
   ┌────▼────┐   ┌─────▼──────┐ ┌────▼─────┐  ┌──────▼──────┐  ┌───────▼────────┐
   │profiles │   │ age_groups │ │  teams   │  │development_ │  │exercises       │
   │(5 rôles)│   │  U7 → U18  │ │          │  │  domains    │  │(bibliothèque)  │
   └────┬────┘   └─────┬──────┘ └────┬─────┘  └──────┬──────┘  └───────┬────────┘
        │              │             │               │                 │
        │              └─────────────┤          ┌────▼──────────┐      │
        │                            │          │ competencies  │◄─────┤
   ┌────▼──────┐                     │          │ (~70 lignes)  │      │
   │  players  │◄────────────────────┤          └────┬──────────┘      │
   └────┬──────┘   player_team_memberships            │                 │
        │                                             │                 │
        ├──────────────┬────────────────┬─────────────┤                 │
        │              │                │             │                 │
   ┌────▼──────┐ ┌─────▼─────┐   ┌──────▼──────────┐  │        ┌────────▼────────┐
   │player_    │ │attendance │   │player_          │  │        │training_sessions│
   │guardians  │ │           │   │evaluations      │──┘        └────────┬────────┘
   └───────────┘ └───────────┘   └──────┬──────────┘                    │
                                        │                       session_exercises
                                 ┌──────▼──────────┐                    │
                                 │player_goals     │◄───────────────────┘
                                 │ MY NEXT LEVEL   │
                                 └─────────────────┘
```

---

## 2. Conventions appliquées partout

| Règle | Détail |
|---|---|
| Clés primaires | `uuid` généré par `gen_random_uuid()` — jamais un entier séquentiel (impossible de deviner l'URL d'un autre enfant) |
| Horodatage | `created_at`, `updated_at` (`timestamptz`) sur toute table, mis à jour par trigger |
| Multi-académie | `academy_id` sur **toute** table métier : socle du cloisonnement RLS |
| Suppression | `deleted_at` (suppression logique) sur les tables sensibles. Jamais de `DELETE` sec sur les données d'un mineur |
| Nommage | `snake_case`, tables au **pluriel**, colonnes au singulier |
| Bilingue | `name_fr` / `name_en` sur les tables de référentiel |
| Traçabilité | `created_by`, `updated_by` → `profiles(id)` |
| Synchro hors ligne | `client_generated_id uuid unique` sur les tables écrites depuis le terrain |

---

## 3. Types énumérés

```sql
create type user_role as enum ('SUPER_ADMIN','ACADEMY_DIRECTOR','COACH','PLAYER','PARENT');
create type gender as enum ('F','M','MIXED');
create type dominant_foot as enum ('LEFT','RIGHT','BOTH');
create type player_status as enum ('ACTIVE','INJURED','ON_LOAN','LEFT','TRIAL');
create type exercise_level as enum ('DECOUVERTE','INTERMEDIAIRE','AVANCE');
create type session_phase as enum
  ('ACCUEIL','ACTIVATION','TECHNIQUE','JEU_REDUIT','JEU_POSITION','SITUATION_REELLE','RETOUR_CALME');
create type session_status as enum ('DRAFT','PLANNED','IN_PROGRESS','COMPLETED','CANCELLED');
create type session_origin as enum ('MANUAL','TEMPLATE','RULE_ENGINE','AI');
create type attendance_status as enum ('PRESENT','LATE','ABSENT_EXCUSED','ABSENT_UNEXCUSED','INJURED');
create type evaluation_context as enum ('SESSION','MATCH','PERIODIC','SELF');
create type goal_status as enum ('ACTIVE','ACHIEVED','PAUSED','ARCHIVED');
create type event_type as enum ('TRAINING','MATCH','TOURNAMENT','MEETING','TEST','OTHER');
create type media_provider as enum ('SUPABASE','YOUTUBE','VIMEO','CLOUDFLARE');
create type match_event_type as enum
  ('GOAL','ASSIST','SHOT','CHANCE','RECOVERY','LOSS','DUEL_WON','DUEL_LOST',
   'KEY_PASS','SAVE','YELLOW','RED','SUB_IN','SUB_OUT');
create type player_archetype as enum
  ('CREATEUR','DRIBBLEUR','FINISSEUR','ORGANISATEUR','DEFENSEUR','TRANSITION','POLYVALENT');
```

**Note pédagogique :** `player_archetype` n'est **jamais** un poste.
Le système décrit une *manière de jouer*, pas une case. Voir §8.

---

## 4. Domaine A — Académie et personnes

```sql
create table academies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null default 'FUTURISTE ACADÉMIE FC',
  slug          text unique not null,
  country       text,
  city          text,
  logo_url      text,
  primary_color text default '#7C3AED',
  default_locale text default 'fr',
  settings      jsonb default '{}'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Un profil par compte. L'id EST l'id d'authentification Supabase.
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  academy_id  uuid not null references academies(id),
  role        user_role not null,
  first_name  text not null,
  last_name   text not null,
  email       text,
  phone       text,
  avatar_url  text,
  locale      text default 'fr',
  is_active   boolean default true,
  last_seen_at timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index on profiles (academy_id, role);

create table age_groups (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references academies(id),
  code          text not null,                 -- 'U7','U9','U11','U13','U15','U16','U18'
  label_fr      text not null,
  label_en      text,
  min_age       int not null,
  max_age       int not null,
  order_index   int not null,
  -- Méthodologie modifiable par le directeur :
  objectives            text,
  priority_competencies uuid[] default '{}',
  session_duration_min  int  default 75,
  sessions_per_week     int  default 2,
  complexity_level      int  default 1,        -- 1 à 5
  physical_guidelines   text,
  content_technical     text,
  content_tactical      text,
  content_cognitive     text,
  content_mental        text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (academy_id, code)
);

create table teams (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies(id),
  age_group_id uuid not null references age_groups(id),
  name         text not null,                  -- 'U11 Filles A'
  season       text not null,                  -- '2026-2027'
  gender       gender default 'MIXED',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table team_coaches (
  team_id    uuid references teams(id) on delete cascade,
  coach_id   uuid references profiles(id) on delete cascade,
  role       text default 'HEAD',              -- HEAD | ASSISTANT | GK | PHYSIQUE
  assigned_at timestamptz default now(),
  primary key (team_id, coach_id)
);
-- ⚠️ Cette table est le pivot de la sécurité coach : un coach ne voit QUE
--    les joueurs des équipes listées ici.

create table players (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references academies(id),
  profile_id    uuid unique references profiles(id),  -- NULL pour les plus jeunes
  first_name    text not null,
  last_name     text not null,
  birth_date    date not null,
  gender        gender not null,
  photo_url     text,
  dominant_foot dominant_foot,
  height_cm     int,
  weight_kg     numeric(5,2),          -- saisie facultative, voir 12-SECURITE
  preferred_position   text,
  experienced_positions text[] default '{}',
  jersey_number int,
  joined_at     date not null default current_date,
  status        player_status default 'ACTIVE',
  objectives_note text,
  observations  text,
  medical_notes text,                   -- accès restreint (directeur uniquement)
  deleted_at    timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index on players (academy_id, status);
-- L'âge n'est PAS stocké : il se calcule. Sinon il devient faux chaque année.

create table player_team_memberships (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  team_id    uuid not null references teams(id) on delete cascade,
  season     text not null,
  start_date date default current_date,
  end_date   date,
  is_active  boolean default true
);
create unique index on player_team_memberships (player_id, team_id, season);

create table player_guardians (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  guardian_id   uuid not null references profiles(id) on delete cascade,
  relationship  text,                  -- 'Mère','Père','Tuteur'
  is_primary    boolean default false,
  -- Consentements — voir 12-SECURITE-ENFANTS.md
  consent_data_at   timestamptz,
  consent_media_at  timestamptz,
  consent_medical_at timestamptz,
  created_at    timestamptz default now(),
  unique (player_id, guardian_id)
);
```

---

## 5. Domaine B — Référentiel de compétences (le cœur)

```sql
create table development_domains (
  id         uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id),
  code       text not null,   -- TECHNIQUE, INTELLIGENCE, VITESSE, PHYSIQUE,
                              -- TACTIQUE, MENTAL, SOCIAL, EDUCATION
  name_fr    text not null,
  name_en    text,
  description text,
  color      text not null,   -- couleur du radar
  icon       text,
  order_index int not null,
  is_active  boolean default true,
  unique (academy_id, code)
);

create table competencies (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid not null references academies(id),
  domain_id   uuid not null references development_domains(id),
  code        text not null,          -- 'CONTROLE_ORIENTE'
  name_fr     text not null,
  name_en     text,
  description text,
  observable_behaviour text,          -- "Ce que je dois VOIR sur le terrain"
  min_age     int default 6,
  max_age     int default 18,
  order_index int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  unique (academy_id, code)
);
create index on competencies (domain_id);

-- L'échelle 1→5, décrite en mots pour que deux coachs notent pareil
create table competency_levels (
  id            uuid primary key default gen_random_uuid(),
  competency_id uuid references competencies(id) on delete cascade,  -- NULL = échelle générique
  level         int not null check (level between 1 and 5),
  label_fr      text not null,   -- 1 Découverte · 2 En progression · 3 Acquis
                                 -- 4 Très bon · 5 Excellence
  label_en      text,
  descriptor    text,            -- "Contrôle orienté réussi sous pression légère"
  unique (competency_id, level)
);
```

> **Pourquoi `competency_levels` compte autant.** Sans descripteur écrit,
> le coach A met 3 et le coach B met 4 pour le même geste. Les courbes de
> progression deviennent du bruit. Le descripteur, c'est ce qui rend
> la donnée exploitable trois ans plus tard.

---

## 6. Domaine C — Bibliothèque d'exercices

```sql
create table exercises (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references academies(id),
  name          text not null,
  slug          text not null,
  objective     text not null,
  domain_id     uuid references development_domains(id),
  competency_ids uuid[] default '{}',
  age_group_ids uuid[] default '{}',
  min_age       int, max_age int,
  level         exercise_level default 'DECOUVERTE',
  default_phase session_phase,
  duration_min  int not null,
  players_min   int not null,
  players_max   int not null,
  goalkeepers   int default 0,
  equipment     jsonb default '[]'::jsonb,   -- [{"item":"cône","qty":12}]
  area_length_m int, area_width_m int,
  description       text not null,
  coach_instructions text,
  observation_points text[] default '{}',
  common_mistakes    text[] default '{}',
  variations         text[] default '{}',
  progression        text,
  regression         text,
  intensity      int check (intensity between 1 and 5),
  cognitive_load int check (cognitive_load between 1 and 5),
  is_published  boolean default false,
  usage_count   int default 0,
  created_by    uuid references profiles(id),
  deleted_at    timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (academy_id, slug)
);
create index on exercises using gin (competency_ids);
create index on exercises (academy_id, domain_id, level);

create table exercise_media (
  id           uuid primary key default gen_random_uuid(),
  exercise_id  uuid references exercises(id) on delete cascade,
  session_id   uuid,                     -- vidéo liée à une séance
  kind         text not null,            -- VIDEO | IMAGE | PDF
  provider     media_provider default 'SUPABASE',
  storage_path text,                     -- si SUPABASE
  external_id  text,                     -- si YOUTUBE/VIMEO/CLOUDFLARE
  url          text,
  thumbnail_url text,
  title        text,
  duration_sec int,
  size_bytes   bigint,
  age_group_ids uuid[] default '{}',
  theme        text,
  language     text default 'fr',
  contains_minors boolean default false,  -- ⚠️ bloque toute publication externe
  order_index  int default 0,
  uploaded_by  uuid references profiles(id),
  created_at   timestamptz default now()
);

-- Schéma tactique 2D animé — format détaillé dans 14-SCHEMAS-TACTIQUES.md
create table exercise_diagrams (
  id          uuid primary key default gen_random_uuid(),
  exercise_id uuid references exercises(id) on delete cascade,
  title       text,
  canvas      jsonb not null,   -- terrain, éléments, images-clés d'animation
  version     int default 1,
  preview_url text,             -- PNG généré, pour les listes
  order_index int default 0,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);
```

---

## 7. Domaine D — Séances

```sql
create table training_sessions (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references academies(id),
  team_id       uuid references teams(id),
  age_group_id  uuid references age_groups(id),
  coach_id      uuid references profiles(id),
  title         text not null,
  scheduled_at  timestamptz not null,
  duration_min  int not null default 75,
  location      text,
  objective     text,
  theme         text,
  main_domain_id uuid references development_domains(id),
  target_competency_ids uuid[] default '{}',
  level         exercise_level default 'DECOUVERTE',
  players_expected int,
  equipment     jsonb default '[]'::jsonb,
  status        session_status default 'DRAFT',
  origin        session_origin default 'MANUAL',
  ai_request_id uuid,
  coach_notes   text,
  debrief       text,
  client_generated_id uuid unique,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index on training_sessions (academy_id, scheduled_at desc);
create index on training_sessions (team_id, status);

-- Un bloc de la timeline. Peut pointer un exercice OU être libre.
create table session_exercises (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references training_sessions(id) on delete cascade,
  exercise_id  uuid references exercises(id),
  phase        session_phase not null,
  order_index  int not null,
  duration_min int not null,
  custom_title text,
  custom_notes text,
  coaching_points text[],
  adapted_players_count int,       -- adaptation à l'effectif réel
  completed_at timestamptz,        -- coché en Mode Terrain
  unique (session_id, order_index)
);

create table session_templates (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies(id),
  name         text not null,
  age_group_id uuid references age_groups(id),
  theme        text,
  blocks       jsonb not null,     -- structure sans exercice figé
  created_by   uuid references profiles(id),
  created_at   timestamptz default now()
);
```

---

## 8. Domaine E — Évaluations, objectifs, PLAYER DNA

```sql
create table player_evaluations (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid not null references academies(id),
  player_id   uuid not null references players(id) on delete cascade,
  session_id  uuid references training_sessions(id) on delete set null,
  match_id    uuid,
  evaluator_id uuid not null references profiles(id),
  context     evaluation_context default 'SESSION',
  evaluated_at timestamptz default now(),
  engagement  int check (engagement between 1 and 5),
  effort      int check (effort between 1 and 5),
  behaviour   int check (behaviour between 1 and 5),
  session_objective_reached boolean,
  qualitative_comment text,        -- ⭐ le plus précieux
  is_visible_to_parent boolean default true,
  is_visible_to_player boolean default true,
  client_generated_id uuid unique, -- anti-doublon hors ligne
  created_at  timestamptz default now()
);
create index on player_evaluations (player_id, evaluated_at desc);

create table player_evaluation_scores (
  id            uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references player_evaluations(id) on delete cascade,
  competency_id uuid not null references competencies(id),
  level         int not null check (level between 1 and 5),
  comment       text,
  unique (evaluation_id, competency_id)
);

-- MY NEXT LEVEL
create table player_goals (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references academies(id),
  player_id     uuid not null references players(id) on delete cascade,
  competency_id uuid references competencies(id),
  title         text not null,     -- "Regarder autour de soi avant de recevoir"
  description   text,
  status        goal_status default 'ACTIVE',
  progress_pct  int default 0 check (progress_pct between 0 and 100),
  start_level   int, target_level int,
  target_date   date,
  source_evaluation_id uuid references player_evaluations(id),
  created_by    uuid references profiles(id),
  achieved_at   timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index on player_goals (player_id, status);
-- Règle métier (appliquée dans packages/core) : maximum 3 objectifs ACTIVE.

create table player_goal_checkins (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null references player_goals(id) on delete cascade,
  session_id uuid references training_sessions(id),
  rating     int check (rating between 1 and 5),
  comment    text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Photographie mensuelle, pour des graphiques instantanés
create table player_development_snapshots (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  domain_id   uuid not null references development_domains(id),
  period      date not null,          -- 1er du mois
  avg_level   numeric(3,2),
  sample_size int,
  computed_at timestamptz default now(),
  unique (player_id, domain_id, period)
);

create table player_dna_profiles (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid unique not null references players(id) on delete cascade,
  primary_archetype   player_archetype,
  secondary_archetype player_archetype,
  scores      jsonb not null default '{}'::jsonb,
  confidence  numeric(3,2) default 0,   -- 0 → 1
  is_manual_override boolean default false,
  computed_at timestamptz default now()
);
```

> **Garde-fou PLAYER DNA (règle non négociable).**
> Tant que `confidence < 0.6`, l'application affiche
> **« Profil en construction »** et aucun archétype. On n'enferme pas un enfant
> de 8 ans dans une étiquette parce que l'algorithme a vu 4 évaluations.
> Pour les catégories U7 et U9, le module est **désactivé par défaut**.

---

## 9. Domaine F — Calendrier, présences, matchs

```sql
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
  created_at timestamptz default now()
);
create index on events (academy_id, starts_at);

create table attendance (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  status      attendance_status not null,
  minutes_late int default 0,
  reason      text,
  recorded_by uuid references profiles(id),
  recorded_at timestamptz default now(),
  client_generated_id uuid unique,
  unique (event_id, player_id)
);

create table matches (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references academies(id),
  team_id       uuid not null references teams(id),
  opponent      text not null,
  kickoff_at    timestamptz not null,
  venue         text,
  is_home       boolean default true,
  competition   text,
  score_for     int, score_against int,
  formation     text,
  status        text default 'SCHEDULED',
  coach_report  text,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table match_players (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  player_id  uuid not null references players(id) on delete cascade,
  is_starter boolean default false,
  position   text,
  minutes_played int default 0,
  comment    text,
  unique (match_id, player_id)
);

create table match_events (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references matches(id) on delete cascade,
  player_id   uuid references players(id),
  related_player_id uuid references players(id),
  type        match_event_type not null,
  minute      int,
  pitch_x     numeric(5,2),    -- 0-100, pour les cartes de zones (V2)
  pitch_y     numeric(5,2),
  notes       text,
  recorded_by uuid references profiles(id),
  client_generated_id uuid unique,
  created_at  timestamptz default now()
);

create table player_statistics (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  season     text not null,
  matches_played int default 0,
  minutes_played int default 0,
  goals int default 0, assists int default 0,
  shots int default 0, recoveries int default 0, losses int default 0,
  duels_won int default 0, duels_lost int default 0,
  attendance_rate numeric(5,2),
  sessions_attended int default 0, sessions_total int default 0,
  computed_at timestamptz default now(),
  unique (player_id, season)
);
```

> **Adaptation à l'âge, imposée par le code (`packages/core`) :**
> pour les catégories **U7 et U9**, seuls `PRESENT`, l'engagement et les
> commentaires qualitatifs sont affichés. Les buts, passes décisives et duels
> sont enregistrables mais **masqués**. On ne met pas un enfant de 7 ans
> face à un tableau de statistiques.

---

## 10. Domaine G — Engagement, contenu, système

```sql
create table badges (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid not null references academies(id),
  code        text not null,
  name_fr     text not null, name_en text,
  emoji       text,
  domain_id   uuid references development_domains(id),
  description text,
  criteria    jsonb default '{}'::jsonb,   -- règle automatique éventuelle
  tier        int default 1,               -- 1 bronze, 2 argent, 3 or
  is_automatic boolean default false,
  unique (academy_id, code)
);

create table player_badges (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  badge_id   uuid not null references badges(id),
  awarded_by uuid references profiles(id),
  reason     text,
  awarded_at timestamptz default now(),
  unique (player_id, badge_id)
);

create table challenges (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid not null references academies(id),
  title       text not null, description text,
  domain_id   uuid references development_domains(id),
  age_group_ids uuid[] default '{}',
  video_url   text,
  duration_days int default 7,
  points      int default 10,
  is_active   boolean default true
);

create table player_challenges (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid references players(id) on delete cascade,
  challenge_id uuid references challenges(id),
  status       text default 'STARTED',
  submitted_media_url text,
  validated_by uuid references profiles(id),
  validated_at timestamptz,
  created_at   timestamptz default now()
);

-- Méthodologie éditable par le directeur (CMS)
create table methodology (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies(id),
  age_group_id uuid references age_groups(id),
  domain_id    uuid references development_domains(id),
  section      text not null,        -- 'PRINCIPES','CONTENU','INTERDITS','SEANCE_TYPE'
  title_fr     text not null, title_en text,
  body_fr      text, body_en text,
  order_index  int default 0,
  updated_by   uuid references profiles(id),
  updated_at   timestamptz default now()
);

-- FUTURISTE FAMILY
create table family_resources (
  id         uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id),
  category   text not null,   -- SOMMEIL, NUTRITION, COMPORTEMENT, ECOLE,
                              -- MENTAL, COMMUNICATION, MATCH
  title_fr   text not null, title_en text,
  body_fr    text, body_en text,
  media_url  text,
  age_group_ids uuid[] default '{}',
  is_published boolean default false,
  order_index int default 0,
  updated_at timestamptz default now()
);

create table announcements (
  id         uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id),
  team_id    uuid references teams(id),
  author_id  uuid references profiles(id),
  title      text not null, body text not null,
  audience   text default 'ALL',   -- ALL | COACHES | PARENTS | PLAYERS
  is_pinned  boolean default false,
  published_at timestamptz,
  created_at timestamptz default now()
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type       text not null,
  title      text not null, body text,
  data       jsonb default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz default now()
);
create index on notifications (profile_id, read_at);

create table academy_settings (
  academy_id uuid primary key references academies(id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now()
);

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid references academies(id),
  actor_id    uuid references profiles(id),
  action      text not null,        -- INSERT | UPDATE | DELETE | LOGIN | EXPORT
  entity_type text not null,
  entity_id   uuid,
  diff        jsonb,
  ip_address  inet,
  created_at  timestamptz default now()
);
create index on audit_logs (academy_id, created_at desc);
```

---

## 11. Domaine H — Coquilles pour l'IA et la vision (Phases 12-13)

Ces tables sont **créées au MVP mais vides**. Elles garantissent que brancher
l'IA plus tard ne demandera aucune migration lourde.

```sql
create table ai_requests (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid not null references academies(id),
  actor_id    uuid references profiles(id),
  kind        text not null,   -- SESSION_GEN | ASK | ANALYSIS | ADAPT
  input       jsonb not null,
  output      jsonb,
  model       text,
  tokens_in   int, tokens_out int,
  cost_usd    numeric(10,6),
  status      text default 'PENDING',
  error       text,
  created_at  timestamptz default now(),
  completed_at timestamptz
);

create table video_analysis_jobs (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid not null references academies(id),
  match_id    uuid references matches(id),
  source_url  text not null,
  source_kind text,            -- DRONE | CAMERA_FIXE | SMARTPHONE
  provider    text,
  status      text default 'PENDING',
  metrics     jsonb,           -- largeur, profondeur, distances, transitions…
  requested_by uuid references profiles(id),
  created_at  timestamptz default now(),
  completed_at timestamptz
);
```

---

## 12. Vues pour les tableaux de bord

On calcule **dans la base**, pas dans le téléphone.

```sql
-- Radar 8 domaines d'un joueur, prêt à afficher
create view v_player_domain_levels as
select pe.player_id, c.domain_id,
       round(avg(pes.level)::numeric, 2) as avg_level,
       count(*) as sample_size,
       max(pe.evaluated_at) as last_evaluated_at
from player_evaluation_scores pes
join player_evaluations pe on pe.id = pes.evaluation_id
join competencies c on c.id = pes.competency_id
group by pe.player_id, c.domain_id;

-- Taux de présence par joueur et par saison
create view v_player_attendance as
select a.player_id,
       count(*) filter (where a.status in ('PRESENT','LATE')) as attended,
       count(*) as total,
       round(100.0 * count(*) filter (where a.status in ('PRESENT','LATE'))
             / nullif(count(*),0), 1) as attendance_rate,
       count(*) filter (where a.status = 'LATE') as late_count
from attendance a group by a.player_id;

-- Points faibles d'une équipe → alimente le Session Studio
create view v_team_weakest_competencies as
select ptm.team_id, pes.competency_id,
       round(avg(pes.level)::numeric,2) as avg_level,
       count(distinct pe.player_id) as players_count
from player_evaluation_scores pes
join player_evaluations pe on pe.id = pes.evaluation_id
join player_team_memberships ptm
  on ptm.player_id = pe.player_id and ptm.is_active
where pe.evaluated_at > now() - interval '90 days'
group by ptm.team_id, pes.competency_id
having count(distinct pe.player_id) >= 3;

-- Chiffres du tableau de bord directeur
create view v_academy_overview as
select ac.id as academy_id,
  (select count(*) from players p where p.academy_id=ac.id and p.status='ACTIVE'
     and p.deleted_at is null) as players_count,
  (select count(*) from profiles pr where pr.academy_id=ac.id and pr.role='COACH'
     and pr.is_active) as coaches_count,
  (select count(*) from teams t where t.academy_id=ac.id) as teams_count,
  (select count(*) from training_sessions s where s.academy_id=ac.id
     and s.scheduled_at > now() - interval '30 days') as sessions_30d,
  (select count(*) from player_goals g where g.academy_id=ac.id
     and g.status='ACTIVE') as active_goals
from academies ac;
```

---

## 13. Inventaire complet — 42 tables

| # | Table | Domaine | Écrite par |
|---|---|---|---|
| 1 | `academies` | Académie | Super admin |
| 2 | `profiles` | Personnes | Système + directeur |
| 3 | `age_groups` | Académie | Directeur |
| 4 | `teams` | Académie | Directeur |
| 5 | `team_coaches` | Académie | Directeur |
| 6 | `players` | Personnes | Directeur |
| 7 | `player_team_memberships` | Personnes | Directeur |
| 8 | `player_guardians` | Personnes | Directeur |
| 9 | `development_domains` | Référentiel | Directeur |
| 10 | `competencies` | Référentiel | Directeur |
| 11 | `competency_levels` | Référentiel | Directeur |
| 12 | `exercises` | Bibliothèque | Directeur / coach |
| 13 | `exercise_media` | Bibliothèque | Directeur / coach |
| 14 | `exercise_diagrams` | Bibliothèque | Directeur / coach |
| 15 | `training_sessions` | Séances | Coach |
| 16 | `session_exercises` | Séances | Coach |
| 17 | `session_templates` | Séances | Coach |
| 18 | `player_evaluations` | Développement | Coach |
| 19 | `player_evaluation_scores` | Développement | Coach |
| 20 | `player_goals` | Développement | Coach |
| 21 | `player_goal_checkins` | Développement | Coach |
| 22 | `player_development_snapshots` | Développement | Système (nuit) |
| 23 | `player_dna_profiles` | Développement | Système (nuit) |
| 24 | `events` | Calendrier | Coach / directeur |
| 25 | `attendance` | Calendrier | Coach |
| 26 | `matches` | Matchs | Coach |
| 27 | `match_players` | Matchs | Coach |
| 28 | `match_events` | Matchs | Coach |
| 29 | `player_statistics` | Matchs | Système |
| 30 | `badges` | Engagement | Directeur |
| 31 | `player_badges` | Engagement | Coach |
| 32 | `challenges` | Engagement | Directeur |
| 33 | `player_challenges` | Engagement | Joueur |
| 34 | `methodology` | CMS | Directeur |
| 35 | `family_resources` | CMS | Directeur |
| 36 | `announcements` | Communication | Directeur / coach |
| 37 | `notifications` | Communication | Système |
| 38 | `academy_settings` | Système | Directeur |
| 39 | `audit_logs` | Sécurité | Système |
| 40 | `ai_requests` | IA (Phase 12) | Système |
| 41 | `video_analysis_jobs` | Vision (Phase 13) | Système |
| 42 | `sync_conflicts` | Hors ligne | Système |

---

## 14. Les 8 points où un schéma amateur se serait trompé

| Piège fréquent | Choix FUTURISTE |
|---|---|
| Stocker l'âge du joueur | On stocke `birth_date`. L'âge se calcule — sinon il est faux chaque anniversaire |
| Colonnes `technique`, `vitesse`… dans `players` | Table `competencies` + scores. Ajouter une compétence = une ligne, jamais une migration |
| Une seule table `sessions` avec 30 colonnes d'exercices | `session_exercises` : timeline flexible, réordonnable |
| Évaluations en texte libre | Score rattaché à une **compétence identifiée** → tout se relie |
| Supprimer réellement un joueur | `deleted_at` + `audit_logs` : obligation légale et reconstruction possible |
| `academy_id` ajouté plus tard | Présent dès le jour 1 : impossible à rétro-installer proprement |
| Sécurité gérée côté écran | RLS côté PostgreSQL |
| Vidéos liées à un seul hébergeur | `provider` + `external_id` : changer d'hébergeur = un champ |
