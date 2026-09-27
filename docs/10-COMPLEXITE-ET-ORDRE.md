# 10 — COMPLEXITÉ DES MODULES ET ORDRE DE DÉVELOPPEMENT

---

## 1. Échelle de complexité

| Niveau | Effort | Signification |
|:---:|---|---|
| **S** | 1-3 jours | Écrans simples, formulaires, listes |
| **M** | 4-8 jours | Plusieurs écrans liés, logique métier modérée |
| **L** | 9-15 jours | Logique métier importante, cas limites nombreux |
| **XL** | 16-30 jours | Cœur du produit, algorithmes, forte incertitude |

---

## 2. Tous les modules, évalués

| Module | Complexité | Risque | Pourquoi |
|---|:---:|:---:|---|
| Landing page publique | **S** | 🟢 | Pages statiques |
| Connexion / rôles | **M** | 🟡 | Redirections par rôle, invitations, sessions |
| **Base de données + RLS** | **L** | 🔴 | 42 tables, ~60 politiques. **Une erreur = fuite de données d'enfants** |
| Tableau de bord directeur | **M** | 🟢 | Vues SQL déjà prêtes |
| Tableau de bord coach | **S** | 🟢 | Peu de données |
| Joueurs (CRUD + photo) | **M** | 🟡 | Envoi d'images, consentements |
| Catégories / méthodologie | **M** | 🟢 | CRUD riche mais direct |
| Équipes / affectations | **M** | 🟡 | Base de la sécurité coach |
| Bibliothèque d'exercices | **L** | 🟡 | 20 champs, filtres croisés, médias |
| **Éditeur de schémas 2D** | **XL** | 🔴 | Canevas, glisser-déposer, animation. **Le plus dur du MVP** |
| Lecteur de schémas 2D | **M** | 🟢 | Lecture seule, bien plus simple que l'éditeur |
| Vidéos (envoi + lecture) | **M** | 🟡 | Compression, quotas, miniatures |
| **Session Studio** | **XL** | 🔴 | Moteur de sélection + timeline réordonnable |
| Moteur de règles de séance | **L** | 🔴 | Filtrage + notation + garde-fous d'âge |
| **Mode Terrain + hors ligne** | **XL** | 🔴 | Synchronisation, conflits, cache : **techniquement le plus risqué** |
| Présences | **M** | 🟡 | Écriture hors ligne |
| **Évaluations** | **L** | 🟡 | Écriture hors ligne, visibilité, fenêtre 48 h |
| Objectifs MY NEXT LEVEL | **M** | 🟢 | CRUD + règle des 3 maximum |
| Progression / radar | **M** | 🟡 | Graphiques, vues SQL, cas « pas assez de données » |
| **PLAYER DNA** | **L** | 🔴 | Algorithme + **risque pédagogique** (étiqueter un enfant) |
| Badges & gamification | **M** | 🟢 | Règles simples |
| Espace parent | **M** | 🔴 | Faible technique, **risque maximal en sécurité** |
| FUTURISTE FAMILY | **S** | 🟢 | Contenu éditorial |
| Espace joueur | **M** | 🟡 | Deux niveaux d'interface selon l'âge |
| Matchs | **L** | 🟡 | Composition, temps de jeu, événements |
| Statistiques de match | **M** | 🟡 | Agrégations + masquage selon l'âge |
| Annonces / notifications | **M** | 🟡 | Ciblage par audience |
| PWA + build mobile | **L** | 🟡 | Service worker, EAS, stores |
| Anglais complet | **M** | 🟢 | Fastidieux, pas difficile |
| IA génération de séances | **L** | 🟡 | Prompt, validation, coût, repli |
| Ask FUTURISTE | **M** | 🟡 | Conversation + contexte |
| Analyse vidéo | **XL** | 🔴 | Recherche, GPU, budget. **Hors MVP** |

**Total MVP (phases 1-9) : ≈ 75 à 95 jours de travail.**

---

## 3. Les 5 risques à surveiller

