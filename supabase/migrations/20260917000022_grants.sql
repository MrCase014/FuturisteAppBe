-- Privilèges (docs/05).
--
-- RLS ne s'applique qu'aux rôles qui ont déjà un droit sur la table. Sans GRANT,
-- `authenticated` ne lit rien du tout ; avec GRANT seul et sans RLS, il lirait
-- tout. Les deux vont ensemble, et c'est ici qu'on rend le couple explicite
-- plutôt que de dépendre des privilèges par défaut de l'hébergeur.

do $$
begin
  -- Ces rôles existent déjà sur Supabase ; on les crée seulement en local.
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end $$;

grant usage on schema public, futuriste to anon, authenticated;

-- `anon` (visiteur non connecté) : AUCUN droit sur les données.
-- Il n'y a pas d'inscription libre, donc rien à lui montrer (docs/05 §6).
revoke all on all tables in schema public from anon;

grant select, insert, update on all tables in schema public to authenticated;
-- Aucun DELETE, jamais : la suppression est logique (deleted_at), tracée.
revoke delete on all tables in schema public from authenticated;

grant execute on all functions in schema futuriste to authenticated;
grant execute on function auth.uid() to anon, authenticated;

-- Mêmes règles pour les objets créés par les migrations suivantes.
alter default privileges in schema public
  grant select, insert, update on tables to authenticated;
alter default privileges in schema futuriste
  grant execute on functions to authenticated;
