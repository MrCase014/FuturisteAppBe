# 05 — RÔLES ET PERMISSIONS

> **Règle absolue du projet :** un parent ne doit **jamais** pouvoir consulter les
> données d'un autre enfant. Un coach ne voit **que** les équipes qui lui sont
> attribuées. Cette règle est écrite en SQL, dans la base, pas dans un écran.

---

## 1. Les 5 rôles

| Rôle | Qui | Ce qu'il fait | Combien |
|---|---|---|---|
| `SUPER_ADMIN` | Vous (Valere) + support technique | Créer l'académie, débloquer, accès technique | 1-2 |
| `ACADEMY_DIRECTOR` | Le directeur de FUTURISTE | Pilote tout : joueurs, coachs, contenu, méthodologie | 1-3 |
| `COACH` | Les éducateurs | Ses équipes : séances, présences, évaluations, matchs | 3-15 |
| `PLAYER` | Les joueurs (≥ 11 ans en pratique) | Voit SES objectifs, SA progression, ses badges | 50-300 |
| `PARENT` | Parents et tuteurs légaux | Voit SON enfant, en lecture seule | 50-300 |

**Le rôle vit dans `profiles.role`.** Un utilisateur a **un seul** rôle.
Un parent qui est aussi coach a deux comptes distincts — c'est volontaire :
cela évite toute confusion de permissions, et l'ambiguïté est le pire ennemi
de la sécurité des données d'enfants.

---

## 2. Matrice complète des droits

Légende : **T** = tout · **É** = son équipe/ses joueurs · **P** = son enfant ·
**S** = soi-même · **L** = lecture seule · **—** = aucun accès

| Ressource | SUPER_ADMIN | DIRECTEUR | COACH | JOUEUR | PARENT |
|---|:---:|:---:|:---:|:---:|:---:|
| Paramètres de l'académie | T | T | — | — | — |
| Catégories (U7→U18) | T | T | L | — | — |
| Équipes | T | T | É (L) | — | — |
| Comptes utilisateurs | T | T | — | S | S |
| Fiches joueurs | T | T | É | S (L) | P (L) |
| **Notes médicales** | T | T | — | — | — ⚠️ |
| Coordonnées des parents | T | T | É | — | S |
| Parents (rattachements) | T | T | L | — | — |
| Exercices | T | T | L + créer les siens | — | — |
| Vidéos | T | T | L + ajouter | L (publiées) | L (publiées) |
| Schémas tactiques | T | T | L + créer | — | — |
| Méthodologie | T | T | L | — | — |
| Séances | T | T | É | L (les siennes) | L (calendrier) |
| Session Studio | — | T | T | — | — |
| Mode Terrain | — | T | É | — | — |
| Présences | T | T | É | S (L) | P (L) |
| Évaluations | T | T | **É (écriture)** | S (L, si autorisé) | P (L, si autorisé) |
| Objectifs (MY NEXT LEVEL) | T | T | É | S (L) | P (L) |
| PLAYER DNA | T | T | É (L) | S (L, ≥ U13) | — ⚠️ |
| Matchs & statistiques | T | T | É | S (L) | P (L) |
| Badges | T | T | É (attribuer) | S (L) | P (L) |
| Défis | T | T | É | S (participer) | P (L) |
| Tableau de bord directeur | T | T | — | — | — |
| Annonces | T | T | É (créer) | L | L |
| FUTURISTE FAMILY | T | T | L | — | L |
| Journal d'audit | T | L | — | — | — |
| Export de données | T | T | — | — | S (ses données) |

### ⚠️ Les trois interdits stricts

1. **Le parent ne peut RIEN modifier.** Ni évaluation, ni objectif, ni commentaire.
   Il peut seulement signaler une absence. *Le parent ne coache pas.*
2. **Le parent ne voit pas le PLAYER DNA.** Trop d'effets pervers : pression
   parentale, comparaison, projection. C'est un outil d'éducateur.
3. **Le coach ne voit pas les notes médicales.** Directeur uniquement.

---

## 3. Comment c'est écrit dans PostgreSQL

### Les fonctions d'aide

Écrites **une fois**, réutilisées par chaque règle. Si la logique change,
on la change à un seul endroit.

