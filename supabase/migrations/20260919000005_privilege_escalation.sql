-- Élévation de privilèges : un compte ne change pas son propre rôle.
--
-- CE QUI ÉTAIT OUVERT
-- La politique `profiles_update_self` autorisait chacun à modifier SA ligne
-- de profil, colonne par colonne indifférenciée. Or `role` est une colonne de
-- cette ligne. Un parent pouvait donc écrire :
--
--     update profiles set role = 'CLUB_DOCTOR' where id = auth.uid();
--
-- et lire, la seconde d'après, les notes cliniques des vingt-quatre enfants.
-- Reproduit avant correction : 3 dossiers cliniques lus, dont
-- « Asthme léger — inhalateur dans le sac ».
--
-- Toute la confidentialité médicale de la migration 20260919000004 reposait
-- sur le rôle ; tant que le rôle est modifiable par son porteur, elle ne
-- protège rien. Une serrure dont chacun peut se fabriquer la clé.
--
-- CE QUE CE FICHIER FERME
-- 1. Les colonnes qui portent un privilège — `role`, `academy_id`,
--    `is_active` — ne se modifient plus soi-même, jamais.
-- 2. Elles ne se modifient que par un membre de la direction de la MÊME
--    académie, et le rang de super administrateur ne se donne que par un
--    super administrateur.
-- 3. Un compte désactivé ne lit plus rien : `is_active` cesse d'être une
--    simple consigne d'affichage pour devenir une condition de la base.
--
-- POURQUOI UN DÉCLENCHEUR ET NON UN `with check`
-- Une politique ne voit que la ligne d'arrivée : elle ne peut pas dire si le
-- rôle a changé, seulement ce qu'il vaut. Comparer l'avant et l'après demande
-- `old` et `new`, donc un déclencheur. C'est la seule façon d'autoriser la
-- correction d'un numéro de téléphone tout en refusant la promotion glissée
-- dans la même requête.

-- ─────────────────── 1 · Un compte désactivé perd ses droits ────────────────
-- Retirer quelqu'un de l'académie doit couper l'accès à la BASE, pas seulement
-- masquer les écrans : un jeton reste valide plusieurs heures après le retrait.
--
-- `futuriste.me()` remplace `auth.uid()` partout où une identité ouvre des
-- droits. Un compte désactivé n'est alors plus « quelqu'un aux droits
-- réduits » : il n'est plus personne, et chaque fonction d'aide le constate
-- au même endroit. Mesuré : sans cette fonction, un coach désactivé lisait
-- encore ses 10 joueurs, parce que son droit vient de `team_coaches` et non
-- de son rôle.

create or replace function futuriste.me() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select id from profiles where id = auth.uid() and is_active;
$$;

create or replace function futuriste.my_role() returns user_role
language sql stable security definer set search_path = public, pg_temp as $$
  select role from profiles where id = auth.uid() and is_active;
$$;

create or replace function futuriste.my_academy() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select academy_id from profiles where id = auth.uid() and is_active;
$$;

create or replace function futuriste.is_staff() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select role in ('SUPER_ADMIN','ACADEMY_DIRECTOR')
       from profiles where id = auth.uid() and is_active),
    false);
$$;

create or replace function futuriste.is_super_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select role = 'SUPER_ADMIN' from profiles where id = auth.uid() and is_active),
    false);
$$;

create or replace function futuriste.is_medical() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select role in ('CLUB_DOCTOR','PHYSIOTHERAPIST')
       from profiles where id = auth.uid() and is_active),
    false);
$$;

-- Les droits qui ne viennent pas du rôle mais d'un rattachement : équipe
-- entraînée, enfant dont on est le tuteur, compte joueur. Mêmes fonctions
-- qu'à l'origine, `auth.uid()` remplacé par `futuriste.me()`.

create or replace function futuriste.coaches_team(p_team uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from team_coaches tc
    where tc.team_id = p_team and tc.coach_id = futuriste.me()
  );
$$;

create or replace function futuriste.coaches_player(p_player uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from player_team_memberships ptm
    join team_coaches tc on tc.team_id = ptm.team_id
    where ptm.player_id = p_player
      and ptm.is_active
      and tc.coach_id = futuriste.me()
  );
$$;

create or replace function futuriste.is_guardian_of(p_player uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from player_guardians pg
    where pg.player_id = p_player
      and pg.guardian_id = futuriste.me()
      and pg.consent_data_at is not null
  );
$$;

create or replace function futuriste.is_player(p_player uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from players p where p.id = p_player and p.profile_id = futuriste.me()
  );
$$;

-- Les deux politiques qui lisaient `auth.uid()` en direct : un compte retiré
-- n'a plus à savoir quelles équipes il entraînait ni quels enfants il suivait.
drop policy if exists team_coaches_select on team_coaches;
create policy team_coaches_select on team_coaches
  for select
  using (coach_id = futuriste.me() or (futuriste.is_staff() and futuriste.owns_team(team_id)));

drop policy if exists player_guardians_select on player_guardians;
create policy player_guardians_select on player_guardians
  for select
  using (guardian_id = futuriste.me() or (futuriste.is_staff() and futuriste.owns_player(player_id)));

-- ──────────────────── 2 · Les colonnes de privilège sont gelées ─────────────

create or replace function futuriste.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor      uuid := auth.uid();
  actor_role user_role;
begin
  -- Hors session authentifiée (migrations, seed, administration directe par
  -- la direction depuis le tableau de bord Supabase), auth.uid() est nul.
  -- Ces chemins-là sont déjà réservés aux détenteurs des clés du projet.
  if actor is null then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'Un profil ne change pas d''identifiant.' using errcode = '42501';
  end if;

  -- Rien de sensible n'a bougé : prénom, téléphone, avatar, langue.
  if new.role       is not distinct from old.role
 and new.academy_id is not distinct from old.academy_id
 and new.is_active  is not distinct from old.is_active then
    return new;
  end if;

  if actor = old.id then
    raise exception
      'Personne ne modifie son propre rôle, son académie ni son activation.'
      using errcode = '42501';
  end if;

  select role into actor_role from profiles where id = actor and is_active;

  if actor_role is null or actor_role not in ('SUPER_ADMIN','ACADEMY_DIRECTOR') then
    raise exception 'Seule la direction modifie les privilèges d''un compte.'
      using errcode = '42501';
  end if;

  if (new.role = 'SUPER_ADMIN' or old.role = 'SUPER_ADMIN')
     and actor_role <> 'SUPER_ADMIN' then
    raise exception 'Seul un super administrateur accorde ou retire ce rang.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileges on profiles;
create trigger profiles_guard_privileges
  before update on profiles
  for each row
  execute function futuriste.guard_profile_privileges();

-- ─────────────── 3 · La politique dit désormais ce qu'elle protège ──────────
-- Le `with check` reste (invariant structurel du harnais de tests) ; le
-- déclencheur ci-dessus ajoute ce qu'une politique ne sait pas exprimer.

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

comment on function futuriste.guard_profile_privileges() is
  'Interdit l''auto-promotion : role, academy_id et is_active ne se modifient pas soi-même.';
