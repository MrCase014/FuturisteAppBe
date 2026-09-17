-- 03 · Personnes, équipes et rattachements
-- GÉNÉRÉ par supabase/seed/generate.mjs — ne pas éditer à la main.
-- Toutes les personnes sont fictives (docs/12 §9).

-- En production, les comptes sont créés par la direction via invitation :
-- il n'y a PAS d'inscription libre (docs/05 §6). Ces lignes auth.users
-- n'existent que pour le développement local et la recette.
insert into auth.users (id, email) values
  ('7e0eaa16-951d-47bf-81bf-175a7324554e', 'directeur@test.futuriste.fc'),
  ('d3ea82dc-7f60-417f-9844-e32a162189e8', 'coach1@test.futuriste.fc'),
  ('a18172e5-d998-4c41-bf7d-cef831ad4831', 'coach2@test.futuriste.fc'),
  ('7bd2148c-4469-42d3-bc8c-e7de3990cff7', 'coach3@test.futuriste.fc'),
  ('9f80d2fe-d71b-49db-ae19-90f5a3246b73', 'parenta@test.futuriste.fc'),
  ('d13704fa-3f0c-47f3-8f45-231179e9563c', 'parentb@test.futuriste.fc'),
  ('0fec749e-bb14-4677-b8fd-718bad65e3c8', 'parentc@test.futuriste.fc'),
  ('721531eb-651a-43cb-9f9c-3567dbc20da1', 'joueur@test.futuriste.fc'),
  ('b663b709-ae2d-466d-9a3e-b6a185db7c1b', 'outsider@test.autre-academie.fc');

-- Seconde académie : elle ne sert qu'à prouver qu'aucune donnée ne fuit
-- d'une académie à l'autre (test de sécurité n°11).
insert into academies (id, name, slug, country) values
  ('3c7171ab-5133-4d6c-acd8-1d57244eda02', 'AUTRE ACADÉMIE (test)', 'autre-academie', 'Cameroun');

insert into profiles (id, academy_id, role, first_name, last_name, email) values
  ('7e0eaa16-951d-47bf-81bf-175a7324554e', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'ACADEMY_DIRECTOR', 'Amadou', 'Bello', 'directeur@test.futuriste.fc'),
  ('d3ea82dc-7f60-417f-9844-e32a162189e8', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'COACH', 'Aminata', 'Bakayoko', 'coach1@test.futuriste.fc'),
  ('a18172e5-d998-4c41-bf7d-cef831ad4831', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'COACH', 'Joseph', 'Ndiaye', 'coach2@test.futuriste.fc'),
  ('7bd2148c-4469-42d3-bc8c-e7de3990cff7', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'COACH', 'Fatou', 'Camara', 'coach3@test.futuriste.fc'),
  ('9f80d2fe-d71b-49db-ae19-90f5a3246b73', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'PARENT', 'Moussa', 'Diallo', 'parenta@test.futuriste.fc'),
  ('d13704fa-3f0c-47f3-8f45-231179e9563c', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'PARENT', 'Clarisse', 'Mbarga', 'parentb@test.futuriste.fc'),
  ('0fec749e-bb14-4677-b8fd-718bad65e3c8', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'PARENT', 'Serge', 'Toure', 'parentc@test.futuriste.fc'),
  ('721531eb-651a-43cb-9f9c-3567dbc20da1', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'PLAYER', 'Omar', 'Sarr', 'joueur@test.futuriste.fc'),
  ('b663b709-ae2d-466d-9a3e-b6a185db7c1b', '3c7171ab-5133-4d6c-acd8-1d57244eda02', 'ACADEMY_DIRECTOR', 'Directeur', 'Autre', 'outsider@test.autre-academie.fc');

