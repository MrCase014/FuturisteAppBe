-- HARNAIS LOCAL UNIQUEMENT — ne fait PAS partie des migrations.
--
-- Supabase fournit le schéma `auth`, la table `auth.users` et la fonction
-- `auth.uid()`. Pour vérifier le schéma et les politiques RLS sur un
-- PostgreSQL nu (sans Docker), on les reproduit à l'identique côté signature.
--
-- `auth.uid()` lit ici un paramètre de session que les tests positionnent :
--   set local request.jwt.claim.sub = '<uuid>';
-- C'est exactement le mécanisme utilisé par Supabase.

create schema if not exists auth;

create table if not exists auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text unique
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
