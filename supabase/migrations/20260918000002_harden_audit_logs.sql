-- Durcissement du journal d'audit.
--
-- FAILLE CORRIGÉE ICI : la politique d'insertion était `with check (true)`.
-- N'importe quel compte authentifié — un parent, un joueur — pouvait écrire
-- une entrée arbitraire, pour n'importe quelle académie, en l'attribuant à
-- n'importe qui. Reproduit avant correction : un parent a inséré
-- « PLAYER_DELETED » au nom du directeur, dans une autre académie.
--
-- Un journal d'audit falsifiable est plus dangereux qu'un journal absent :
-- on s'y fie. En cas de litige sur des données d'enfants, il servirait de
-- preuve — et cette preuve pouvait être fabriquée par la personne visée.
--
-- Deuxième correction : le journal n'était lisible que par le super
-- administrateur. Le directeur d'académie, à qui l'écran D26 le destine
-- (docs/06), ne pouvait pas le consulter. L'écran demandé par l'architecture
-- était donc irréalisable.

drop policy if exists audit_logs_insert on audit_logs;

-- On n'écrit que dans SON académie, et qu'en SON nom.
-- auth.uid() vient du jeton signé : il n'est pas fourni par le client.
create policy audit_logs_insert on audit_logs
  for insert
  with check (
    academy_id = futuriste.my_academy()
    and actor_id = auth.uid()
  );

drop policy if exists audit_logs_select on audit_logs;

-- Le directeur lit le journal de son académie ; le super administrateur, tout.
-- Les coachs et les familles n'y ont pas accès : is_staff() ne couvre que
-- SUPER_ADMIN et ACADEMY_DIRECTOR.
create policy audit_logs_select on audit_logs
  for select
  using (
    futuriste.is_super_admin()
    or (futuriste.is_staff() and academy_id = futuriste.my_academy())
  );

-- Le journal ne se modifie pas et ne s'efface pas : c'est ce qui en fait un
-- journal. Aucune politique UPDATE ni DELETE n'est créée, donc RLS les refuse
-- à tout le monde, y compris au directeur.
