---
name: futuriste-methodologie
description: Règles football FUTURISTE à respecter obligatoirement. À charger avant d'écrire ou de modifier tout contenu pédagogique - exercices, séances, catégories d'âge, compétences, objectifs de joueur, badges, prompts IA, données de seed, ou tout écran affichant des évaluations. Contient les interdits pédagogiques par catégorie (U7 à U18), la structure en 7 phases d'une séance, l'échelle 1-5, les règles MY NEXT LEVEL et les garde-fous PLAYER DNA.
---

# Méthodologie FUTURISTE — règles dures

Référence complète : `docs/11-METHODOLOGIE-FUTURISTE.md`.
Ce fichier contient ce qui ne doit **jamais** être enfreint par du code.

## Principe fondateur
« On développe le joueur avant de développer le poste. »

## Interdits absolus — le code doit les faire respecter

| Catégorie | Règle | Où c'est appliqué |
|---|---|---|
| U7 | Aucun bloc analytique > 10 min | `core/methodology/constraints.ts` |
| U7-U9 | ≥ 60 % du temps avec un ballon par enfant | idem |
| U7-U9 | Séance ≤ 75 min | idem |
| U7-U11 | Aucun travail physique sans ballon | idem |
| U7-U11 | Aucun poste fixe imposé | idem |
| Toutes | File d'attente ≤ 4 joueurs | idem |
| Toutes | ≥ 1 bloc de jeu libre/réduit par séance | idem |
| U13+ | Jeu de position ≥ 1×/semaine | idem |
| U15+ | Vitesse à l'état frais, jamais en fin de séance | idem |
| Toutes | Retour au calme obligatoire | idem |

Le Session Studio **refuse** une séance non conforme et explique pourquoi.
Ne jamais contourner ces règles « pour simplifier ».

## Les 7 phases d'une séance
ACCUEIL 10 % · ACTIVATION 15 % · TECHNIQUE 15 % · JEU_REDUIT 20 % ·
JEU_POSITION 20 % · SITUATION_REELLE 15 % · RETOUR_CALME 5 %

- U7-U9 : fusionner JEU_REDUIT et JEU_POSITION
- U13+ : JEU_POSITION obligatoire
- Séance < 70 min : supprimer TECHNIQUE avant de toucher aux phases de jeu

## Échelle d'évaluation
1 Découverte · 2 En progression · 3 Acquis · 4 Très bon · 5 Excellence

Le commentaire qualitatif prime sur la note. Une évaluation sans commentaire
déclenche un rappel. Ne jamais afficher une note brute à un parent (ADR-11).

## MY NEXT LEVEL
- 1 à 3 objectifs ACTIVE maximum, jamais plus (règle appliquée dans `core`)
- Formulé à la 1ʳᵉ personne, en action observable
- Rattaché à une compétence du référentiel
- Né d'une observation réelle

## PLAYER DNA — 4 garde-fous non négociables
1. Désactivé en U7 et U9
2. Masqué si `confidence < 0.6` → afficher « Profil en construction »
3. Jamais visible du parent
4. Recalculé mensuellement — un enfant n'est pas figé

## Badges
Récompensent le développement, jamais le résultat.
**Interdits :** badge de buteur, badge de vainqueur, classement public,
comparaison entre joueurs.

## Statistiques et âge
U7 et U9 : n'afficher que présence, engagement et commentaires qualitatifs.
Les buts, passes décisives et duels sont enregistrables mais masqués.

## Nommage
Le produit s'appelle **FUTURISTE ACADÉMIE FC**, partout.
Interdits dans le code, l'UI et les commits : Coach OS, Barcelona, La Masia,
Real Madrid, ou tout nom de club tiers.
