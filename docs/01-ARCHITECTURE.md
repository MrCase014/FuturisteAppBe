# 01 — ARCHITECTURE GÉNÉRALE

## 1. Le schéma d'ensemble

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              UTILISATEURS                                      │
│  Directeur (ordi) · Coach (téléphone, terrain) · Parent (téléphone) ·          │
│  Joueur (téléphone/tablette) · Visiteur (site public)                          │
└───────────────────────────────────────────────────────────────────────────────┘
                │                                          │
    ┌───────────▼─────────────┐              ┌─────────────▼──────────────┐
    │   apps/web — Next.js    │              │  apps/mobile — Expo (RN)   │
    │  ─────────────────────  │              │  ────────────────────────  │
    │  • Landing publique     │              │  • Mode Coach Terrain      │
    │  • Back-office directeur│              │  • Évaluation post-séance  │
    │  • Espace coach complet │              │  • Espace joueur (badges)  │
    │  • Espace parent        │              │  • Espace parent           │
    │  • PWA installable      │              │  • Notifications push      │
    └───────────┬─────────────┘              └─────────────┬──────────────┘
                │                                          │
                └────────────────┬─────────────────────────┘
                                 │
         ┌───────────────────────▼────────────────────────────┐
         │        packages/  — CODE PARTAGÉ (TypeScript)      │
         │  ────────────────────────────────────────────────  │
         │  core      règles métier FUTURISTE, calculs,       │
         │            moteur de séances, validation Zod       │
         │  supabase  client + types générés + requêtes       │
         │  ui        design tokens + composants partagés     │
         │  i18n      fr / en                                 │
         │  diagrams  moteur de schémas tactiques 2D          │
         └───────────────────────┬────────────────────────────┘
                                 │  @supabase/supabase-js
         ┌───────────────────────▼────────────────────────────┐
         │                    SUPABASE                         │
         │  ────────────────────────────────────────────────  │
         │  PostgreSQL  ← 40 tables + vues + fonctions        │
         │  RLS         ← la sécurité, écrite en SQL          │
         │  Auth        ← email/mot de passe + magic link     │
         │  Storage     ← photos, vidéos, schémas, documents  │
         │  Realtime    ← présences live, notifications       │
         │  Edge Funcs  ← IA, exports PDF, tâches planifiées  │
         └───────────────────────┬────────────────────────────┘
                                 │ (Phase 12+)
                    ┌────────────▼─────────────┐
                    │  Services externes       │
                    │  • Claude API (IA coach) │
                    │  • Stockage vidéo (V2)   │
                    │  • Vision (Phase 13)     │
                    └──────────────────────────┘
```

---

## 2. Pourquoi un « monorepo »

Un **monorepo** = un seul dépôt Git qui contient le site web, l'application mobile
et le code commun.

**Le problème qu'on évite :** sans monorepo, la règle
*« un U9 ne doit pas faire plus de 20 min d'exercice analytique »* serait écrite
une fois dans le site web et une fois dans l'application mobile. Le jour où vous
la changez, vous la changez à un endroit et vous oubliez l'autre. Le coach et le
directeur voient alors deux vérités différentes. Fin de la confiance.

**Avec monorepo :** la règle est écrite **une fois** dans `packages/core`.
Les deux applications l'importent. Impossible qu'elles divergent.

Outillage : **pnpm workspaces + Turborepo** (gratuit, standard du marché).

---

## 3. Pourquoi deux applications et pas une seule

Question légitime : React Native sait faire du web. Pourquoi ne pas tout faire en RN ?

| | Next.js (web) | Expo / React Native (mobile) |
|---|---|---|
| Tableaux denses, filtres, graphiques directeur | ✅ Excellent | ❌ Pénible |
| Référencement Google de la page publique | ✅ Natif | ❌ Mauvais |
| Mode terrain, gros boutons, une main | ⚠️ Correct (PWA) | ✅ Excellent |
| Vidéo hors ligne téléchargée | ⚠️ Limité | ✅ Natif |
| Notifications push fiables | ⚠️ Limitées sur iOS | ✅ Natif |
| Chronomètre qui continue écran verrouillé | ❌ | ✅ |

**Décision :** deux interfaces, **un seul cerveau** (`packages/core`).
On duplique l'habillage, jamais la logique. Le surcoût est faible car
80 % du travail réel (règles, requêtes, types) est partagé.

**Conséquence pour le calendrier :** la Phase 11 (mobile) est peu coûteuse
précisément parce que les phases 1 à 10 ont rempli `packages/core`.

---

## 4. Pourquoi Supabase plutôt qu'un backend sur mesure

Construire un backend classique (serveur Node + base + fichiers + authentification
+ hébergement) représente **4 à 6 semaines** de travail avant la première ligne de
fonctionnalité métier, et un serveur à maintenir chaque mois.

Supabase fournit d'emblée :

| Besoin | Solution Supabase | Ce qu'on économise |
|---|---|---|
| Base de données | PostgreSQL managé | Installation, sauvegardes, montée en charge |
| Connexion utilisateur | Auth (email, magic link, OAuth) | 2 semaines + risques de sécurité |
| Photos / vidéos | Storage avec URLs signées | 1 semaine + facture de bande passante |
| Qui voit quoi | **Row Level Security** (règles SQL) | Le cœur du sujet, voir §5 |
| API | Générée automatiquement depuis les tables | 3 semaines de CRUD |
| Temps réel | Realtime (WebSocket) | 1 semaine |
| Traitements serveur | Edge Functions (Deno) | Un serveur de moins |

**Et si Supabase devient un problème un jour ?** C'est du PostgreSQL standard,
open source, auto-hébergeable. On part avec une sauvegarde `pg_dump` et on
réinstalle ailleurs. Aucun enfermement réel.

---

## 5. La sécurité vit dans la base, pas dans l'écran

C'est le point le plus important de ce document.

**❌ Mauvaise approche (celle de 90 % des applications) :**
l'application demande *toutes* les données, puis cache à l'écran celles que
l'utilisateur ne doit pas voir. Les données sont pourtant **déjà parties** sur le
téléphone du parent. Quelqu'un d'un peu curieux les lit.

**✅ Approche FUTURISTE :** chaque table de PostgreSQL porte une règle.
Quand le parent de Sekou demande « donne-moi les joueurs », la base répond
**« voici Sekou »** et rien d'autre. Ce n'est pas caché : ça n'a jamais été envoyé.

```sql
-- Traduction : un parent ne lit un joueur que s'il est rattaché à ce joueur.
create policy "guardian_reads_own_child"
on players for select
using ( futuriste.is_guardian_of(id) );
```

Sur un produit qui manipule les données de mineurs, c'est non négociable.
Le détail complet est dans `05-ROLES-PERMISSIONS.md`.

---

## 6. Comment circule la donnée (3 exemples)

### A. Le coach ouvre sa séance sur le terrain, sans réseau

```
1. La veille, connecté :  l'app télécharge séance + exercices + schémas + vidéos
                          → stockés dans SQLite local (mobile) / IndexedDB (web)