insert into teams (id, academy_id, age_group_id, name, season, gender) values
  ('1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', '63b4bdb2-3e28-44a5-9212-8e7ec9ef9618', 'U11 Filles A', '2026-2027', 'F'),
  ('4d0909a4-8581-40e1-8937-36202eb24c0f', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', '5bedcdf6-5c85-4516-8626-d97012597655', 'U13 Mixte A', '2026-2027', 'MIXED');

-- Pivot de la sécurité coach : un coach ne voit QUE ces équipes.
insert into team_coaches (team_id, coach_id) values
  ('1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', 'd3ea82dc-7f60-417f-9844-e32a162189e8'),
  ('4d0909a4-8581-40e1-8937-36202eb24c0f', 'a18172e5-d998-4c41-bf7d-cef831ad4831');

insert into players (id, academy_id, first_name, last_name, birth_date, gender, dominant_foot, jersey_number) values
  ('a63da1de-c32d-4006-b99b-bfb943cbd2ff', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Sekou', 'Diallo', '2015-01-01', 'F', 'LEFT', 1),
  ('9657ad71-fe8e-4082-a7f3-7788d195ad7e', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Awa', 'Traore', '2015-02-02', 'F', 'RIGHT', 2),
  ('98d34003-0a86-4065-9a62-57024b67b202', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Ibrahim', 'Keita', '2015-03-03', 'F', 'RIGHT', 3),
  ('1a4a7d43-52fd-4d3e-9948-c140f203b747', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Nadia', 'Mbarga', '2015-04-04', 'F', 'LEFT', 4),
  ('382fb6ca-ec92-4cba-bfb2-09bcc20bc0c6', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Yann', 'Fofana', '2015-05-05', 'F', 'RIGHT', 5),
  ('78bbf40b-7457-42e5-a742-9fd411db4f24', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Mariam', 'Sow', '2015-06-06', 'F', 'RIGHT', 6),
  ('67508511-d58a-497a-9f0a-4bd3c8c33a5c', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Eric', 'Nkemba', '2015-07-07', 'F', 'LEFT', 7),
  ('7b499289-2e49-4ff0-8f3b-f6e33cefeab8', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Aisha', 'Barry', '2015-08-08', 'F', 'RIGHT', 8),
  ('529e3ff9-cde0-49ea-9a9c-f5dd7a477221', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Paul', 'Cisse', '2015-09-09', 'F', 'RIGHT', 9),
  ('65ec076e-1849-4f0c-93e1-f7f8ec2e7c60', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Bintou', 'Toure', '2015-10-10', 'F', 'LEFT', 10),
  ('07c176ee-ca9c-47b6-a2b5-f26ebe2fa816', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Omar', 'Sarr', '2013-11-11', 'M', 'RIGHT', 11),
  ('b9e083b6-c05e-4145-8fa6-30902c3bd8bc', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Sofia', 'Bamba', '2013-12-12', 'F', 'RIGHT', 12),
  ('6ca98c6f-5d17-41b2-a7e5-8a6bdc7dbd7d', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Jean', 'Ondo', '2013-01-13', 'M', 'LEFT', 13),
  ('31987918-3456-4689-b4f7-a2b404532a6e', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Kadi', 'Diop', '2013-02-14', 'F', 'RIGHT', 14),
  ('5071e0a5-9157-4800-964a-73c4f339c169', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Thomas', 'Essomba', '2013-03-15', 'M', 'RIGHT', 15),
  ('f2495f04-f16a-4fe1-a834-6f00bd9bc6ef', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Rama', 'Gueye', '2013-04-16', 'F', 'LEFT', 16),
  ('cae6faf3-9962-4198-b9b4-3cc6708fe823', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Lucas', 'Kone', '2013-05-17', 'M', 'RIGHT', 17),
  ('3cf3ad49-c9a6-46e4-98f7-59f7ca9b8d61', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Nabou', 'Ba', '2013-06-18', 'F', 'RIGHT', 18),
  ('d3c0e720-51e0-4fee-8335-f883e2afa659', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Elie', 'Manga', '2013-07-19', 'M', 'LEFT', 19),
  ('8c9f56ec-577a-4ef4-b960-ee29316df50d', '206d70cf-eedc-4bea-94d5-1d11b6fe6247', 'Zara', 'Sylla', '2013-08-20', 'F', 'RIGHT', 20);

-- Le joueur n°10 a un compte : c'est lui qui sert au test n°7.
update players set profile_id = '721531eb-651a-43cb-9f9c-3567dbc20da1' where id = '07c176ee-ca9c-47b6-a2b5-f26ebe2fa816';

insert into player_team_memberships (id, player_id, team_id, season) values
  ('9567456a-8c84-4270-a9d3-aafaeb653f6a', 'a63da1de-c32d-4006-b99b-bfb943cbd2ff', '1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '2026-2027'),
  ('3f9c589c-f6ba-4b9e-aa56-3aff52282485', '9657ad71-fe8e-4082-a7f3-7788d195ad7e', '1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '2026-2027'),
  ('95a655d3-e301-4933-9e82-b1813dd46104', '98d34003-0a86-4065-9a62-57024b67b202', '1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '2026-2027'),
  ('79f3bff9-d712-443c-8594-fe27b74d305c', '1a4a7d43-52fd-4d3e-9948-c140f203b747', '1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '2026-2027'),
  ('8a37314b-5aae-4f39-b796-39da62f12fea', '382fb6ca-ec92-4cba-bfb2-09bcc20bc0c6', '1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '2026-2027'),
  ('84233dab-1e1a-409e-a457-b96383e97fac', '78bbf40b-7457-42e5-a742-9fd411db4f24', '1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '2026-2027'),
  ('3ae40e8c-d98d-419a-9119-70990adf9548', '67508511-d58a-497a-9f0a-4bd3c8c33a5c', '1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '2026-2027'),
  ('d1df6ca7-cc2c-4937-aec2-7c3ace787372', '7b499289-2e49-4ff0-8f3b-f6e33cefeab8', '1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '2026-2027'),
  ('14fe3a67-a9b4-4187-bec2-78c2641cdb5d', '529e3ff9-cde0-49ea-9a9c-f5dd7a477221', '1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '2026-2027'),
  ('d97ceea9-7715-4236-8abb-54174b6c55f8', '65ec076e-1849-4f0c-93e1-f7f8ec2e7c60', '1ae5ddb0-bdea-4f4c-a8d2-7a36dad9373b', '2026-2027'),
  ('b02cea32-10b9-415f-b3a5-7dd8c942a3bd', '07c176ee-ca9c-47b6-a2b5-f26ebe2fa816', '4d0909a4-8581-40e1-8937-36202eb24c0f', '2026-2027'),
  ('9df30fe7-62f3-4e4f-9f34-602d6177d369', 'b9e083b6-c05e-4145-8fa6-30902c3bd8bc', '4d0909a4-8581-40e1-8937-36202eb24c0f', '2026-2027'),
  ('30b99fa1-48ad-4837-99ed-ae61b1ce09d1', '6ca98c6f-5d17-41b2-a7e5-8a6bdc7dbd7d', '4d0909a4-8581-40e1-8937-36202eb24c0f', '2026-2027'),
  ('44bf9cad-75ff-4baf-81b0-194e41d5e068', '31987918-3456-4689-b4f7-a2b404532a6e', '4d0909a4-8581-40e1-8937-36202eb24c0f', '2026-2027'),
  ('989814a5-a90e-4719-a1b8-f8f8c69820fb', '5071e0a5-9157-4800-964a-73c4f339c169', '4d0909a4-8581-40e1-8937-36202eb24c0f', '2026-2027'),
  ('718a1a1c-6360-43e1-8940-237bf9c3b20e', 'f2495f04-f16a-4fe1-a834-6f00bd9bc6ef', '4d0909a4-8581-40e1-8937-36202eb24c0f', '2026-2027'),
  ('e7817a8b-f159-4c3b-9779-344241ed3d15', 'cae6faf3-9962-4198-b9b4-3cc6708fe823', '4d0909a4-8581-40e1-8937-36202eb24c0f', '2026-2027'),
  ('9d4a96f8-bf3b-449a-817d-ac5919404637', '3cf3ad49-c9a6-46e4-98f7-59f7ca9b8d61', '4d0909a4-8581-40e1-8937-36202eb24c0f', '2026-2027'),
  ('0999e997-f8e1-4de0-b8af-8f47a154a404', 'd3c0e720-51e0-4fee-8335-f883e2afa659', '4d0909a4-8581-40e1-8937-36202eb24c0f', '2026-2027'),
  ('943ce2c6-7619-4387-98e2-5c39514309e5', '8c9f56ec-577a-4ef4-b960-ee29316df50d', '4d0909a4-8581-40e1-8937-36202eb24c0f', '2026-2027');

-- Consentements : parentA et parentB ont consenti, parentC PAS ENCORE.
-- Ce dernier cas est celui du test de sécurité n°12.
insert into player_guardians (id, player_id, guardian_id, relationship, is_primary, consent_data_at, consent_media_at) values
  ('1ac22d83-fffd-4101-a6ae-67c52b7ebdc7', 'a63da1de-c32d-4006-b99b-bfb943cbd2ff', '9f80d2fe-d71b-49db-ae19-90f5a3246b73', 'Père', true, now(), now()),
  ('227b32a8-cd26-42c3-a92e-f12bc54afe44', '07c176ee-ca9c-47b6-a2b5-f26ebe2fa816', 'd13704fa-3f0c-47f3-8f45-231179e9563c', 'Mère', true, now(), now()),
  ('7e212cec-ff19-4953-9269-98715eda7856', '9657ad71-fe8e-4082-a7f3-7788d195ad7e', '0fec749e-bb14-4677-b8fd-718bad65e3c8', 'Père', true, null, null);
