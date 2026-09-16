# 00 — VISION TECHNIQUE

## 1. Ce que nous construisons réellement

Beaucoup d'académies achètent un **logiciel de gestion** : présences, cotisations,
calendrier. Ce n'est pas le projet.

Nous construisons un **système de développement du joueur** : une machine qui
transforme ce que le coach observe sur le terrain en **décisions d'entraînement**.

La différence tient en une boucle :

```
   OBSERVER              →   COMPRENDRE           →   AGIR                →   MESURER
   (évaluation séance)       (profil du joueur)       (objectif + séance)     (progression)
        ▲                                                                          │
        └──────────────────────────────────────────────────────────────────────────┘
```

Un logiciel de gestion s'arrête à « OBSERVER ». FUTURISTE boucle.

**Exemple concret, de bout en bout :**

1. Mardi, le coach note sur son téléphone : *« Sekou regarde rarement avant de recevoir. »*
2. L'application propose de transformer cette phrase en objectif individuel :
   **« Regarder autour de soi avant de recevoir »**, rattaché à la compétence
   *Prise d'information* (domaine INTELLIGENCE).
3. Jeudi, quand le coach prépare la séance U11, le Session Studio met en avant
   les exercices qui travaillent la *Prise d'information*, parce que 6 joueurs du
   groupe ont cet objectif actif.
4. Après la séance, le coach coche « objectif travaillé » et note un niveau.
5. Le profil de Sekou se met à jour. Le parent voit la progression, pas la note.
6. Le directeur voit que la *Prise d'information* est le point faible du groupe U11
   et ajuste la méthodologie de la catégorie.

**C'est ça, le FUTURISTE PLAYER DEVELOPMENT SYSTEM.** Tout le reste
(présences, matchs, vidéos) existe pour alimenter cette boucle.

---

## 2. Les trois questions auxquelles le système doit toujours répondre

| Question | Où on y répond | Alimenté par |
|---|---|---|
| **Où en est le joueur ?** | Player Development Profile (radar 8 domaines + courbe dans le temps) | `player_evaluations` + `player_evaluation_scores` |
| **Que doit-il améliorer ?** | MY NEXT LEVEL (1 à 3 objectifs actifs) + PLAYER DNA | `player_goals`, `player_dna_profiles` |
| **Comment l'entraîner ?** | Session Studio + bibliothèque d'exercices filtrée par compétence | `exercises` ↔ `competencies` |

Cette colonne de droite est la raison pour laquelle la base de données est conçue
autour d'un **référentiel de compétences** et pas autour de champs libres.
Si l'évaluation est du texte libre, on ne peut rien relier. Si l'évaluation pointe
vers une compétence identifiée, tout se relie automatiquement.

> **Décision structurante n°1 :** `compétence` est l'unité atomique du système.
> Un exercice travaille des compétences. Une évaluation note des compétences.
> Un objectif vise une compétence. Un badge récompense une compétence.

---

## 3. Contraintes réelles du terrain (elles dictent la technique)

| Contrainte | Conséquence technique |
|---|---|
| Le coach est **debout, sur un terrain, au soleil, avec des gants ou un ballon en main** | Mode Terrain : gros boutons (≥ 56 px), fort contraste, 1 information par écran, pas de saisie clavier |
| La connexion internet du terrain est **mauvaise ou absente** | Mode hors ligne obligatoire : la séance du jour est téléchargée à l'avance, les évaluations sont mises en file d'attente et synchronisées au retour du réseau |
| Les téléphones sont **d'entrée ou de milieu de gamme** | Pas de 3D, pas d'animations lourdes, images compressées, vidéos en 720p max au MVP |
| Le coach doit comprendre un exercice **en moins de 10 secondes** | Le schéma 2D animé prime sur le texte. Le texte est une aide, pas la source |
| L'utilisateur principal des données est un **enfant mineur** | Sécurité et consentement ne sont pas une phase finale : ils sont dans le schéma dès la première ligne de SQL |
| Le budget de lancement est **proche de zéro** | Tout le MVP tient dans les offres gratuites (voir `02-STACK.md`) |

---

## 4. Principes d'ingénierie

1. **Une seule source de vérité métier.** Les règles FUTURISTE (quelles compétences
   à quel âge, comment calculer une progression, comment construire une séance)
   vivent dans `packages/core`, en TypeScript pur, testées. Le web et le mobile
   ne font que les afficher. On ne réécrit jamais une règle deux fois.

2. **La base de données est le produit.** Un écran se refait en 2 jours. Un schéma
   de base de données mal conçu se paie pendant 3 ans. D'où la phase actuelle.

3. **Sécurité au niveau des données, pas de l'interface.** Cacher un bouton n'est
   pas de la sécurité. Chaque table porte ses propres règles (Row Level Security)
   côté PostgreSQL : même quelqu'un qui contournerait l'application ne verrait rien.

4. **Le MVP doit être utilisable, pas complet.** Une académie qui utilise vraiment
   6 modules vaut mieux qu'une académie qui n'utilise jamais 30 modules.

5. **L'IA est préparée, pas précipitée.** Toute la structure (tables `ai_requests`,
   contrats d'API, moteur de règles déterministe) est posée dès le MVP. Le moteur
   de génération de séances fonctionne **d'abord par règles**, sans IA. Brancher
   Claude plus tard devient un remplacement de fonction, pas une réécriture.

6. **Le contenu appartient au directeur.** Exercices, vidéos, méthodologie,
   compétences, badges : tout est éditable depuis l'interface. C'est un
   **CMS football**, pas un logiciel figé.

7. **Bilingue dès la ligne 1.** Aucun texte en dur dans le code. Tous les libellés
   passent par des clés de traduction, même si seul le français est rempli au MVP.
   Ajouter l'anglais devient un fichier à remplir, pas un chantier.

---

## 5. Ce que nous ne construisons PAS au MVP

Dire non est un choix d'architecture. Reporté explicitement :

- ❌ Analyse vidéo automatique / drones / vision par ordinateur → *interfaces prêtes, traitement en Phase 13*
- ❌ Messagerie temps réel parent ↔ coach → *annonces au MVP, messagerie en V2*
- ❌ Paiement des cotisations et facturation → *V2*
- ❌ Scouting / détection externe → *V2*
- ❌ Application native publiée sur les stores → *PWA d'abord (Phase 11), stores ensuite*
- ❌ Multi-académies en marque blanche → *le schéma le permet (`academy_id` partout), l'interface ne l'expose pas au MVP*

Ces refus sont **réversibles** : chacun a sa place réservée dans le schéma.
