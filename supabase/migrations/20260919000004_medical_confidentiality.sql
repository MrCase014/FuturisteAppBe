-- Confidentialité médicale : qui voit quoi, et pourquoi.
--
-- Le club dispose désormais d'un médecin et de kinésithérapeutes. Leur donner
-- accès au dossier médical soulève immédiatement la question inverse : à qui
-- faut-il le RETIRER. Jusqu'ici, la direction lisait l'intégralité des notes
-- médicales des enfants. Ce n'est pas tenable une fois qu'un professionnel de
-- santé existe : un diagnostic appartient au soignant et à la famille, pas à
-- l'organigramme.
--
-- TROIS NIVEAUX, trois tables — parce que RLS défend des lignes, pas des
-- colonnes (leçon de la migration 20260919000001) :
--
--   1. player_medical ............. le dossier clinique.
--      Diagnostics, traitements, antécédents, taille, poids.
--      → MÉDECIN et KINÉ uniquement.
--
--   2. player_health_clearance .... l'aptitude et la consigne de terrain.
--      « Apte / inapte / aménagé », jusqu'à quand, et que faire en cas de
--      problème pendant une séance.
--      → écrite par le soignant ; lue par la direction, le coach de l'enfant
--        et son parent. Aucun diagnostic n'y figure : on y écrit « arrêt
--        jusqu'au 12/10 », pas « fracture du scaphoïde ».
--
--   3. Le reste ................... rien. Un coach n'apprend pas qu'un enfant
--      est suivi ; il apprend qu'il ne joue pas cette semaine.
--
-- Ce découpage n'est pas une précaution juridique abstraite : un coach qui
-- connaît le diagnostic d'un enfant en parle, au vestiaire ou aux parents des
-- autres. La séparation protège l'enfant de son propre club.
--
-- ⚠️ CONSÉQUENCE POUR LA PRÉSIDENCE : le directeur d'académie ne lit plus les
-- notes cliniques. Il conserve l'aptitude, la consigne d'urgence, et le fait
-- qu'un dossier existe. Si le club décide que la présidence doit voir le
-- dossier complet, c'est la politique player_medical_select ci-dessous qu'il
-- faut élargir — une ligne, et le contrôle de sécurité n°18 le signalera.

-- ── Qui est soignant ? ──────────────────────────────────────────────────────
create or replace function futuriste.is_medical() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select role in ('CLUB_DOCTOR','PHYSIOTHERAPIST') from profiles where id = auth.uid()),
    false);
$$;

-- ── 1 · Dossier clinique : soignants seuls ──────────────────────────────────
drop policy if exists player_medical_select on player_medical;
drop policy if exists player_medical_insert on player_medical;
drop policy if exists player_medical_update on player_medical;

create policy player_medical_select on player_medical
  for select
  using (futuriste.is_medical() and academy_id = futuriste.my_academy());

create policy player_medical_insert on player_medical
  for insert
  with check (futuriste.is_medical() and academy_id = futuriste.my_academy());

create policy player_medical_update on player_medical
  for update
  using (futuriste.is_medical() and academy_id = futuriste.my_academy())
  with check (futuriste.is_medical() and academy_id = futuriste.my_academy());

-- Le champ porte mal son nom une fois l'aptitude sortie : ce sont des notes
-- cliniques, pas un fourre-tout médical.
alter table player_medical rename column medical_notes to clinical_notes;

-- ── 2 · Aptitude et consigne de terrain ─────────────────────────────────────
create type fitness_status as enum ('FIT', 'ADAPTED', 'UNFIT');

create table player_health_clearance (
  player_id             uuid primary key references players(id) on delete cascade,
  academy_id            uuid not null references academies(id),
  status                fitness_status not null default 'FIT',
  -- Jusqu'à quand l'indisponibilité court. Null = sans terme fixé.
  until                 date,
  -- Motif NON CLINIQUE, destiné au coach : « reprise progressive », jamais
  -- « entorse grade 2 ». Une contrainte ne peut pas vérifier ça ; le
  -- commentaire et la formation le peuvent.
  public_reason         text,
  -- Que faire si l'enfant va mal pendant une séance. C'est la seule
  -- information médicale qu'un coach doit avoir, et il doit l'avoir vite.
  emergency_instructions text,
  emergency_contact      text,
  updated_by            uuid references profiles(id),
  updated_at            timestamptz not null default now()
);

create index player_health_clearance_academy_idx on player_health_clearance (academy_id);

alter table player_health_clearance enable row level security;

-- Lecture : direction, coach de CET enfant, parent de CET enfant, et le
-- soignant. Pas le club entier — `coaches_player` et `is_guardian_of` sont les
-- mêmes fonctions qui cloisonnent déjà le reste.
create policy phc_select on player_health_clearance
  for select
  using (
    academy_id = futuriste.my_academy()
    and (
      futuriste.is_medical()
      or futuriste.is_staff()
      or futuriste.coaches_player(player_id)
      or futuriste.is_guardian_of(player_id)
    )
  );

-- Écriture : soignants seuls. Un directeur ne déclare pas un enfant apte.
create policy phc_insert on player_health_clearance
  for insert
  with check (futuriste.is_medical() and academy_id = futuriste.my_academy());

create policy phc_update on player_health_clearance
  for update
  using (futuriste.is_medical() and academy_id = futuriste.my_academy())
  with check (futuriste.is_medical() and academy_id = futuriste.my_academy());

grant select, insert, update on player_health_clearance to authenticated;

-- ── 3 · Les soignants voient les enfants, pas leurs performances ────────────
-- Un médecin a besoin d'identifier l'enfant qu'il soigne. Il n'a pas à
-- consulter ses évaluations techniques ni son profil de jeu : ce sont des
-- données de performance, sans usage clinique.
drop policy if exists players_select on players;
create policy players_select on players
  for select
  using (
    futuriste.can_read_player(id)
    or (futuriste.is_medical() and academy_id = futuriste.my_academy())
  );

-- Le journal d'audit devient lisible par les soignants pour leur propre
-- académie : un dossier médical consulté doit laisser une trace consultable.
drop policy if exists audit_logs_select on audit_logs;
create policy audit_logs_select on audit_logs
  for select
  using (
    futuriste.is_super_admin()
    or ((futuriste.is_staff() or futuriste.is_medical())
        and academy_id = futuriste.my_academy())
  );
