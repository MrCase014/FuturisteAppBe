---
name: futuriste-phase
description: Procédure de démarrage et de clôture d'une phase de développement FUTURISTE. À charger au début d'une nouvelle phase, avant de livrer une phase, avant un commit important, ou quand on demande « où en est le projet » / « on passe à la phase suivante ». Contient l'ordre imposé des 9 phases du MVP, la checklist de fin de phase en 6 points et le format du scénario de test remis au fondateur.
---

# Procédure de phase FUTURISTE

Référence : `docs/10-COMPLEXITE-ET-ORDRE.md`.

## Ordre imposé (ne jamais sauter une étape)
```
0 Validation architecture   ← aucun code avant le feu vert du fondateur
1 Fondations (monorepo, tokens, i18n, CI)
2 Base de données + RLS + connexion   🔴 bloquant sur les 12 tests
3 Tableaux de bord
4 Joueurs · catégories · équipes
5 Bibliothèque d'exercices (lecteur de schémas AVANT éditeur)
6 Session Studio (moteur de règles AVANT interface)
7 Mode Terrain + hors ligne  🔴 test en mode avion obligatoire
8 Évaluations + progression  ⭐ boucler sur le Session Studio (8.10)
9 Parents  🔴 rejouer les 12 tests de sécurité
```

## Au démarrage d'une phase
1. Créer une branche : `claude/phase-N-<sujet>`
2. Annoncer au fondateur ce que contient la phase et ce qu'il pourra tester
3. Charger les skills concernés (`futuriste-database` pour la 2, etc.)

## Checklist de fin de phase — les 6 points
```
[ ] 1. Fonctionne sur ordinateur ET sur téléphone
[ ] 2. pnpm test passe
[ ] 3. Les 12 tests de sécurité RLS passent toujours
[ ] 4. RIEN de la phase précédente n'est cassé   ← le point qu'on oublie
[ ] 5. Le fondateur a testé lui-même et validé
[ ] 6. Poussé sur GitHub avec un message clair
```

Le point 4 se vérifie en rejouant les scénarios des phases précédentes.
Une régression trouvée trois phases plus tard coûte dix fois plus cher.

## Scénario de test à remettre au fondateur
Toujours ce format, numéroté, avec des attentes vérifiables :
```
SCÉNARIO DE TEST — PHASE N (<module>)
1. Connectez-vous en tant que <rôle> (<identifiants de test>)
2. <action précise>
3. ✅ Vous devez voir <résultat exact>
4. ✅ <mesure chiffrée : durée, nombre, total>
❌ Si un point échoue, dites-moi LEQUEL (le numéro suffit).
```

## Garde-fous de calendrier
- Éditeur de schémas 2D : **12 jours maximum**, au-delà on livre le lecteur seul
- Si une phase dépasse de 50 % son estimation : prévenir le fondateur et
  proposer de réduire le périmètre, jamais de sacrifier les tests de sécurité

## Ne jamais
- Passer à la phase suivante si les tests de sécurité échouent
- Livrer une phase sans scénario de test
- Travailler directement sur la branche principale