```sql
create schema if not exists futuriste;

-- Le rôle de la personne connectée
create or replace function futuriste.my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

-- Son académie
create or replace function futuriste.my_academy() returns uuid
language sql stable security definer set search_path = public as $$
  select academy_id from profiles where id = auth.uid();
$$;

create or replace function futuriste.is_staff() returns boolean
language sql stable as $$
  select futuriste.my_role() in ('SUPER_ADMIN','ACADEMY_DIRECTOR');
$$;

-- Le coach est-il affecté à cette équipe ?
create or replace function futuriste.coaches_team(p_team uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from team_coaches tc
    where tc.team_id = p_team and tc.coach_id = auth.uid()
  );
$$;

-- Le coach a-t-il ce joueur dans l'une de ses équipes ?
create or replace function futuriste.coaches_player(p_player uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from player_team_memberships ptm
    join team_coaches tc on tc.team_id = ptm.team_id
    where ptm.player_id = p_player
      and ptm.is_active
      and tc.coach_id = auth.uid()
  );
$$;

-- Suis-je le parent/tuteur de ce joueur ?
create or replace function futuriste.is_guardian_of(p_player uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from player_guardians pg
    where pg.player_id = p_player
      and pg.guardian_id = auth.uid()
      and pg.consent_data_at is not null      -- ⚠️ pas de consentement, pas d'accès
  );
$$;

-- Suis-je ce joueur ?
create or replace function futuriste.is_player(p_player uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from players p
    where p.id = p_player and p.profile_id = auth.uid()
  );
$$;
```

### Exemple 1 — la table `players`

```sql
alter table players enable row level security;

-- LECTURE : 4 chemins d'accès, et aucun autre
create policy players_select on players for select using (
     futuriste.is_staff()                and academy_id = futuriste.my_academy()
  or futuriste.coaches_player(id)
  or futuriste.is_guardian_of(id)
  or futuriste.is_player(id)
);

-- ÉCRITURE : direction uniquement
create policy players_insert on players for insert
  with check (futuriste.is_staff() and academy_id = futuriste.my_academy());

create policy players_update on players for update
  using (futuriste.is_staff() and academy_id = futuriste.my_academy());

-- Aucune politique DELETE : la suppression physique est impossible.
-- On passe par deleted_at, via une fonction tracée dans audit_logs.
```

**Ce que ça donne concrètement :** le parent de Sekou envoie
`select * from players`. PostgreSQL lui répond **une seule ligne**.
Pas « il en voit une » : **il n'en reçoit qu'une**. Les autres n'ont jamais
quitté le serveur.

### Exemple 2 — les évaluations (le cas le plus sensible)

```sql
alter table player_evaluations enable row level security;

create policy eval_select on player_evaluations for select using (
     futuriste.is_staff()             and academy_id = futuriste.my_academy()
  or futuriste.coaches_player(player_id)
  or (futuriste.is_guardian_of(player_id) and is_visible_to_parent)
  or (futuriste.is_player(player_id)      and is_visible_to_player)
);

-- Seul le coach de l'équipe (ou la direction) évalue,
-- et il ne peut pas signer au nom d'un autre.
create policy eval_insert on player_evaluations for insert with check (
  evaluator_id = auth.uid()
  and ( futuriste.coaches_player(player_id) or futuriste.is_staff() )
);

-- Une évaluation n'est modifiable que par son auteur, pendant 48 h.
create policy eval_update on player_evaluations for update using (
  ( evaluator_id = auth.uid() and created_at > now() - interval '48 hours' )
  or futuriste.is_staff()
);
```

> **Pourquoi 48 heures ?** Une évaluation est une trace de développement.
> Si on peut la réécrire six mois plus tard, la courbe de progression ne veut
> plus rien dire — et en cas de litige avec une famille, l'historique n'a plus
> de valeur. Le coach corrige une erreur de frappe le lendemain ; il ne réécrit
> pas l'histoire.

### Exemple 3 — les notes médicales, colonne interdite au coach

RLS filtre des **lignes**, pas des colonnes. Pour `players.medical_notes`,
on ajoute une **vue** dédiée :

```sql
create view v_players_coach_safe with (security_invoker = true) as
select id, academy_id, first_name, last_name, birth_date, gender, photo_url,
       dominant_foot, preferred_position, experienced_positions,
       jersey_number, joined_at, status
from players where deleted_at is null;
-- medical_notes, height_cm, weight_kg : volontairement absents.
```
L'application coach interroge **toujours** `v_players_coach_safe`.

---

## 4. Tableau de couverture RLS (contrôle de complétude)

