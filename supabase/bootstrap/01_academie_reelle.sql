-- Amorçage de la base de PRODUCTION — à exécuter UNE fois.
-- GÉNÉRÉ par supabase/seed/generate.mjs — ne pas éditer à la main.
--
-- Où : tableau de bord Supabase → SQL Editor → New query → coller → Run.
-- Ce fichier ne contient AUCUNE donnée personnelle : seulement l'académie
-- et ses catégories d'âge. Les comptes se créent ensuite (voir CLAUDE.md,
-- « CRÉER LES PREMIERS COMPTES RÉELS »).

insert into academies (id, name, slug, country, city) values
  ('206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'FUTURISTE ACADÉMIE FC', 'futuriste', 'Cameroun', 'Yaoundé')
on conflict (id) do nothing;

insert into age_groups (id, academy_id, code, label_fr, min_age, max_age,
  order_index, session_duration_min, sessions_per_week, complexity_level, objectives) values
  ('f47ca6b2-a376-4833-baf3-2d7a0165683b', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U7', 'U7 · 6-7 ans', 6, 7, 1, 60, 2, 1, 'Le plaisir et le ballon'),
  ('9ecd5d38-b847-411a-b177-d6ec197ec929', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U9', 'U9 · 8-9 ans', 8, 9, 2, 75, 2, 2, 'Oser et répéter'),
  ('63b4bdb2-3e28-44a5-9212-8e7ec9ef9618', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U11', 'U11 · 10-11 ans', 10, 11, 3, 90, 3, 3, 'Voir avant de recevoir'),
  ('5bedcdf6-5c85-4516-8626-d97012597655', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U13', 'U13 · 12-13 ans', 12, 13, 4, 90, 3, 4, 'Comprendre le jeu'),
  ('d102bc09-44fd-417f-bbcd-f683b9f11c4e', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U15', 'U15 · 14-15 ans', 14, 15, 5, 100, 4, 4, 'Intensité et compétition'),
  ('ceaaac69-1088-4dc3-9af4-238351c44013', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U16', 'U16 · 16 ans', 16, 16, 6, 100, 4, 5, 'Vers la performance'),
  ('c287dda8-5f73-4030-9fbf-49f2021b625f', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U18', 'U18 · 17-18 ans', 17, 18, 7, 105, 5, 5, 'Le joueur autonome')
on conflict (academy_id, code) do nothing;

-- La méthodologie FUTURISTE par catégorie (docs/11 §5). La direction la
-- modifie ensuite depuis l'écran Catégories : ces lignes sont un point de
-- départ, pas une vérité figée.
insert into methodology (id, academy_id, age_group_id, section, title_fr, body_fr, order_index) values
  ('96fb93b6-5860-47ff-8448-9104fe3bb212', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   'f47ca6b2-a376-4833-baf3-2d7a0165683b', 'PRIORITES',
   'Priorités', 'Motricité globale, coordination, relation au ballon, 1 contre 1, plaisir. À cet âge, l''enfant apprend en jouant : chaque minute sans ballon est une minute perdue.', 0),
  ('b73174f9-a548-47b3-a0dd-49781e55a2fe', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   'f47ca6b2-a376-4833-baf3-2d7a0165683b', 'FORMAT',
   'Format de jeu', '3 contre 3 ou 4 contre 4. Beaucoup de buts, beaucoup de ballons, des équipes qui changent souvent.', 1),
  ('99652918-ea3c-4c34-b33a-9b9114eb2ec7', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   'f47ca6b2-a376-4833-baf3-2d7a0165683b', 'EVALUATION',
   'Évaluation', 'Qualitative uniquement. Aucune note n''est affichée — ni au joueur, ni à la famille. On décrit ce que l''enfant a osé, pas ce qu''il vaut.', 2),
  ('6467d1ca-37d4-46ea-b079-57c21766ac1e', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   'f47ca6b2-a376-4833-baf3-2d7a0165683b', 'INTERDITS',
   'Ce qu''on ne fait pas en U7', 'Statistiques. Postes fixes. Travail physique sans ballon. Discours longs.', 3),
  ('62a02153-526e-4b62-8608-1dc6a42dc94e', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '9ecd5d38-b847-411a-b177-d6ec197ec929', 'PRIORITES',
   'Priorités', 'Technique de base, dribble, courage, pied faible, petits jeux. On encourage la tentative ratée plus que la passe facile.', 0),
  ('1b274590-87db-41ad-a67f-7e2a4e67904c', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '9ecd5d38-b847-411a-b177-d6ec197ec929', 'FORMAT',
   'Format de jeu', '4 contre 4 ou 5 contre 5. Duels, parcours ludiques.', 1),
  ('0e8ee32a-c521-49fa-9c50-0db85dd0140a', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '9ecd5d38-b847-411a-b177-d6ec197ec929', 'EVALUATION',
   'Évaluation', '8 compétences au maximum. Échelle 1 à 5, visible du coach seul.', 2),
  ('6d75abef-2040-4286-a52f-d09d646359a1', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '9ecd5d38-b847-411a-b177-d6ec197ec929', 'REPERE',
   'Nouveauté de la catégorie', 'Premier objectif MY NEXT LEVEL : un seul, choisi avec l''enfant.', 3),
  ('3ed229f4-258c-4464-9e32-206e63eeb395', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '63b4bdb2-3e28-44a5-9212-8e7ec9ef9618', 'PRIORITES',
   'Priorités', 'Contrôle orienté, prise d''information, décision, occupation de l''espace.', 0),
  ('62ef7c88-746e-4d51-b7bd-48b68c6409cf', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '63b4bdb2-3e28-44a5-9212-8e7ec9ef9618', 'FORMAT',
   'Format de jeu', '5 contre 5 ou 7 contre 7. Rondos, jeux de position simples.', 1),
  ('e3c3bf31-a6fa-4a74-a1d8-f32f1518c45e', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '63b4bdb2-3e28-44a5-9212-8e7ec9ef9618', 'EVALUATION',
   'Évaluation', 'Les 8 domaines. Le radar devient visible du joueur et de sa famille.', 2),
  ('79822e00-cb07-4c06-962f-2b6fdbe44597', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '63b4bdb2-3e28-44a5-9212-8e7ec9ef9618', 'REPERE',
   'La charnière', 'C''est ici que le joueur apprend à REGARDER AVANT DE RECEVOIR. Tout le reste de sa formation en dépend : corrigez le regard avant le geste.', 3),
  ('5d5ee7fd-8710-4882-b01b-19140b9edfa4', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '5bedcdf6-5c85-4516-8626-d97012597655', 'PRIORITES',
   'Priorités', 'Jeu de position, largeur, profondeur, transitions, tactique collective.', 0),
  ('9482eba6-6f3c-4d85-8701-42e394096cbf', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '5bedcdf6-5c85-4516-8626-d97012597655', 'FORMAT',
   'Format de jeu', '8 contre 8 ou 11 contre 11. Jeux de position 4 contre 4 plus 3, situations réelles de match.', 1),
  ('1c02b788-f8a2-4dd6-9343-6de0828ffe89', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   '5bedcdf6-5c85-4516-8626-d97012597655', 'REPERE',
   'Nouveauté de la catégorie', 'PLAYER DNA activé. Statistiques de match complètes.', 2),
  ('77fcef0c-f859-45e9-8558-5fe9a11e896c', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   'd102bc09-44fd-417f-bbcd-f683b9f11c4e', 'PRIORITES',
   'Priorités', 'Intensité, vitesse, physique AVEC ballon, tactique, compétition.', 0),
  ('de003d97-d678-403d-83a0-8a92b66df60a', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   'd102bc09-44fd-417f-bbcd-f683b9f11c4e', 'REPERE',
   'Attention', 'Pic de croissance : surveiller la charge et adapter individuellement. Un joueur qui grandit vite n''est pas un joueur qui régresse.', 1),
  ('6549323a-abaf-4e0d-a516-883a8276a7b8', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   'ceaaac69-1088-4dc3-9af4-238351c44013', 'PRIORITES',
   'Priorités', 'Spécialisation progressive, analyse du jeu, autonomie, préparation physique.', 0),
  ('1adb5cb1-e38d-4901-a7cf-e4a4505fa910', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   'c287dda8-5f73-4030-9fbf-49f2021b625f', 'PRIORITES',
   'Priorités', 'Performance, analyse vidéo, autonomie, projet de vie.', 0),
  ('0a29e0f8-dc12-4dc9-a95a-b46df9268738', '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
   'c287dda8-5f73-4030-9fbf-49f2021b625f', 'REPERE',
   'Sortie de formation', 'Dossier de développement FUTURISTE : douze ans de données réunies en un document que le joueur emporte.', 1)
on conflict (id) do nothing;
