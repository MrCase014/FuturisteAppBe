-- Les données médicales des enfants sortent de la table `players`.
--
-- FAILLE CORRIGÉE ICI. Le commentaire de la migration 04 annonçait
-- « direction uniquement » pour `medical_notes`, et la vue
-- `v_players_coach_safe` les omettait soigneusement. Mais RLS filtre des
-- LIGNES, pas des COLONNES : rien n'empêchait un coach de lire la table
-- directement. Reproduit avant correction — un coach a lu
-- « ASTHME - inhalateur dans le sac » sur un joueur de son équipe.
--
-- Ce n'est pas théorique : la clé publique du navigateur suffit à interroger
-- l'API REST, sans passer par l'application. La vue ne protégeait donc rien —
-- elle demandait seulement à l'application d'être polie.
--
-- Des privilèges de colonne ne règlent pas le problème : directeur et coach
-- partagent le même rôle PostgreSQL (`authenticated`), les deux seraient
-- traités pareil. La seule frontière que RLS sait défendre est la ligne. Ces
-- données deviennent donc leur propre table.
--
-- Décision du fondateur du 16/09 (docs/16) : poids et taille sont fermés par
-- défaut, réservés aux U15+, et invisibles du joueur comme du parent.

create table player_medical (
  player_id     uuid primary key references players(id) on delete cascade,
  academy_id    uuid not null references academies(id),
  medical_notes text,
  height_cm     int check (height_cm between 80 and 230),
  weight_kg     numeric(5,2) check (weight_kg between 15 and 150),
  updated_by    uuid references profiles(id),
  updated_at    timestamptz not null default now()
);

create index player_medical_academy_idx on player_medical (academy_id);

alter table player_medical enable row level security;

-- Seule la direction, et seulement dans son académie. `is_staff()` ne couvre
-- que SUPER_ADMIN et ACADEMY_DIRECTOR : les coachs, les joueurs et les parents
-- n'obtiennent aucune ligne — pas une ligne vide, aucune ligne.
create policy player_medical_select on player_medical
  for select
  using (futuriste.is_staff() and academy_id = futuriste.my_academy());

create policy player_medical_insert on player_medical
  for insert
  with check (futuriste.is_staff() and academy_id = futuriste.my_academy());

-- WITH CHECK explicite : sans lui, PostgreSQL réutilise le USING, et une
-- ligne pourrait être déplacée vers une autre académie (docs/16, faille du 18/09).
create policy player_medical_update on player_medical
  for update
  using (futuriste.is_staff() and academy_id = futuriste.my_academy())
  with check (futuriste.is_staff() and academy_id = futuriste.my_academy());

-- Reprise des données existantes avant suppression des colonnes.
insert into player_medical (player_id, academy_id, medical_notes, height_cm, weight_kg)
select id, academy_id, medical_notes, height_cm, weight_kg
from players
where medical_notes is not null or height_cm is not null or weight_kg is not null;

alter table players
  drop column medical_notes,
  drop column height_cm,
  drop column weight_kg;

-- La vue coach n'avait déjà pas ces colonnes ; elle reste inchangée et devient
-- redondante avec la sécurité réelle — ce qui est le bon sens de la
-- redondance : l'application peut se tromper, la base ne cède pas.

grant select, insert, update on player_medical to authenticated;
