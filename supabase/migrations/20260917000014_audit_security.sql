-- Journal d'audit et file de conflits hors ligne (docs/04 §10, docs/12 §6).

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid references academies(id),
  actor_id    uuid references profiles(id),
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  diff        jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);
create index audit_logs_academy_idx on audit_logs (academy_id, created_at desc);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);

create table sync_conflicts (
  id                  uuid primary key default gen_random_uuid(),
  academy_id          uuid not null references academies(id),
  actor_id            uuid references profiles(id),
  entity_type         text not null,
  client_generated_id uuid,
  payload             jsonb not null,
  reason              text not null,
  resolved_at         timestamptz,
  created_at          timestamptz not null default now()
);

-- updated_at tenu par la base, jamais par l'application.
create or replace function futuriste.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'academies','profiles','age_groups','teams','players','exercises',
    'training_sessions','player_goals','matches'
  ] loop
    execute format(
      'create trigger %I_touch before update on %I
         for each row execute function futuriste.touch_updated_at()', t, t);
  end loop;
end $$;
