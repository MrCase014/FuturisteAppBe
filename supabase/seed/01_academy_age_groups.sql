-- 01 · Académie et catégories
-- GÉNÉRÉ par supabase/seed/generate.mjs — ne pas éditer à la main.
-- Toutes les personnes sont fictives (docs/12 §9).

insert into academies (id, name, slug, country, city) values
  ('206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'FUTURISTE ACADÉMIE FC', 'futuriste', 'Cameroun', 'Yaoundé');

insert into age_groups (id, academy_id, code, label_fr, min_age, max_age,
  order_index, session_duration_min, sessions_per_week, complexity_level, objectives) values
  ('f47ca6b2-a376-4833-baf3-2d7a0165683b', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U7', 'U7 · 6-7 ans', 6, 7, 1, 60, 2, 1, 'Le plaisir et le ballon'),
  ('9ecd5d38-b847-411a-b177-d6ec197ec929', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U9', 'U9 · 8-9 ans', 8, 9, 2, 75, 2, 2, 'Oser et répéter'),
  ('63b4bdb2-3e28-44a5-9212-8e7ec9ef9618', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U11', 'U11 · 10-11 ans', 10, 11, 3, 90, 3, 3, 'Voir avant de recevoir'),
  ('5bedcdf6-5c85-4516-8626-d97012597655', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U13', 'U13 · 12-13 ans', 12, 13, 4, 90, 3, 4, 'Comprendre le jeu'),
  ('d102bc09-44fd-417f-bbcd-f683b9f11c4e', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U15', 'U15 · 14-15 ans', 14, 15, 5, 100, 4, 4, 'Intensité et compétition'),
  ('ceaaac69-1088-4dc3-9af4-238351c44013', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U16', 'U16 · 16 ans', 16, 16, 6, 100, 4, 5, 'Vers la performance'),
  ('c287dda8-5f73-4030-9fbf-49f2021b625f', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'U18', 'U18 · 17-18 ans', 17, 18, 7, 105, 5, 5, 'Le joueur autonome');
