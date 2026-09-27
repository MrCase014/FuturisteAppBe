-- Rendre au coach ce que le cloisonnement par académie lui avait pris.
--
-- RÉGRESSION INTRODUITE PAR UN CORRECTIF DE SÉCURITÉ.
--
-- La migration 20260919000002 a fermé une vraie faille : quinze politiques se
-- contentaient de `is_staff()` sans nommer l'académie, et un directeur pouvait
-- écrire chez le voisin. Le cloisonnement était juste. Mais la réécriture a
-- transformé
--
--     is_staff() OR coaches_player(...)          -- direction OU le coach
--   en
--     is_staff() AND owns_player(...)            -- direction SEULEMENT
--
-- sur NEUF politiques. La condition d'académie a remplacé la branche du coach
-- au lieu de s'y ajouter. Résultat : un coach ne pouvait plus faire l'appel,
-- saisir ses évaluations, valider un objectif, décerner un badge, ni
-- enregistrer sa propre séance. La direction, elle, pouvait tout.
--
-- POURQUOI PERSONNE NE L'A VU PENDANT HUIT JOURS
--
-- Ces tables servent aux phases 7, 8 et 10, pas encore livrées ; aucune
-- n'avait de contrôle de sécurité, faute de données pour en écrire un. La
-- régression n'est apparue qu'en livrant le Session Studio (6.3), qui est la
-- première fonctionnalité où un coach ÉCRIT.
--
-- D'où, en plus du correctif : deux séances dans le jeu de démonstration, des
-- contrôles sur chacun de ces chemins, et un invariant structurel qui refuse
-- désormais qu'une politique du quotidien du coach se limite à la direction.
--
-- LA FORME CORRECTE, à reprendre pour toute politique de ce genre :
--
--     owns_X(...)  AND  ( is_staff()  OR  <branche légitime> )
--      cloisonnement       direction        le coach concerné
--
-- Le cloisonnement s'applique à TOUT LE MONDE ; les rôles se lisent à
-- l'intérieur. Écrire `is_staff() and owns_X(...)` revient à dire que seule la
-- direction existe, ce qui n'est vrai d'aucune de ces tables.

-- ── Les aides manquantes ────────────────────────────────────────────────────
--
-- SECURITY DEFINER avec `search_path` figé, comme les autres : sans cela, la
-- vérification serait elle-même filtrée par RLS, et répondrait « non » pour
-- une raison qui n'a rien à voir avec le droit demandé.

create or replace function futuriste.coaches_session(s uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from training_sessions
     where id = s and team_id is not null and futuriste.coaches_team(team_id));
$$;

create or replace function futuriste.coaches_match(m uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from matches
     where id = m and team_id is not null and futuriste.coaches_team(team_id));
$$;

create or replace function futuriste.coaches_goal(g uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from player_goals where id = g and futuriste.coaches_player(player_id));
$$;

-- L'évaluateur garde 48 heures pour se corriger, puis la note est figée
-- (politique d'origine du 17/09). Passé ce délai, seule la direction touche —
-- une évaluation qu'on peut réécrire indéfiniment n'est plus une trace, c'est
-- un brouillon permanent.
create or replace function futuriste.wrote_evaluation_recently(e uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from player_evaluations
     where id = e and evaluator_id = futuriste.me()
       and created_at > now() - interval '48 hours');
$$;

-- ── Les neuf politiques ─────────────────────────────────────────────────────

-- Présences. C'est le geste le plus fréquent du coach, et il se fait au bord
-- du terrain : le lui refuser vide la phase 7 de son contenu.
drop policy if exists attendance_write on attendance;
create policy attendance_write on attendance
  using (futuriste.owns_player(player_id)
         and (futuriste.is_staff() or futuriste.coaches_player(player_id)))
  with check (futuriste.owns_player(player_id)
              and (futuriste.is_staff() or futuriste.coaches_player(player_id)));

-- Scores d'évaluation. Le cœur du produit : c'est le coach qui évalue, pas la
-- direction. Le délai de 48 heures est rétabli avec.
drop policy if exists pes_write on player_evaluation_scores;
create policy pes_write on player_evaluation_scores
  using (futuriste.owns_evaluation(evaluation_id)
         and (futuriste.is_staff() or futuriste.wrote_evaluation_recently(evaluation_id)))
  with check (futuriste.owns_evaluation(evaluation_id)
              and (futuriste.is_staff() or futuriste.wrote_evaluation_recently(evaluation_id)));

-- Points d'étape d'un objectif : c'est le coach qui suit l'objectif qu'il a
-- posé.
drop policy if exists pgc_write on player_goal_checkins;
create policy pgc_write on player_goal_checkins
  using (futuriste.owns_goal(goal_id)
         and (futuriste.is_staff() or futuriste.coaches_goal(goal_id)))
  with check (futuriste.owns_goal(goal_id)
              and (futuriste.is_staff() or futuriste.coaches_goal(goal_id)));

-- Badges : un badge décerné trois jours plus tard par quelqu'un d'autre ne
-- récompense plus rien.
drop policy if exists player_badges_write on player_badges;
create policy player_badges_write on player_badges
  using (futuriste.owns_player(player_id)
         and (futuriste.is_staff() or futuriste.coaches_player(player_id)))
  with check (futuriste.owns_player(player_id)
              and (futuriste.is_staff() or futuriste.coaches_player(player_id)));

-- Défis : le joueur valide LE SIEN, c'est tout l'intérêt.
drop policy if exists player_challenges_write on player_challenges;
create policy player_challenges_write on player_challenges
  using (futuriste.owns_player(player_id)
         and (futuriste.is_staff()
              or futuriste.coaches_player(player_id)
              or futuriste.is_player(player_id)))
  with check (futuriste.owns_player(player_id)
              and (futuriste.is_staff()
                   or futuriste.coaches_player(player_id)
                   or futuriste.is_player(player_id)));

-- Blocs d'une séance. La régression qui a révélé toutes les autres : sans
-- elle, le Session Studio n'enregistre rien pour un coach.
drop policy if exists session_exercises_write on session_exercises;
create policy session_exercises_write on session_exercises
  using (futuriste.owns_session(session_id)
         and (futuriste.is_staff() or futuriste.coaches_session(session_id)))
  with check (futuriste.owns_session(session_id)
              and (futuriste.is_staff() or futuriste.coaches_session(session_id)));

-- Feuille de match et événements : saisis pendant le match, par qui y est.
drop policy if exists match_events_write on match_events;
create policy match_events_write on match_events
  using (futuriste.owns_match(match_id)
         and (futuriste.is_staff() or futuriste.coaches_match(match_id)))
  with check (futuriste.owns_match(match_id)
              and (futuriste.is_staff() or futuriste.coaches_match(match_id)));

drop policy if exists match_players_write on match_players;
create policy match_players_write on match_players
  using (futuriste.owns_player(player_id)
         and (futuriste.is_staff() or futuriste.coaches_player(player_id)))
  with check (futuriste.owns_player(player_id)
              and (futuriste.is_staff() or futuriste.coaches_player(player_id)));

-- Conflits de synchronisation : chacun voit les SIENS. Le hors-ligne de la
-- phase 7 en dépend — un coach qui ne voit pas son propre conflit ne peut pas
-- le résoudre, et croira que l'application a perdu son travail.
drop policy if exists sync_conflicts_select on sync_conflicts;
create policy sync_conflicts_select on sync_conflicts
  for select
  using (actor_id = futuriste.me()
         or (futuriste.is_staff() and academy_id = futuriste.my_academy()));
