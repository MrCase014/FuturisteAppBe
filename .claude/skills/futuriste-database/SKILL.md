---
name: futuriste-database
description: Conventions de base de données et sécurité RLS obligatoires pour FUTURISTE. À charger avant d'écrire une migration SQL, de créer ou modifier une table, d'écrire une requête Supabase, de toucher aux politiques RLS, ou de manipuler des données de joueurs. Contient les conventions de nommage, les fonctions d'aide RLS, le modèle de politique par table, la règle de suppression logique et les 12 tests de sécurité obligatoires.
---

# Base de données FUTURISTE

Référence : `docs/04-BASE-DE-DONNEES.md` et `docs/05-ROLES-PERMISSIONS.md`.

## Règle absolue
**Aucune table sans RLS. Aucune table sans test de sécurité.**
Une table livrée sans politique est un bug bloquant, jamais une dette.

## Conventions
- Clés primaires `uuid default gen_random_uuid()` — jamais d'entier séquentiel
- `created_at` / `updated_at` en `timestamptz` sur toute table
- `academy_id` sur **toute** table métier (socle du cloisonnement)
- `deleted_at` (suppression logique) sur les tables sensibles
- `snake_case`, tables au pluriel, colonnes au singulier
- `name_fr` / `name_en` sur les tables de référentiel
- `client_generated_id uuid unique` sur les tables écrites hors ligne
  (`attendance`, `player_evaluations`, `match_events`, `training_sessions`)

## Migrations
- **Un fichier de migration appliqué ne se modifie JAMAIS.** On en crée un nouveau.
- Nommage : `YYYYMMDDHHMMSS_description.sql`
- Après toute migration : `pnpm db:types` (ne jamais éditer `database.types.ts` à la main)

## Fonctions d'aide RLS (à réutiliser, jamais à réécrire)
`futuriste.my_role()` · `futuriste.my_academy()` · `futuriste.is_staff()` ·
`futuriste.coaches_team(uuid)` · `futuriste.coaches_player(uuid)` ·
`futuriste.is_guardian_of(uuid)` · `futuriste.is_player(uuid)`

`is_guardian_of` exige `consent_data_at is not null` — pas de consentement,
pas d'accès. Ne jamais retirer cette condition.

## Modèle de politique
```sql
alter table <t> enable row level security;

create policy <t>_select on <t> for select using (
     futuriste.is_staff() and academy_id = futuriste.my_academy()
  or futuriste.coaches_player(player_id)
  or futuriste.is_guardian_of(player_id)
  or futuriste.is_player(player_id)
);
create policy <t>_insert on <t> for insert with check (...);
create policy <t>_update on <t> for update using (...);
-- Pas de politique DELETE sur les données de mineurs.
```

## Interdits
```
❌ delete from players ...            → update ... set deleted_at = now()
❌ alter table ... disable row level security   (banni par hook de commit)
❌ Filtrer les données côté application au lieu de RLS
❌ Exposer un identifiant devinable dans une URL
❌ Une vraie donnée d'enfant dans un seed ou un test
❌ Un nom d'enfant dans un log technique (Sentry compris)
```

## Colonnes sensibles
`players.medical_notes`, `height_cm`, `weight_kg` : directeur uniquement.
L'application coach interroge **toujours** la vue `v_players_coach_safe`,
qui n'expose pas ces colonnes. RLS filtre des lignes, pas des colonnes.

## Règles métier câblées en base
- Évaluation modifiable **48 h** par son auteur uniquement (ADR-09)
- Maximum **3** `player_goals` au statut ACTIVE par joueur
- PLAYER DNA masqué si `confidence < 0.6`, désactivé U7/U9, jamais au parent

## Après toute modification de schéma
1. `pnpm db:reset` puis `pnpm db:types`
2. Rejouer les 12 tests de sécurité (`docs/05-ROLES-PERMISSIONS.md` §5)
3. Un seul échec = on ne livre pas
