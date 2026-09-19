-- ⚠️ LE FICHIER LE PLUS IMPORTANT DU PROJET (docs/05).
--
-- La sécurité vit ici, dans PostgreSQL, pas dans les écrans. Quand le parent de
-- Sekou demande la liste des joueurs, la base lui renvoie UNE ligne. Les autres
-- n'ont jamais quitté le serveur.
--
-- Règle absolue : aucune table sans RLS, aucune table sans test.

-- ───────────────────────── Académie et référentiel ─────────────────────────
-- Lisible par tous les membres de l'académie, écrit par la direction.

alter table academies enable row level security;
create policy academies_select on academies for select
  using (id = futuriste.my_academy());
create policy academies_update on academies for update
  using (futuriste.is_staff() and id = futuriste.my_academy());
create policy academies_insert on academies for insert
  with check (futuriste.is_super_admin());

alter table academy_settings enable row level security;
create policy academy_settings_select on academy_settings for select
  using (academy_id = futuriste.my_academy());
create policy academy_settings_write on academy_settings for all
  using (futuriste.is_staff() and academy_id = futuriste.my_academy())
  with check (futuriste.is_staff() and academy_id = futuriste.my_academy());

do $$
declare t text;
begin
  -- Tables de référentiel : même schéma de droits partout.
  foreach t in array array['age_groups','development_domains','competencies',
                           'badges','challenges','methodology'] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_select on %I for select using (academy_id = futuriste.my_academy())', t, t);
    execute format(
      'create policy %I_write on %I for all
         using (futuriste.is_staff() and academy_id = futuriste.my_academy())
         with check (futuriste.is_staff() and academy_id = futuriste.my_academy())', t, t);
  end loop;
end $$;

-- competency_levels n'a pas d'academy_id : ses droits suivent sa compétence.
alter table competency_levels enable row level security;
create policy competency_levels_select on competency_levels for select using (
  competency_id is null
  or exists (select 1 from competencies c
             where c.id = competency_id and c.academy_id = futuriste.my_academy())
);
create policy competency_levels_write on competency_levels for all
  using (futuriste.is_staff()) with check (futuriste.is_staff());

-- ───────────────────────────────── Personnes ────────────────────────────────

alter table profiles enable row level security;
create policy profiles_select on profiles for select using (
     id = auth.uid()
  or (futuriste.is_staff() and academy_id = futuriste.my_academy())
  or (futuriste.my_role() = 'COACH' and academy_id = futuriste.my_academy()
      and role in ('COACH','ACADEMY_DIRECTOR'))
);
create policy profiles_update_self on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_write_staff on profiles for all
  using (futuriste.is_staff() and academy_id = futuriste.my_academy())
  with check (futuriste.is_staff() and academy_id = futuriste.my_academy());

alter table players enable row level security;
create policy players_select on players for select
  using (deleted_at is null and futuriste.can_read_player(id));
create policy players_insert on players for insert
  with check (futuriste.is_staff() and academy_id = futuriste.my_academy());
create policy players_update on players for update
  using (futuriste.is_staff() and academy_id = futuriste.my_academy());
-- Aucune politique DELETE : la suppression physique est impossible.
-- On passe par deleted_at, tracé dans audit_logs (docs/12 §7).

alter table player_team_memberships enable row level security;
create policy ptm_select on player_team_memberships for select
  using (futuriste.can_read_player(player_id));
create policy ptm_write on player_team_memberships for all
  using (futuriste.is_staff()) with check (futuriste.is_staff());

alter table player_guardians enable row level security;
create policy player_guardians_select on player_guardians for select using (
     guardian_id = auth.uid()
  or futuriste.is_staff()
  or futuriste.coaches_player(player_id)
);
create policy player_guardians_write on player_guardians for all
  using (futuriste.is_staff()) with check (futuriste.is_staff());

alter table teams enable row level security;
create policy teams_select on teams for select using (
     (futuriste.is_staff() and academy_id = futuriste.my_academy())
  or futuriste.coaches_team(id)
  or exists (select 1 from player_team_memberships ptm
             where ptm.team_id = teams.id and ptm.is_active
               and futuriste.can_read_player(ptm.player_id))
);
create policy teams_write on teams for all
  using (futuriste.is_staff() and academy_id = futuriste.my_academy())
  with check (futuriste.is_staff() and academy_id = futuriste.my_academy());

alter table team_coaches enable row level security;
create policy team_coaches_select on team_coaches for select
  using (coach_id = auth.uid() or futuriste.is_staff());
create policy team_coaches_write on team_coaches for all
  using (futuriste.is_staff()) with check (futuriste.is_staff());

-- ─────────────────────────── Bibliothèque et séances ────────────────────────

alter table exercises enable row level security;
create policy exercises_select on exercises for select
  using (deleted_at is null and academy_id = futuriste.my_academy());
create policy exercises_insert on exercises for insert with check (
  academy_id = futuriste.my_academy()
  and (futuriste.is_staff() or futuriste.my_role() = 'COACH')
  and created_by = auth.uid()
);
create policy exercises_update on exercises for update
  using (academy_id = futuriste.my_academy()
         and (futuriste.is_staff() or created_by = auth.uid()));

-- Médias et schémas : lecture par toute l'académie, écriture staff ou coach.
alter table exercise_media enable row level security;
create policy exercise_media_select on exercise_media for select
  using (academy_id = futuriste.my_academy());
create policy exercise_media_write on exercise_media for all
  using (academy_id = futuriste.my_academy()
         and (futuriste.is_staff() or uploaded_by = auth.uid()))
  with check (academy_id = futuriste.my_academy()
              and (futuriste.is_staff() or futuriste.my_role() = 'COACH'));

alter table exercise_diagrams enable row level security;
create policy exercise_diagrams_select on exercise_diagrams for select
  using (academy_id = futuriste.my_academy());
create policy exercise_diagrams_write on exercise_diagrams for all
  using (academy_id = futuriste.my_academy()
         and (futuriste.is_staff() or created_by = auth.uid()))
  with check (academy_id = futuriste.my_academy()
              and (futuriste.is_staff() or futuriste.my_role() = 'COACH'));

alter table session_templates enable row level security;
create policy session_templates_select on session_templates for select
  using (academy_id = futuriste.my_academy());
create policy session_templates_write on session_templates for all
  using (academy_id = futuriste.my_academy()
         and (futuriste.is_staff() or futuriste.my_role() = 'COACH'))
  with check (academy_id = futuriste.my_academy()
              and (futuriste.is_staff() or futuriste.my_role() = 'COACH'));

alter table training_sessions enable row level security;
create policy training_sessions_select on training_sessions for select using (
     (futuriste.is_staff() and academy_id = futuriste.my_academy())
  or (team_id is not null and futuriste.coaches_team(team_id))
  or coach_id = auth.uid()
  or exists (select 1 from player_team_memberships ptm
             where ptm.team_id = training_sessions.team_id and ptm.is_active
               and (futuriste.is_player(ptm.player_id)
                    or futuriste.is_guardian_of(ptm.player_id)))
);
create policy training_sessions_insert on training_sessions for insert with check (
  academy_id = futuriste.my_academy()
  and (futuriste.is_staff() or (team_id is not null and futuriste.coaches_team(team_id)))
);
create policy training_sessions_update on training_sessions for update using (
  academy_id = futuriste.my_academy()
  and (futuriste.is_staff() or (team_id is not null and futuriste.coaches_team(team_id)))
);

-- session_exercises n'a pas d'academy_id : ses droits suivent sa séance.
alter table session_exercises enable row level security;
create policy session_exercises_select on session_exercises for select
  using (exists (select 1 from training_sessions s where s.id = session_id));
create policy session_exercises_write on session_exercises for all using (
  exists (select 1 from training_sessions s
          where s.id = session_id
            and (futuriste.is_staff() or (s.team_id is not null and futuriste.coaches_team(s.team_id))))
) with check (
  exists (select 1 from training_sessions s
          where s.id = session_id
            and (futuriste.is_staff() or (s.team_id is not null and futuriste.coaches_team(s.team_id))))
);

-- ──────────────────────────────── Développement ─────────────────────────────

alter table player_evaluations enable row level security;
create policy player_evaluations_select on player_evaluations for select using (
     (futuriste.is_staff() and academy_id = futuriste.my_academy())
  or futuriste.coaches_player(player_id)
  or (futuriste.is_guardian_of(player_id) and is_visible_to_parent)
  or (futuriste.is_player(player_id) and is_visible_to_player)
);
-- Le coach signe en son nom, jamais au nom d'un autre.
create policy player_evaluations_insert on player_evaluations for insert with check (
  evaluator_id = auth.uid()
  and academy_id = futuriste.my_academy()
  and (futuriste.coaches_player(player_id) or futuriste.is_staff())
);
-- ADR-09 : 48 heures. Une évaluation est une trace de développement ;
-- réécrivable six mois plus tard, la courbe ne veut plus rien dire.
create policy player_evaluations_update on player_evaluations for update using (
     (evaluator_id = auth.uid() and created_at > now() - interval '48 hours')
  or futuriste.is_staff()
);

alter table player_evaluation_scores enable row level security;
create policy pes_select on player_evaluation_scores for select
  using (exists (select 1 from player_evaluations e where e.id = evaluation_id));
create policy pes_write on player_evaluation_scores for all using (
  exists (select 1 from player_evaluations e
          where e.id = evaluation_id
            and ((e.evaluator_id = auth.uid() and e.created_at > now() - interval '48 hours')
                 or futuriste.is_staff()))
) with check (
  exists (select 1 from player_evaluations e
          where e.id = evaluation_id
            and ((e.evaluator_id = auth.uid() and e.created_at > now() - interval '48 hours')
                 or futuriste.is_staff()))
);

alter table player_goals enable row level security;
create policy player_goals_select on player_goals for select
  using (futuriste.can_read_player(player_id));
-- Le parent ne coache pas : aucune écriture ne lui est ouverte.
create policy player_goals_write on player_goals for all
  using (futuriste.is_staff() or futuriste.coaches_player(player_id))
  with check ((futuriste.is_staff() or futuriste.coaches_player(player_id))
              and academy_id = futuriste.my_academy());

alter table player_goal_checkins enable row level security;
create policy pgc_select on player_goal_checkins for select
  using (exists (select 1 from player_goals g where g.id = goal_id));
create policy pgc_write on player_goal_checkins for all using (
  exists (select 1 from player_goals g
          where g.id = goal_id
            and (futuriste.is_staff() or futuriste.coaches_player(g.player_id)))
) with check (
  exists (select 1 from player_goals g
          where g.id = goal_id
            and (futuriste.is_staff() or futuriste.coaches_player(g.player_id)))
);

alter table player_development_snapshots enable row level security;
create policy pds_select on player_development_snapshots for select
  using (futuriste.can_read_player(player_id));

alter table player_dna_profiles enable row level security;
create policy dna_select on player_dna_profiles for select using (
  futuriste.can_read_player_dna(player_id)
  and confidence >= 0.6                                   -- seuil de confiance
  and futuriste.player_age(player_id) >= 10               -- désactivé U7/U9
);

-- ──────────────────────── Calendrier, présences, matchs ─────────────────────

alter table events enable row level security;
create policy events_select on events for select using (
     (futuriste.is_staff() and academy_id = futuriste.my_academy())
  or (team_id is not null and futuriste.coaches_team(team_id))
  or exists (select 1 from player_team_memberships ptm
             where ptm.team_id = events.team_id and ptm.is_active
               and futuriste.can_read_player(ptm.player_id))
);
create policy events_write on events for all using (
  academy_id = futuriste.my_academy()
  and (futuriste.is_staff() or (team_id is not null and futuriste.coaches_team(team_id)))
) with check (
  academy_id = futuriste.my_academy()
  and (futuriste.is_staff() or (team_id is not null and futuriste.coaches_team(team_id)))
);

alter table attendance enable row level security;
create policy attendance_select on attendance for select
  using (futuriste.can_read_player(player_id));
create policy attendance_write on attendance for all
  using (futuriste.is_staff() or futuriste.coaches_player(player_id))
  with check (futuriste.is_staff() or futuriste.coaches_player(player_id));

alter table matches enable row level security;
create policy matches_select on matches for select using (
     (futuriste.is_staff() and academy_id = futuriste.my_academy())
  or futuriste.coaches_team(team_id)
  or exists (select 1 from player_team_memberships ptm
             where ptm.team_id = matches.team_id and ptm.is_active
               and futuriste.can_read_player(ptm.player_id))
);
create policy matches_write on matches for all
  using (academy_id = futuriste.my_academy()
         and (futuriste.is_staff() or futuriste.coaches_team(team_id)))
  with check (academy_id = futuriste.my_academy()
              and (futuriste.is_staff() or futuriste.coaches_team(team_id)));

alter table match_players enable row level security;
create policy match_players_select on match_players for select
  using (futuriste.can_read_player(player_id));
create policy match_players_write on match_players for all
  using (futuriste.is_staff() or futuriste.coaches_player(player_id))
  with check (futuriste.is_staff() or futuriste.coaches_player(player_id));

alter table match_events enable row level security;
create policy match_events_select on match_events for select
  using (exists (select 1 from matches m where m.id = match_id));
create policy match_events_write on match_events for all using (
  exists (select 1 from matches m
          where m.id = match_id and (futuriste.is_staff() or futuriste.coaches_team(m.team_id)))
) with check (
  exists (select 1 from matches m
          where m.id = match_id and (futuriste.is_staff() or futuriste.coaches_team(m.team_id)))
);

alter table player_statistics enable row level security;
create policy player_statistics_select on player_statistics for select
  using (futuriste.can_read_player(player_id));

-- ──────────────────────── Engagement et communication ───────────────────────

alter table player_badges enable row level security;
create policy player_badges_select on player_badges for select
  using (futuriste.can_read_player(player_id));
create policy player_badges_write on player_badges for all
  using (futuriste.is_staff() or futuriste.coaches_player(player_id))
  with check (futuriste.is_staff() or futuriste.coaches_player(player_id));

alter table player_challenges enable row level security;
create policy player_challenges_select on player_challenges for select
  using (futuriste.can_read_player(player_id));
create policy player_challenges_write on player_challenges for all
  using (futuriste.is_staff() or futuriste.coaches_player(player_id)
         or futuriste.is_player(player_id))
  with check (futuriste.is_staff() or futuriste.coaches_player(player_id)
              or futuriste.is_player(player_id));

alter table family_resources enable row level security;
create policy family_resources_select on family_resources for select using (
  academy_id = futuriste.my_academy()
  and (is_published or futuriste.is_staff())
);
create policy family_resources_write on family_resources for all
  using (futuriste.is_staff() and academy_id = futuriste.my_academy())
  with check (futuriste.is_staff() and academy_id = futuriste.my_academy());

alter table announcements enable row level security;
create policy announcements_select on announcements for select using (
  academy_id = futuriste.my_academy()
  and (published_at is not null or futuriste.is_staff() or author_id = auth.uid())
  and (audience = 'ALL'
       or (audience = 'COACHES'  and futuriste.my_role() in ('COACH','ACADEMY_DIRECTOR','SUPER_ADMIN'))
       or (audience = 'PARENTS'  and futuriste.my_role() = 'PARENT')
       or (audience = 'PLAYERS'  and futuriste.my_role() = 'PLAYER')
       or futuriste.is_staff())
);
create policy announcements_write on announcements for all
  using (academy_id = futuriste.my_academy()
         and (futuriste.is_staff() or author_id = auth.uid()))
  with check (academy_id = futuriste.my_academy()
              and (futuriste.is_staff() or author_id = auth.uid()));

alter table notifications enable row level security;
create policy notifications_select on notifications for select
  using (profile_id = auth.uid());
create policy notifications_update on notifications for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ───────────────────────────── Système et IA ────────────────────────────────

alter table ai_requests enable row level security;
create policy ai_requests_select on ai_requests for select
  using (actor_id = auth.uid() or (futuriste.is_staff() and academy_id = futuriste.my_academy()));

alter table video_analysis_jobs enable row level security;
create policy video_jobs_select on video_analysis_jobs for select
  using (futuriste.is_staff() and academy_id = futuriste.my_academy());

-- Journal d'audit : insertion seule, lecture super admin.
-- Aucune politique UPDATE ni DELETE : un journal qui se réécrit n'en est pas un.
alter table audit_logs enable row level security;
create policy audit_logs_select on audit_logs for select
  using (futuriste.is_super_admin());
create policy audit_logs_insert on audit_logs for insert with check (true);

alter table sync_conflicts enable row level security;
create policy sync_conflicts_select on sync_conflicts for select
  using (actor_id = auth.uid() or futuriste.is_staff());
create policy sync_conflicts_insert on sync_conflicts for insert
  with check (actor_id = auth.uid());
