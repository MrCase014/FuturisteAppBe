-- Rattacher les comptes créés dans le tableau de bord à un profil.
-- À exécuter APRÈS 01_academie_reelle.sql, et après avoir créé les comptes
-- dans Authentication → Users → Add user.
--
-- POURQUOI CE FICHIER EXISTE
-- Un compte Supabase n'est qu'une adresse et un mot de passe : il ne dit ni
-- qui vous êtes dans le club, ni ce que vous avez le droit de voir. C'est la
-- ligne `profiles` qui le dit. Sans elle, la connexion réussit puis l'écran
-- renvoie aussitôt vers /connexion — et rien n'explique pourquoi.
--
-- ⚠️ SEUL FICHIER DU DÉPÔT À MODIFIER À LA MAIN AVANT DE L'EXÉCUTER :
--    remplacez les adresses ci-dessous par celles utilisées à la création
--    des comptes. Les prénoms et noms s'afficheront tels quels dans l'app.
--
-- ⚠️ N'ENREGISTREZ JAMAIS de vraies adresses dans ce fichier au moment de
--    le commettre : il est public dans le dépôt. Collez-les dans l'éditeur
--    SQL, exécutez, et laissez le fichier avec ses exemples.
--
-- Le rôle décide de tout : voir la table « CONFIDENTIALITÉ MÉDICALE » de
-- CLAUDE.md. Rappel utile : personne ne peut changer son PROPRE rôle, même
-- président — c'est le garde-fou de la migration 20260919000005. Un
-- changement de rôle se fait par quelqu'un d'autre, ou ici, depuis l'éditeur
-- SQL.

insert into profiles (id, academy_id, role, first_name, last_name, email)
select
  u.id,
  '206d70cf-eedc-4bea-94d5-1d11b6fe6247',   -- académie FUTURISTE (fichier 01)
  v.role::user_role,
  v.first_name,
  v.last_name,
  u.email
from (values
  -- adresse                        rôle                prénom       nom
  ('president@exemple.fr',          'SUPER_ADMIN',      'Prénom',    'Nom'),
  ('medecin@exemple.fr',            'CLUB_DOCTOR',      'Prénom',    'Nom'),
  ('coach@exemple.fr',              'COACH',            'Prénom',    'Nom')
) as v(email, role, first_name, last_name)
join auth.users u on lower(u.email) = lower(v.email)
on conflict (id) do update set
  role       = excluded.role,
  academy_id = excluded.academy_id,
  first_name = excluded.first_name,
  last_name  = excluded.last_name,
  is_active  = true;

-- Contrôle immédiat : trois lignes doivent apparaître, avec le bon rôle.
-- S'il en manque une, l'adresse ne correspond pas à un compte existant.
select p.role, p.first_name, p.last_name, p.email, p.is_active
from profiles p
order by p.role;
