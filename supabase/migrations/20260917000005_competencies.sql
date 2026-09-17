-- Référentiel : domaines, compétences, échelle 1-5 (docs/04 §5).
-- « competency » est l'unité atomique du système (ADR-05).

create table development_domains (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid not null references academies(id),
  code        text not null,
  name_fr     text not null,
  name_en     text,
  description text,
  color       text not null,
  icon        text,
  order_index int not null,
  is_active   boolean not null default true,
  unique (academy_id, code)
);

create table competencies (
  id                   uuid primary key default gen_random_uuid(),
  academy_id           uuid not null references academies(id),
  domain_id            uuid not null references development_domains(id),
  code                 text not null,
  name_fr              text not null,
  name_en              text,
  description          text,
  observable_behaviour text,        -- « ce que je dois VOIR sur le terrain »
  min_age              int not null default 6,
  max_age              int not null default 18,
  order_index          int not null default 0,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  unique (academy_id, code)
);
create index competencies_domain_idx on competencies (domain_id);

-- Sans descripteur écrit, deux coachs ne notent pas la même chose
-- et la donnée devient inexploitable trois ans plus tard.
create table competency_levels (
  id            uuid primary key default gen_random_uuid(),
  competency_id uuid references competencies(id) on delete cascade,  -- NULL = échelle générique
  level         int not null check (level between 1 and 5),
  label_fr      text not null,
  label_en      text,
  descriptor    text,
  unique (competency_id, level)
);
