-- Vues de tableau de bord (docs/04 §12).
-- On calcule DANS la base, pas dans le téléphone : le radar d'un joueur est
-- 8 lignes, pas 200 évaluations transférées.
--
-- security_invoker : la vue applique les politiques RLS de l'appelant,
-- elle n'est pas une porte dérobée.

-- Vue coach : medical_notes, height_cm et weight_kg sont VOLONTAIREMENT absents.
-- RLS filtre des lignes, pas des colonnes ; c'est la vue qui protège la colonne.
create view v_players_coach_safe with (security_invoker = true) as
select id, academy_id, profile_id, first_name, last_name, birth_date, gender,
       photo_url, dominant_foot, preferred_position, experienced_positions,
       jersey_number, joined_at, status, objectives_note, observations,
       extract(year from age(current_date, birth_date))::int as age
from players
where deleted_at is null;

-- Radar 8 domaines d'un joueur, prêt à afficher.
create view v_player_domain_levels with (security_invoker = true) as
select pe.player_id,
       c.domain_id,
       round(avg(pes.level)::numeric, 2) as avg_level,
       count(*)                          as sample_size,
       max(pe.evaluated_at)              as last_evaluated_at
from player_evaluation_scores pes
join player_evaluations pe on pe.id = pes.evaluation_id
join competencies c        on c.id  = pes.competency_id
group by pe.player_id, c.domain_id;

-- Taux de présence par joueur.
create view v_player_attendance with (security_invoker = true) as
select a.player_id,
       count(*) filter (where a.status in ('PRESENT','LATE'))            as attended,
       count(*)                                                          as total,
       round(100.0 * count(*) filter (where a.status in ('PRESENT','LATE'))
             / nullif(count(*), 0), 1)                                   as attendance_rate,
       count(*) filter (where a.status = 'LATE')                         as late_count
from attendance a
group by a.player_id;

-- Points faibles d'une équipe → alimente le Session Studio.
-- C'est cette vue qui fait que le Studio propose ce dont CE groupe a besoin.
create view v_team_weakest_competencies with (security_invoker = true) as
select ptm.team_id,
       pes.competency_id,
       round(avg(pes.level)::numeric, 2)   as avg_level,
       count(distinct pe.player_id)        as players_count
from player_evaluation_scores pes
join player_evaluations pe  on pe.id = pes.evaluation_id
join player_team_memberships ptm
  on ptm.player_id = pe.player_id and ptm.is_active
where pe.evaluated_at > now() - interval '90 days'
group by ptm.team_id, pes.competency_id
having count(distinct pe.player_id) >= 3;

-- Objectifs actifs par équipe et par compétence : le bonus +3 du moteur de
-- séances (docs/01 §6C) se lit ici.
create view v_team_active_goals with (security_invoker = true) as
select ptm.team_id,
       g.competency_id,
       count(distinct g.player_id) as players_with_goal
from player_goals g
join player_team_memberships ptm
  on ptm.player_id = g.player_id and ptm.is_active
where g.status = 'ACTIVE' and g.competency_id is not null
group by ptm.team_id, g.competency_id;

-- Chiffres du tableau de bord directeur.
create view v_academy_overview with (security_invoker = true) as
select ac.id as academy_id,
  (select count(*) from players p
     where p.academy_id = ac.id and p.status = 'ACTIVE' and p.deleted_at is null)
    as players_count,
  (select count(*) from profiles pr
     where pr.academy_id = ac.id and pr.role = 'COACH' and pr.is_active)
    as coaches_count,
  (select count(*) from teams t where t.academy_id = ac.id)               as teams_count,
  (select count(*) from age_groups g where g.academy_id = ac.id and g.is_active)
    as age_groups_count,
  (select count(*) from training_sessions s
     where s.academy_id = ac.id and s.scheduled_at > now() - interval '30 days')
    as sessions_30d,
  (select count(*) from player_goals g
     where g.academy_id = ac.id and g.status = 'ACTIVE')                  as active_goals
from academies ac;