| Risque | Conséquence | Comment on l'évite |
|---|---|---|
| **Fuite de données d'enfants** | Juridique + réputation détruite | RLS dès la Phase 2 + 12 tests automatisés en CI |
| **Le hors ligne ne marche pas** | Le coach abandonne l'app | Prototype dédié en début de Phase 7, testé en mode avion |
| **L'éditeur de schémas déborde** | 3 semaines perdues | Version 1 volontairement simple : positions + flèches + 3 images-clés |
| **Le Session Studio propose n'importe quoi** | Perte de confiance immédiate | Le moteur de règles est testé **avant** l'interface |
| **PLAYER DNA étiquette un enfant** | Dégât pédagogique réel | Seuil de confiance, désactivé U7/U9, invisible aux parents |

---

## 4. L'ORDRE EXACT DE DÉVELOPPEMENT

> Cet ordre n'est pas négociable. Chaque étape dépend de la précédente.
> Sauter une étape produit du code à refaire.

### ▶️ PHASE 0 — Validation *(vous êtes ici)*
```
0.1  Lire les 17 documents de docs/
0.2  Valider ou corriger
0.3  Donner le feu vert
```
**Sortie :** architecture figée. **Aucun code avant cette validation.**

### ▶️ PHASE 1 — Fondations *(1 semaine)*
```
1.1  Monorepo : pnpm + Turborepo
1.2  apps/web (Next.js) + apps/mobile (Expo) qui démarrent, vides
1.3  packages/ui : les tokens du document 08
1.4  packages/i18n : la structure fr/en
1.5  CI GitHub : lint + tests
1.6  Maquettes des 10 écrans clés (à valider par vous)
```
**Test :** `pnpm dev` lance le web et le mobile. Les couleurs sont les bonnes.

### ▶️ PHASE 2 — Base de données et connexion *(2 semaines)* 🔴
```
2.1  Projet Supabase (local + staging)
2.2  Migrations 01→14 : les 42 tables
2.3  Migration 20 : fonctions d'aide RLS
2.4  Migration 21 : ~60 politiques RLS        ⚠️ étape critique
2.5  Migration 30 : les vues de tableau de bord
2.6  Seed : 7 catégories, 8 domaines, 70 compétences, 3 coachs, 20 joueurs
2.7  Génération des types TypeScript
2.8  Connexion + redirection par rôle
2.9  LES 12 TESTS DE SÉCURITÉ                 ⚠️ bloquant
```
**Test :** les 12 tests passent. Un parent de test ne voit qu'un enfant.
**🚧 On ne passe pas à la Phase 3 tant que 2.9 n'est pas vert.**

### ▶️ PHASE 3 — Tableaux de bord *(1 semaine)*
```
3.1  Coquille web : barre latérale, en-tête, navigation par rôle
3.2  Navigation basse mobile
3.3  Tableau de bord directeur (chiffres + 2 graphiques)
3.4  Tableau de bord coach
3.5  Paramètres de l'académie
```
**Test :** je me connecte en directeur, je vois 20 joueurs et 3 coachs.

### ▶️ PHASE 4 — Personnes et structure *(2 semaines)*
```
4.1  Catégories U7→U18 (CRUD + méthodologie)
4.2  Équipes + affectation des coachs
4.3  Joueurs : liste, filtres, recherche
4.4  Fiche joueur (2 variantes : admin / coach)
4.5  Formulaire joueur + photo
4.6  Affectation joueur → équipe
4.7  Coachs : liste et fiche
```
**Test :** je crée une équipe U11, j'y mets 16 joueurs, j'affecte un coach.
Le coach se connecte : il voit ses 16 joueurs, et **aucun autre**.

### ▶️ PHASE 5 — Bibliothèque *(2,5 semaines)*
```
5.1  Domaines et compétences (CRUD)
5.2  Exercices : liste + filtres croisés
5.3  Formulaire d'exercice (20 champs)
5.4  Envoi de vidéos + miniatures + lecteur
5.5  packages/diagrams : le format JSON (document 14)
5.6  Lecteur de schémas 2D animés          ← faire le lecteur EN PREMIER
5.7  Éditeur de schémas 2D (version simple) ← ✅ livré (moteur pur, ADR-20)
5.8  20 exercices FUTURISTE saisis
5.9  Méthodologie par âge (CMS)
```
**Test :** un coach trouve un exercice « U11 · intelligence · 16 joueurs »
en moins de 20 secondes et comprend le schéma en moins de 10 secondes.

