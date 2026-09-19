-- Coquilles IA (Phase 12) et vision (Phase 13) — créées vides au MVP (docs/04 §11).
-- Les poser maintenant évite une migration lourde le jour du branchement.

create table ai_requests (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies(id),
  actor_id     uuid references profiles(id),
  kind         text not null check (kind in ('SESSION_GEN','ASK','ANALYSIS','ADAPT')),
  input        jsonb not null,
  output       jsonb,
  model        text,
  tokens_in    int,
  tokens_out   int,
  cost_usd     numeric(10,6),
  status       text not null default 'PENDING',
  error        text,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index ai_requests_academy_idx on ai_requests (academy_id, created_at desc);

create table video_analysis_jobs (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references academies(id),
  match_id     uuid references matches(id),
  source_url   text not null,
  source_kind  text check (source_kind in ('DRONE','CAMERA_FIXE','SMARTPHONE')),
  provider     text,
  status       text not null default 'PENDING',
  metrics      jsonb,
  requested_by uuid references profiles(id),
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
