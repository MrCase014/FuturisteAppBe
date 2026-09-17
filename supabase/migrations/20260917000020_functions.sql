-- Fonctions d'aide à la sécurité (docs/05 §3).
--
-- Écrites UNE fois, réutilisées par chaque politique. Si la logique change,
-- elle change à un seul endroit. Toutes sont SECURITY DEFINER : elles doivent
-- pouvoir lire les tables de rattachement même quand l'appelant, lui, ne le
-- peut pas — sinon les politiques tourneraient en rond.

create or replace function futuriste.my_role() returns user_role
language sql stable security definer set search_path = public, pg_temp as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function futuriste.my_academy() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select academy_id from profiles where id = auth.uid();
$$;

create or replace function futuriste.is_staff() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select role in ('SUPER_ADMIN','ACADEMY_DIRECTOR') from profiles where id = auth.uid()),
    false);
$$;

create or replace function futuriste.is_super_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select role = 'SUPER_ADMIN' from profiles where id = auth.uid()), false);
$$;

-- Le coach est-il affecté à cette équipe ?
create or replace function futuriste.coaches_team(p_team uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from team_coaches tc
    where tc.team_id = p_team and tc.coach_id = auth.uid()
  );
$$;

-- Le coach a-t-il ce joueur dans l'une de ses équipes ?
create or replace function futuriste.coaches_player(p_player uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from player_team_memberships ptm
    join team_coaches tc on tc.team_id = ptm.team_id
    where ptm.player_id = p_player
      and ptm.is_active
      and tc.coach_id = auth.uid()
  );
$$;

-- Suis-je le parent ou tuteur légal de ce joueur ?
-- La condition sur consent_data_at n'est pas décorative : sans consentement,
-- la base ne répond rien, même si l'écran est ouvert (docs/12 §2).
create or replace function futuriste.is_guardian_of(p_player uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from player_guardians pg
    where pg.player_id = p_player
      and pg.guardian_id = auth.uid()
      and pg.consent_data_at is not null
  );
$$;

-- Suis-je ce joueur ?
create or replace function futuriste.is_player(p_player uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from players p where p.id = p_player and p.profile_id = auth.uid()
  );
$$;

-- Ai-je un droit de lecture quelconque sur ce joueur ?
create or replace function futuriste.can_read_player(p_player uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select
       (futuriste.is_staff() and exists (
          select 1 from players p
          where p.id = p_player and p.academy_id = futuriste.my_academy()))
    or futuriste.coaches_player(p_player)
    or futuriste.is_guardian_of(p_player)
    or futuriste.is_player(p_player);
$$;

-- Le PLAYER DNA est masqué en U7/U9 et jamais visible du parent (docs/11 §9).
create or replace function futuriste.can_read_player_dna(p_player uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select
    case
      when futuriste.is_staff() and exists (
             select 1 from players p
             where p.id = p_player and p.academy_id = futuriste.my_academy()) then true
      when futuriste.coaches_player(p_player) then true
      when futuriste.is_player(p_player) then true
      else false      -- le parent, explicitement, jamais
    end;
$$;

-- Âge révolu d'un joueur. L'âge n'est pas stocké : il se calcule.
create or replace function futuriste.player_age(p_player uuid) returns int
language sql stable security definer set search_path = public, pg_temp as $$
  select extract(year from age(current_date, birth_date))::int
  from players where id = p_player;
$$;
