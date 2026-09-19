-- 04 · Évaluations, objectifs et PLAYER DNA
-- GÉNÉRÉ par supabase/seed/generate.mjs — ne pas éditer à la main.
-- Toutes les personnes sont fictives (docs/12 §9).

insert into player_evaluations (id, academy_id, player_id, evaluator_id, engagement, qualitative_comment, is_visible_to_parent) values
  ('6ba3a937-9fe7-4329-bdeb-1e92dac016c8', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'a63da1de-c32d-4006-b99b-bfb943cbd2ff', 'd3ea82dc-7f60-417f-9844-e32a162189e8', 3,
   'Regarde rarement avant de recevoir, mais a progressé sur le côté droit.', true),
  ('9c679b6c-8b82-46a8-8120-8211e54f2ba8', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', '9657ad71-fe8e-4082-a7f3-7788d195ad7e', 'd3ea82dc-7f60-417f-9844-e32a162189e8', 4,
   'Beaucoup d''initiative en 1v1. À canaliser vers la passe quand la solution existe.', true),
  ('c8f73e09-f18c-41ef-b6d1-1f5d538f4ff3', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', '07c176ee-ca9c-47b6-a2b5-f26ebe2fa816', 'a18172e5-d998-4c41-bf7d-cef831ad4831', 4,
   'Bonne lecture des intervalles. Le pied faible reste à construire.', false);

-- Évaluation volontairement ancienne : au-delà des 48 h, son auteur
-- lui-même ne peut plus la modifier (ADR-09). C'est le test n°8.
insert into player_evaluations (id, academy_id, player_id, evaluator_id, engagement,
  qualitative_comment, created_at, evaluated_at) values
  ('a54776b9-300d-431a-bcfa-6b61b7ca7a0e', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'a63da1de-c32d-4006-b99b-bfb943cbd2ff', 'd3ea82dc-7f60-417f-9844-e32a162189e8', 3,
   'Séance du mois dernier.', now() - interval '10 days', now() - interval '10 days');

insert into player_evaluation_scores (id, evaluation_id, competency_id, level) values
  ('302be773-1cfc-4a18-97e7-a98142b0a6c4', '6ba3a937-9fe7-4329-bdeb-1e92dac016c8', '6edbf51a-da8d-492b-bdb8-bd6c73595782', 2),
  ('19310266-c39b-4133-87f9-3249ef0953d5', '6ba3a937-9fe7-4329-bdeb-1e92dac016c8', '74c2b098-6cf7-400b-adff-65ef66bfc604', 3),
  ('284f1de3-fee7-479d-9fdc-76bda0994f23', '9c679b6c-8b82-46a8-8120-8211e54f2ba8', '0fc690dc-84c7-4821-82d3-9cec61d1efb6', 4),
  ('2c6a2d66-3e99-40d6-9e45-ccbd237b110b', 'c8f73e09-f18c-41ef-b6d1-1f5d538f4ff3', '03f57ee6-aba4-493d-bca7-7672f0299960', 4),
  ('439ef61c-a29e-43a2-af0b-d2622fb21668', 'c8f73e09-f18c-41ef-b6d1-1f5d538f4ff3', 'bdc26cdf-6242-4451-b010-035b0902da63', 2);

-- MY NEXT LEVEL : 3 objectifs actifs maximum, la règle est en base.
insert into player_goals (id, academy_id, player_id, competency_id, title, progress_pct, created_by, source_evaluation_id) values
  ('8eb044d9-62ec-40a5-a301-f6d568da5163', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'a63da1de-c32d-4006-b99b-bfb943cbd2ff', '6edbf51a-da8d-492b-bdb8-bd6c73595782',
   'Regarder autour de soi avant de recevoir', 60, 'd3ea82dc-7f60-417f-9844-e32a162189e8', '6ba3a937-9fe7-4329-bdeb-1e92dac016c8'),
  ('4ed446f7-5e1c-435b-a1d7-72d0a35268e1', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'a63da1de-c32d-4006-b99b-bfb943cbd2ff', '74c2b098-6cf7-400b-adff-65ef66bfc604',
   'Réussir mon contrôle orienté côté gauche', 35, 'd3ea82dc-7f60-417f-9844-e32a162189e8', null),
  ('e3d1f3c3-fcac-4ad8-9e8c-fc4c362f816c', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', '07c176ee-ca9c-47b6-a2b5-f26ebe2fa816', 'bdc26cdf-6242-4451-b010-035b0902da63',
   'Faire 5 passes du pied gauche par match', 20, 'a18172e5-d998-4c41-bf7d-cef831ad4831', null);

-- PLAYER DNA : profil affichable seulement au-dessus de 0,6 de confiance
-- et jamais en U7/U9. Le second est volontairement sous le seuil.
insert into player_dna_profiles (id, player_id, primary_archetype, confidence) values
  ('78131a26-ab0c-4736-8d58-4bcb5a04af2d', '07c176ee-ca9c-47b6-a2b5-f26ebe2fa816', 'TRANSITION', 0.72),
  ('f603a23b-1aa2-4b33-8f0b-7921e5ab2698', 'a63da1de-c32d-4006-b99b-bfb943cbd2ff', 'CREATEUR', 0.31);