| Table | RLS | Lecture autorisée à | Écriture autorisée à |
|---|:---:|---|---|
| `academies` | ✅ | tous (membres) | super admin |
| `profiles` | ✅ | staff + soi + coach (son équipe) | staff + soi (son profil) |
| `age_groups` | ✅ | tous (membres) | staff |
| `teams` | ✅ | staff + coach affecté + parent concerné | staff |
| `team_coaches` | ✅ | staff + le coach concerné | staff |
| `players` | ✅ | staff + coach + parent + joueur | staff |
| `player_team_memberships` | ✅ | idem `players` | staff |
| `player_guardians` | ✅ | staff + le parent concerné | staff |
| `competencies` / `domains` / `levels` | ✅ | tous (membres) | staff |
| `exercises` | ✅ | staff + coach | staff + auteur |
| `exercise_media` / `_diagrams` | ✅ | staff + coach | staff + auteur |
| `training_sessions` | ✅ | staff + coach équipe + joueur/parent (sa séance) | staff + coach équipe |
| `session_exercises` | ✅ | hérite de la séance | coach de la séance |
| `player_evaluations` | ✅ | staff + coach + parent/joueur si autorisé | coach auteur (48 h) |
| `player_evaluation_scores` | ✅ | hérite de l'évaluation | idem |
| `player_goals` | ✅ | staff + coach + parent + joueur | staff + coach |
| `player_dna_profiles` | ✅ | staff + coach + joueur (≥U13) — **jamais le parent** | système |
| `attendance` | ✅ | staff + coach + parent + joueur | coach |
| `events` | ✅ | tous les membres de l'équipe | staff + coach |
| `matches` / `match_players` / `match_events` | ✅ | staff + coach + parent + joueur | coach |
| `badges` / `player_badges` | ✅ | tous | staff + coach |
| `challenges` / `player_challenges` | ✅ | tous | staff + le joueur |
| `methodology` | ✅ | staff + coach | staff |
| `family_resources` | ✅ | staff + coach + parent | staff |
| `announcements` | ✅ | selon `audience` | staff + coach |
| `notifications` | ✅ | le destinataire uniquement | système |
| `audit_logs` | ✅ | super admin (lecture) | système (insertion seule) |
| `ai_requests` | ✅ | staff + l'auteur | système |
| `video_analysis_jobs` | ✅ | staff | système |

**Aucune table sans RLS.** Une seule oubliée et la porte est grande ouverte.
Le test automatisé `tests/rls.spec.ts` échoue si une table publique n'a pas
`rowsecurity = true`.

---

## 5. Les tests de sécurité obligatoires

À chaque `git push`, la CI joue ces scénarios avec de **vrais comptes de test** :

| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Parent A demande le joueur de la famille B | 0 ligne |
| 2 | Parent A demande **toutes** les évaluations | uniquement son enfant, visibles |
| 3 | Coach 1 demande les joueurs de l'équipe du coach 2 | 0 ligne |
| 4 | Coach tente de lire `players.medical_notes` | colonne absente de la vue |
| 5 | Parent tente de modifier une évaluation | refus |
| 6 | Parent tente de créer un objectif | refus |
| 7 | Joueur tente de lire le profil d'un coéquipier | 0 ligne |
| 8 | Coach modifie une évaluation vieille de 3 jours | refus |
| 9 | Parent lit le PLAYER DNA de son enfant | refus |
| 10 | Requête sans authentification sur `players` | 0 ligne |
| 11 | Utilisateur d'une autre académie | 0 ligne |
| 12 | Parent sans `consent_data_at` | 0 ligne |

> **Règle de développement :** une table livrée sans sa politique RLS et sans
> son test est considérée comme un **bug bloquant**, pas comme une dette.

---

## 6. Connexion et création de comptes

```
Directeur → crée le joueur (fiche sans compte)
          → crée le compte parent → e-mail d'invitation → mot de passe défini par le parent
          → coche le consentement données + médias (traçable, horodaté)
          → à partir de 11 ans : crée le compte joueur (simplifié)
```

- **Aucune inscription libre.** Pas de bouton « Créer un compte » pour le public.
  Un compte n'existe que s'il a été créé par la direction. C'est ce qui empêche
  un inconnu de se retrouver dans la base d'une académie d'enfants.
- Connexion par **e-mail + mot de passe** ou **lien magique** (pratique pour
  les parents qui oublient leur mot de passe).
- Les comptes joueurs mineurs sont **rattachés au consentement parental** :
  si le parent retire son consentement, le compte est désactivé automatiquement.
