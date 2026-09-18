-- Durcissement des politiques UPDATE avant mise en production.
--
-- CONSTAT (vérifié, pas supposé) : un directeur pouvait déplacer une évaluation
-- vers une AUTRE académie. Reproduit sur la base de démonstration :
--   update player_evaluations set academy_id = '<autre académie>'  →  4 lignes.
-- Le même essai sur `players` était refusé.
--
-- CAUSE : quand une politique UPDATE n'a pas de clause WITH CHECK, PostgreSQL
-- réutilise son USING pour valider la nouvelle ligne. C'est ce qui protégeait
-- `players`, dont le USING contient `academy_id = my_academy()`. Mais le USING
-- de `player_evaluations_update` ne contenait aucune condition d'académie :
-- `futuriste.is_staff()` seul suffisait, et rien n'empêchait donc de réécrire
-- `academy_id`.
--
-- PORTÉE : cloisonnement entre académies. Sans conséquence tant qu'une seule
-- académie existe, mais la revente à d'autres académies est le modèle
-- économique prévu (ADR-08) : une fuite inter-académies serait alors une fuite
-- de données de mineurs entre deux clients.
--
-- CORRECTION : toute politique UPDATE porte désormais un WITH CHECK EXPLICITE.
-- Se reposer sur le repli implicite de PostgreSQL est un pari sur ce que le
-- prochain relecteur saura ; l'écrire noir sur blanc n'en est pas un.
-- Un test structurel (supabase/tests) refuse désormais toute politique UPDATE
-- sans WITH CHECK, pour que la faille ne puisse pas revenir.

-- ── players ────────────────────────────────────────────────────────────────
drop policy if exists players_update on players;
create policy players_update on players for update
  using  (futuriste.is_staff() and academy_id = futuriste.my_academy())
  with check (futuriste.is_staff() and academy_id = futuriste.my_academy());

-- ── academies ──────────────────────────────────────────────────────────────
drop policy if exists academies_update on academies;
create policy academies_update on academies for update
  using  (futuriste.is_staff() and id = futuriste.my_academy())
  with check (futuriste.is_staff() and id = futuriste.my_academy());

-- ── exercises ──────────────────────────────────────────────────────────────
drop policy if exists exercises_update on exercises;
create policy exercises_update on exercises for update
  using (
    academy_id = futuriste.my_academy()
    and (futuriste.is_staff() or created_by = auth.uid())
  )
  with check (
    academy_id = futuriste.my_academy()
    and (futuriste.is_staff() or created_by = auth.uid())
  );

-- ── training_sessions ──────────────────────────────────────────────────────
drop policy if exists training_sessions_update on training_sessions;
create policy training_sessions_update on training_sessions for update
  using (
    academy_id = futuriste.my_academy()
    and (futuriste.is_staff() or (team_id is not null and futuriste.coaches_team(team_id)))
  )
  with check (
    academy_id = futuriste.my_academy()
    and (futuriste.is_staff() or (team_id is not null and futuriste.coaches_team(team_id)))
  );

-- ── player_evaluations ─────────────────────────────────────────────────────
-- La politique fautive. Deux changements :
--   1. l'académie est vérifiée à la lecture ET à l'écriture ;
--   2. la fenêtre de 48 h (ADR-09) reste inchangée pour l'auteur.
drop policy if exists player_evaluations_update on player_evaluations;
create policy player_evaluations_update on player_evaluations for update
  using (
    academy_id = futuriste.my_academy()
    and (
      (evaluator_id = auth.uid() and created_at > now() - interval '48 hours')
      or futuriste.is_staff()
    )
  )
  with check (
    academy_id = futuriste.my_academy()
    and (
      (evaluator_id = auth.uid() and created_at > now() - interval '48 hours')
      or futuriste.is_staff()
    )
  );
