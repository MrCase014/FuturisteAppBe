-- Deux nouveaux rôles : médecin du club et kinésithérapeute.
--
-- Fichier SÉPARÉ de la migration qui s'en sert, volontairement. PostgreSQL
-- refuse d'utiliser une valeur d'enum ajoutée dans la même transaction que son
-- ajout. Les regrouper marcherait en local (psql valide chaque instruction) et
-- échouerait au déploiement (la CLI Supabase enveloppe le fichier dans une
-- transaction) — c'est-à-dire en production, et nulle part ailleurs.

alter type user_role add value if not exists 'CLUB_DOCTOR';
alter type user_role add value if not exists 'PHYSIOTHERAPIST';