### ▶️ PHASE 6 — Session Studio *(2 semaines)*
```
6.1  Moteur de règles dans packages/core  ← ✅ livré (sessions/plan.ts)
6.2  Tests du moteur (30 cas au minimum)  ← ✅ livré (44 cas)
6.3  Assistant en 4 étapes  ← ✅ livré
6.4  Timeline 7 phases, réordonnable  ← ✅ livré
6.5  Retirer / remplacer un exercice  ← ✅ livré
6.6  Adapter à l'effectif réel  ← ✅ livré
6.7  Enregistrer, dupliquer, modèles  ← ✅ livré
```
**Test :** créer une séance U11 90 min en moins de 6 minutes.
**Le moteur doit remonter les exercices liés aux objectifs actifs du groupe.**

> ⚠️ **Un manque de cette phase, trouvé et comblé le 27/09.** Les séances
> étaient bien enregistrées, mais **sans leur événement au calendrier** — et
> `attendance.event_id` pointe vers `events`. L'appel de la phase 7 aurait été
> impossible, sans qu'aucune erreur ne le dise. Le miroir séance → événement vit
> désormais dans le schéma (ADR-24), pas dans l'application : toute séance, quel
> que soit le chemin qui la crée, a son événement. Vingt présences sont entrées
> dans le jeu de démonstration, sans quoi aucun contrôle de sécurité ne pouvait
> atteindre `events` ni `attendance`.

### ▶️ PHASE 7 — Mode Terrain et hors ligne *(2 semaines)* 🔴
```
7.1  Couche hors ligne (IndexedDB web)  ← ✅ livré (mobile en phase 11)
7.2  Pré-téléchargement d'une séance
7.3  File de synchronisation + anti-doublon  ← ✅ livré (moteur pur)
7.4  Interface Mode Terrain
7.5  Chronomètre + écran maintenu allumé
7.6  Prise de présence tactile  ← chemin de base prêt (événement + RLS vérifiés)
7.7  🧪 TEST EN MODE AVION, SÉANCE COMPLÈTE
```
**Test :** téléphone en mode avion pendant 90 minutes, séance complète animée,
présences saisies, tout se synchronise au retour du réseau.

### ▶️ PHASE 8 — Le cœur : évaluations et progression *(2,5 semaines)* ⭐
```
8.1  Évaluation post-séance (groupe + joueurs)
8.2  Écriture hors ligne des évaluations
8.3  Objectifs MY NEXT LEVEL (max 3)
8.4  ⭐ Observation → objectif en 2 taps
8.5  Radar 8 domaines + courbes
8.6  Instantanés mensuels (tâche de nuit)
8.7  PLAYER DNA + seuil de confiance
8.8  Badges
8.9  Espace joueur (2 niveaux d'interface)
8.10 ⭐ BOUCLER : le Session Studio consomme les objectifs actifs
```
**Test :** le scénario complet du document 07, parcours 1, de bout en bout.
**8.10 est LE critère de réussite du MVP.**

### ▶️ PHASE 9 — Parents *(1,5 semaine)* 🔴
```
9.1  Comptes parents + invitations
9.2  Consentements (données, médias, médical)
9.3  Espace parent (10 écrans, lecture seule)
9.4  FUTURISTE FAMILY
9.5  Annonces + notifications
9.6  Signalement d'absence (seule écriture autorisée)
9.7  🧪 RE-JOUER LES 12 TESTS DE SÉCURITÉ
```
**Test :** deux comptes parents de deux familles différentes. Aucune fuite.

**🎉 MVP TERMINÉ — on met en production et on teste avec 3 vrais coachs
pendant un mois avant d'écrire une seule ligne de la V2.**

### ▶️ PHASES 10 à 13
Voir `09-ROADMAP.md`. Elles ne démarrent qu'après un retour du terrain.

---

## 5. Règle de fin de phase (à appliquer 9 fois)

Une phase n'est **jamais** terminée tant que ces 6 points ne sont pas cochés :

```
[ ] 1. Ça marche sur ordinateur ET sur téléphone
[ ] 2. Les tests automatiques passent (pnpm test)
[ ] 3. Les tests de sécurité RLS passent toujours
[ ] 4. RIEN de la phase précédente n'est cassé
[ ] 5. Le fondateur a testé lui-même et validé
[ ] 6. C'est poussé sur GitHub avec un message clair
```

Le point **4** est celui qu'on oublie. À chaque fin de phase, on rejoue le
parcours des phases précédentes. Une régression découverte trois phases plus
tard coûte dix fois plus cher.
