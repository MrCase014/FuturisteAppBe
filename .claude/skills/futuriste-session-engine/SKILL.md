---
name: futuriste-session-engine
description: Règles du moteur de génération de séances FUTURISTE (Session Studio et AI Session Generator). À charger avant de travailler sur packages/core/src/session-engine, sur le Session Studio, sur l'adaptation d'une séance à un effectif, ou sur les Edge Functions d'IA. Contient le pipeline en 5 étapes, la formule de notation des exercices, la séparation garde-fous/IA et les 4 règles du contrat IA.
---

# Moteur de séances FUTURISTE

Référence : `docs/01-ARCHITECTURE.md` §6C et `docs/09-ROADMAP.md`.
Code : `packages/core/src/session-engine/`.

## Principe directeur
**Le moteur est déterministe et testé. L'IA s'ajoute par-dessus, elle ne le
remplace pas.** Les garde-fous méthodologiques restent du code — l'IA ne peut
structurellement pas violer une règle d'âge.

## Pipeline en 5 étapes
1. **Charger la méthodologie** de la catégorie (`age_groups` + `methodology`)
2. **Construire la timeline** : 7 phases, durées proportionnées à la catégorie
3. **Filtrer** les exercices : âge · effectif · compétence visée · durée · matériel
4. **Noter** :
   - `+3` si la compétence est un objectif ACTIVE d'au moins 3 joueurs du groupe
   - `+2` si l'exercice n'a pas été utilisé depuis 3 semaines (variation)
   - `+1` si la compétence figure dans les `priority_competencies` de la catégorie
   - `-5` si l'exercice enfreint une règle d'âge (voir skill `futuriste-methodologie`)
5. **Proposer** — le coach garde toujours la main (ajouter, retirer, déplacer, remplacer)

## L'étape 4 est le cœur du produit
Sans le bonus `+3`, le Session Studio propose des exercices au hasard et nous
avons construit un logiciel de gestion de plus. C'est le critère d'acceptation
n°5 du MVP. Ne jamais le désactiver « pour simplifier ».

## Adaptation à l'effectif
`adapter.ts` doit gérer de 6 à 24 joueurs : ajuster le nombre d'ateliers, les
dimensions de zone et le format (3v3 → 5v5 → 8v8), sans jamais créer de file
d'attente de plus de 4 joueurs.

## Contrat IA (Phase 12) — 4 règles
1. L'IA ne propose **que** des exercices présents dans la bibliothèque de l'académie
2. L'IA ne peut violer **aucune** règle dure — le code valide et corrige après coup
3. L'IA propose, **le coach décide**, toujours
4. Toute requête est tracée dans `ai_requests` (auteur, contenu, coût)

Si la sortie de l'IA échoue à la validation, **retomber silencieusement sur le
moteur de règles**. Ne jamais afficher une séance non conforme.

## Performance
Génération < 300 ms hors IA. Le moteur doit fonctionner **hors ligne**
(aucun appel réseau dans `packages/core`).

## Tests
Minimum 30 cas dans `packages/core/tests/session-engine/`, dont un par règle dure
et un par catégorie U7→U18. Le moteur se teste **avant** que l'interface existe.
