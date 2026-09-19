-- Cloisonner par académie TOUTES les politiques qui se contentaient de
-- `futuriste.is_staff()`.
--
-- FAILLE SYSTÉMIQUE CORRIGÉE ICI. `is_staff()` répond « cette personne
-- dirige-t-elle une académie ? » — pas « laquelle ». Quinze politiques, sur
-- treize tables, s'en contentaient. Reproduit avant correction : le directeur
-- de FUTURISTE a rattaché un de ses joueurs à l'équipe d'une AUTRE académie,
-- et la base a accepté.
--
-- Le modèle économique est la revente de la plateforme à d'autres académies
-- (docs/16, ADR-08) : deux clients concurrents cohabitent donc dans la même
-- base. Une écriture qui traverse cette frontière n'est pas un détail de
-- permissions, c'est une fuite entre clients — et il s'agit de données
-- d'enfants.
--
-- C'est la troisième faille de cette famille (après player_evaluations le
-- 18/09 et audit_logs). D'où, en fin de fichier, un invariant structurel qui
-- refuse désormais qu'une politique cite `is_staff()` sans nommer l'académie :
-- corriger la classe, pas seulement les cas.
--
-- Aucune de ces tables ne porte `academy_id` : le rattachement passe par le
-- parent. Les fonctions ci-dessous sont SECURITY DEFINER, comme les aides
-- existantes, pour que la vérification ne soit pas elle-même filtrée par RLS.

create or replace function futuriste.owns_player(p uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from players where id = p and academy_id = futuriste.my_academy());
$$;

create or replace function futuriste.owns_team(t uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from teams where id = t and academy_id = futuriste.my_academy());
$$;

create or replace function futuriste.owns_profile(p uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from profiles where id = p and academy_id = futuriste.my_academy());
$$;

create or replace function futuriste.owns_competency(c uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from competencies where id = c and academy_id = futuriste.my_academy());
$$;

create or replace function futuriste.owns_evaluation(e uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from player_evaluations where id = e and academy_id = futuriste.my_academy());
$$;

create or replace function futuriste.owns_goal(g uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from player_goals where id = g and academy_id = futuriste.my_academy());
$$;

create or replace function futuriste.owns_session(s uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from training_sessions where id = s and academy_id = futuriste.my_academy());
$$;

create or replace function futuriste.owns_match(m uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from matches where id = m and academy_id = futuriste.my_academy());
$$;

-- ---------------------------------------------------------------------------
-- Réécriture des politiques. Chacune garde son intention d'origine ; on y
-- ajoute seulement « ... et dans MON académie ».
-- ---------------------------------------------------------------------------

drop policy if exists ptm_write on player_team_memberships;
create policy ptm_write on player_team_memberships
  using (futuriste.is_staff() and futuriste.owns_player(player_id) and futuriste.owns_team(team_id))
  with check (
    futuriste.is_staff() and futuriste.owns_player(player_id) and futuriste.owns_team(team_id));

drop policy if exists team_coaches_write on team_coaches;
create policy team_coaches_write on team_coaches
  using (futuriste.is_staff() and futuriste.owns_team(team_id) and futuriste.owns_profile(coach_id))
  with check (
    futuriste.is_staff() and futuriste.owns_team(team_id) and futuriste.owns_profile(coach_id));

drop policy if exists team_coaches_select on team_coaches;
create policy team_coaches_select on team_coaches
  for select
  using (coach_id = auth.uid() or (futuriste.is_staff() and futuriste.owns_team(team_id)));

drop policy if exists attendance_write on attendance;
create policy attendance_write on attendance
  using (futuriste.is_staff() and futuriste.owns_player(player_id))
  with check (futuriste.is_staff() and futuriste.owns_player(player_id));

drop policy if exists player_badges_write on player_badges;
create policy player_badges_write on player_badges
  using (futuriste.is_staff() and futuriste.owns_player(player_id))
  with check (futuriste.is_staff() and futuriste.owns_player(player_id));

drop policy if exists player_challenges_write on player_challenges;
create policy player_challenges_write on player_challenges
  using (futuriste.is_staff() and futuriste.owns_player(player_id))
  with check (futuriste.is_staff() and futuriste.owns_player(player_id));

drop policy if exists player_guardians_write on player_guardians;
create policy player_guardians_write on player_guardians
  using (futuriste.is_staff() and futuriste.owns_player(player_id))
  with check (
    futuriste.is_staff() and futuriste.owns_player(player_id)
    and futuriste.owns_profile(guardian_id));

-- Lecture des rattachements familiaux : un parent voit les siens, la direction
-- ceux de son académie. Sans le cadrage, un directeur lisait les familles
-- d'une académie concurrente.
drop policy if exists player_guardians_select on player_guardians;
create policy player_guardians_select on player_guardians
  for select
  using (guardian_id = auth.uid() or (futuriste.is_staff() and futuriste.owns_player(player_id)));

drop policy if exists competency_levels_write on competency_levels;
create policy competency_levels_write on competency_levels
  using (futuriste.is_staff() and futuriste.owns_competency(competency_id))
  with check (futuriste.is_staff() and futuriste.owns_competency(competency_id));

drop policy if exists pes_write on player_evaluation_scores;
create policy pes_write on player_evaluation_scores
  using (futuriste.is_staff() and futuriste.owns_evaluation(evaluation_id))
  with check (futuriste.is_staff() and futuriste.owns_evaluation(evaluation_id));

drop policy if exists pgc_write on player_goal_checkins;
create policy pgc_write on player_goal_checkins
  using (futuriste.is_staff() and futuriste.owns_goal(goal_id))
  with check (futuriste.is_staff() and futuriste.owns_goal(goal_id));

drop policy if exists session_exercises_write on session_exercises;
create policy session_exercises_write on session_exercises
  using (futuriste.is_staff() and futuriste.owns_session(session_id))
  with check (futuriste.is_staff() and futuriste.owns_session(session_id));

drop policy if exists match_events_write on match_events;
create policy match_events_write on match_events
  using (futuriste.is_staff() and futuriste.owns_match(match_id))
  with check (futuriste.is_staff() and futuriste.owns_match(match_id));

drop policy if exists match_players_write on match_players;
create policy match_players_write on match_players
  using (futuriste.is_staff() and futuriste.owns_match(match_id))
  with check (futuriste.is_staff() and futuriste.owns_match(match_id));

-- sync_conflicts porte academy_id : le cadrage y est direct.
drop policy if exists sync_conflicts_select on sync_conflicts;
create policy sync_conflicts_select on sync_conflicts
  for select
  using (futuriste.is_staff() and academy_id = futuriste.my_academy());
