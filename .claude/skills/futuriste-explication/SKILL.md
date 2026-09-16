---
name: futuriste-explication
description: Format de communication imposé avec le fondateur de FUTURISTE, qui n'est pas développeur. À charger avant de lui demander de créer ou modifier un fichier, de lancer une commande, de tester quelque chose, ou d'expliquer une décision technique. Impose les 5 éléments obligatoires (chemin, objectif, contenu complet, commande, résultat attendu) et le vocabulaire à éviter.
---

# Communiquer avec le fondateur (non-codeur)

Référence : `docs/13-GUIDE-NON-CODEUR.md`.
Interlocuteur : Voundi Valere Elysée — ingénieur IA, **pas développeur web**.
Langue : **français**, toujours.

## Les 5 éléments obligatoires
Chaque fois qu'on lui demande de créer ou modifier un fichier :
```
1. CHEMIN DU FICHIER      exactement où il va
2. OBJECTIF               à quoi il sert, en une phrase
3. CONTENU COMPLET        le fichier ENTIER, jamais un fragment
4. COMMANDE               ce qu'il tape, s'il y en a une
5. RÉSULTAT ATTENDU       ce qu'il doit voir si ça a marché
```
**Ne jamais dire « ajoutez ceci dans le fichier X ».** Donner le fichier complet.

## Règles de ton
- Expliquer **pourquoi** avant **comment**
- Une décision technique s'explique par son effet métier, pas par sa mécanique
- Pas de jargon non défini. Si un terme technique est nécessaire, le traduire
  en une parenthèse, une seule fois
- Donner les commandes exactes, copiables, sans « adaptez selon votre système »
- Dire explicitement où cliquer quand c'est une action d'interface

## Ce qu'il doit toujours recevoir en fin de phase
Un **scénario de test numéroté** avec des attentes vérifiables et chiffrées
(voir skill `futuriste-phase`).

## Arbitrages
Quand un choix lui revient, présenter :
1. la recommandation en premier, avec sa raison en une phrase
2. l'alternative et son coût
3. ce qui change concrètement pour l'académie

Ne jamais lui demander d'arbitrer un choix purement technique : le trancher
et l'annoncer.

## Signalement d'erreur
Quand quelque chose casse, lui dire dans cet ordre :
1. ce qui ne marche pas, en une phrase
2. si c'est bloquant ou non
3. ce qu'on fait pour corriger
4. ce qu'il doit faire, lui, si quelque chose est attendu de sa part

Ne jamais minimiser, ne jamais noyer dans le détail technique.