2. Sur le terrain :       tout est lu en local. Zéro requête réseau.
3. Le coach évalue :      l'évaluation est écrite en local avec un statut "à envoyer"
4. Retour au vestiaire :  la file d'attente part vers Supabase, dans l'ordre
5. Conflit éventuel :     la règle est "dernière écriture du même auteur gagne",
                          et toute évaluation refusée est signalée au coach.
```

### B. Le directeur consulte la progression moyenne des U13

```
Écran directeur → vue SQL `v_domain_progression` (pré-calculée)
                → renvoie 8 lignes (une par domaine), pas 200 évaluations
                → graphique instantané, même avec 3 ans d'historique
```
On calcule dans la base, pas dans le téléphone. Une vue matérialisée rafraîchie
chaque nuit remplace des milliers de lignes transférées.

### C. Le coach génère une séance (moteur de règles, sans IA)

```
Entrée :  U11 · 16 joueurs · 90 min · objectif "Intelligence" · thème "Occupation des espaces"
   │
   ├─ 1. Charger la méthodologie de la catégorie U11
   ├─ 2. Construire la timeline en 7 phases avec les durées recommandées pour U11
   ├─ 3. Pour chaque phase, filtrer les exercices : âge OK, effectif OK,
   │     compétence visée OK, durée compatible, matériel disponible
   ├─ 4. Scorer : +3 si la compétence est un objectif actif de ≥3 joueurs du groupe,
   │     +2 si l'exercice n'a pas été utilisé depuis 3 semaines (variation),
   │     -5 si contraire à une règle d'âge (ex. analytique long en U7)
   └─ 5. Proposer les meilleurs, le coach garde la main (ajouter/retirer/déplacer)
```
**Ce moteur est déterministe et testable.** En Phase 12, Claude remplacera
l'étape 4-5 par une proposition rédigée — les étapes 1-3 (les garde-fous
méthodologiques) resteront du code, jamais de l'IA.

---

## 7. Couches applicatives

```
┌──────────────────────────────────────────────────────────┐
│ 1. PRÉSENTATION      écrans, composants, navigation      │  ← duplicable web/mobile
├──────────────────────────────────────────────────────────┤
│ 2. ÉTAT / CACHE      TanStack Query, offline, optimistic │  ← partagé (hooks)
├──────────────────────────────────────────────────────────┤
│ 3. MÉTIER            règles FUTURISTE, scoring, DNA,     │  ← packages/core
│                      moteur de séance, validation Zod    │     100 % partagé, 100 % testé
├──────────────────────────────────────────────────────────┤
│ 4. ACCÈS DONNÉES     requêtes typées Supabase            │  ← packages/supabase
├──────────────────────────────────────────────────────────┤
│ 5. DONNÉES           PostgreSQL + RLS + vues + triggers  │  ← supabase/migrations
└──────────────────────────────────────────────────────────┘
```

**Règle d'or :** une couche ne parle qu'à celle juste en dessous.
Un écran n'écrit jamais de SQL. Une règle métier ne connaît jamais un bouton.

---

## 8. Stratégie hors ligne (résumé)

| Donnée | Hors ligne ? | Mécanisme |
|---|---|---|
| Séance du jour + exercices | ✅ Lecture complète | Pré-téléchargement la veille |
| Schémas tactiques 2D | ✅ | JSON léger (~20 Ko), mis en cache |
| Vidéos | ✅ si téléchargées explicitement | Téléchargement manuel « 📥 Dispo hors ligne » |
| Chronomètre | ✅ 100 % local | Aucune dépendance réseau |
| Présences | ✅ Écriture différée | File d'attente locale |
| Évaluations | ✅ Écriture différée | File d'attente locale + horodatage client |
| Tableaux de bord, statistiques | ❌ | Nécessitent le serveur |

Toute écriture différée porte un `client_generated_id` (UUID créé sur le téléphone)
pour garantir qu'un double envoi ne crée jamais un doublon.

---

## 9. Environnements

| Environnement | Base | Usage | Données |
|---|---|---|---|
| **Local** | Supabase CLI (Docker) | développement | seed fictif |
| **Staging** | Projet Supabase gratuit | tests du directeur avant mise en ligne | seed fictif |
| **Production** | Projet Supabase séparé | l'académie réelle | données réelles |

**Règle absolue :** aucune donnée réelle d'enfant en local ou en staging. Jamais.
