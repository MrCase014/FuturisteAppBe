# 11 — LE FUTURISTE FOOTBALL MODEL

> Ce document est la **propriété intellectuelle** de FUTURISTE ACADÉMIE FC.
> Il est traduit en code dans `packages/core/src/methodology/` et en données
> dans `supabase/seed/`. Le directeur peut le modifier depuis l'application.
>
> **Origine :** inspiré librement de la pédagogie moderne du football des jeunes,
> du jeu de position, de l'apprentissage par le jeu et des cadres grassroots
> internationaux. **Aucun contenu propriétaire d'un club tiers n'est repris.**
> Le modèle ci-dessous est une construction originale.

---

## 1. Le principe fondateur

> ## « On développe le joueur avant de développer le poste. »

Un enfant de 10 ans n'est pas un latéral droit. C'est un enfant qui apprend à
courir, décider, oser, contrôler et coopérer. Le poste est une **conséquence
tardive**, jamais un point de départ.

Conséquences concrètes, imposées par le logiciel :
- Le PLAYER DNA décrit une **manière de jouer**, jamais un poste.
- Il est **désactivé** en U7 et U9.
- Il reste masqué tant que la confiance statistique est insuffisante.
- Un joueur a des `experienced_positions[]` — au **pluriel**, volontairement.

---

## 2. Les 6 piliers

| Pilier | Question posée | Se mesure par |
|---|---|---|
| **1. TECHNIQUE** | Sait-il faire ? | Domaine TECHNIQUE |
| **2. INTELLIGENCE** | Sait-il quand et pourquoi ? | Domaines INTELLIGENCE + TACTIQUE |
| **3. VITESSE** | Le fait-il assez vite ? | Domaine VITESSE |
| **4. PHYSIQUE** | Son corps le lui permet-il ? | Domaine PHYSIQUE |
| **5. PERSONNALITÉ** | Ose-t-il, persévère-t-il ? | Domaine MENTAL |
| **6. VALEURS** | Quel garçon, quelle fille devient-il ? | Domaines SOCIAL + ÉDUCATION |

Les 6 piliers se déclinent en **8 domaines mesurables** dans la base de données
(un radar à 8 axes est lisible ; un radar à 6 axes perd la nuance entre
intelligence de perception et intelligence collective).

---

## 3. Les 8 domaines et leurs compétences

### ⚽ TECHNIQUE — *le vocabulaire*
`conduite` · `contrôle` · `contrôle orienté` · `passe courte` · `passe longue` ·
`réception` · `dribble` · `1 contre 1 offensif` · `finition` · `pied faible` ·
`jeu aérien` · `protection du ballon`

### 🧠 INTELLIGENCE — *la grammaire*
`prise d'information` · `perception` · `anticipation` · `décision` ·
`orientation du corps` · `occupation de l'espace` · `création d'espace` ·
`déplacement sans ballon` · `reconnaissance des supériorités` · `timing`

### ⚡ VITESSE — *le tempo*
`vitesse de réaction` · `accélération` · `vitesse maximale` ·
`changement de direction` · `vitesse avec ballon` · `vitesse de décision`

### 💪 PHYSIQUE — *le moteur*
`coordination` · `équilibre` · `mobilité` · `agilité` · `endurance` ·
`explosivité` · `puissance` · `récupération`

### 📐 TACTIQUE — *l'organisation collective*
`largeur` · `profondeur` · `intervalles` · `lignes de passe` ·
`supériorité numérique` · `pressing` · `couverture` · `transition offensive` ·
`transition défensive` · `sortie de balle` · `progression` · `finition collective`

### 🔥 MENTAL — *le caractère*
`confiance` · `concentration` · `courage` · `persévérance` ·
`gestion de l'erreur` · `compétitivité` · `autonomie` · `leadership`

### 🤝 SOCIAL — *le collectif*
`communication` · `respect` · `coopération` · `esprit d'équipe` ·
`leadership collectif`

### 📚 ÉDUCATION — *l'homme et la femme*
`discipline` · `hygiène` · `sommeil` · `nutrition` · `école` ·
`responsabilité` · `respect de l'arbitre` · `fair-play`

**≈ 70 compétences.** Chacune porte un `observable_behaviour` :
*« ce que je dois VOIR sur le terrain pour dire que c'est acquis ».*
Sans cette phrase, deux coachs ne notent pas la même chose et toute la donnée
devient inexploitable.

---

## 4. Ce qu'on privilégie, ce qu'on évite

| ✅ On privilégie | ❌ On évite |
|---|---|
| Le jeu comme support d'apprentissage | Les longues explications debout |
| La découverte guidée | La démonstration imposée |
| L'expérimentation, l'erreur autorisée | La peur de rater |
| La répétition **avec variation** | La répétition mécanique sans contexte |
| Les petits jeux, rondos, jeux de position | Les files d'attente |
| Les situations de décision | Les exercices sans opposition |
| La créativité, le geste tenté | La consigne unique |
| La polyvalence | La spécialisation précoce |
| Le ballon au pied le plus souvent possible | Le physique sans ballon avant U15 |
| Le plaisir | L'obsession du résultat |

### Règles dures (appliquées par le code, pas par la bonne volonté)

Ces règles sont écrites dans `packages/core/src/methodology/constraints.ts`.
Le Session Studio **refuse** une séance qui les enfreint et explique pourquoi.

| Catégorie | Règle | Motif |
|---|---|---|
| U7 | Aucun bloc analytique > 10 min | Attention limitée |
| U7-U9 | ≥ 60 % du temps avec un ballon par enfant | Temps de contact |
| U7-U9 | Aucune séance > 75 min | Fatigue, plaisir |
| U7-U11 | Aucun travail physique sans ballon | Inutile et démotivant |
| U7-U11 | Aucun poste fixe imposé | Développer le joueur |
| Toutes | Aucune file d'attente > 4 joueurs | Temps de jeu réel |
| Toutes | ≥ 1 bloc de jeu libre ou réduit par séance | Transfert |
| U13+ | Jeu de position obligatoire ≥ 1 fois/semaine | Structure collective |
| U15+ | Vitesse travaillée à l'état frais, jamais en fin de séance | Efficacité |
| Toutes | Retour au calme obligatoire | Récupération, débriefing |

---

## 5. La méthodologie par catégorie

> Modifiable par le directeur : écran D12, table `age_groups` + `methodology`.

### U7 — 6-7 ans · « Le plaisir et le ballon »
- **Durée :** 60 min · **Fréquence :** 1 à 2 fois/semaine · **Complexité :** 1/5
- **Priorités :** motricité globale, coordination, relation au ballon, 1v1, plaisir
- **Format :** 3v3 / 4v4, beaucoup de buts, beaucoup de ballons
- **Évaluation :** **qualitative uniquement**, aucune note affichée
- **Interdits :** statistiques, postes, physique sans ballon, discours longs

### U9 — 8-9 ans · « Oser et répéter »
- **Durée :** 75 min · **Fréquence :** 2 fois/semaine · **Complexité :** 2/5
- **Priorités :** technique de base, dribble, courage, pied faible, petits jeux
- **Format :** 4v4 / 5v5, duels, parcours ludiques
- **Évaluation :** 8 compétences maximum, échelle 1-5 visible du coach seul
- **Nouveauté :** premier objectif MY NEXT LEVEL

### U11 — 10-11 ans · « Voir avant de recevoir »
- **Durée :** 90 min · **Fréquence :** 2-3 fois/semaine · **Complexité :** 3/5
- **Priorités :** **contrôle orienté**, prise d'information, décision, espace
- **Format :** 5v5 / 7v7, rondos, jeux de position simples
- **Évaluation :** les 8 domaines, radar visible du joueur et du parent
- **Charnière :** c'est ici que le joueur apprend à **regarder avant de recevoir**

### U13 — 12-13 ans · « Comprendre le jeu »
- **Durée :** 90 min · **Fréquence :** 3 fois/semaine · **Complexité :** 4/5
- **Priorités :** jeu de position, largeur, profondeur, transitions, tactique
- **Format :** 8v8 / 11v11, jeux de position 4v4+3, situations réelles
- **Nouveauté :** PLAYER DNA activé, statistiques de match complètes

### U15 — 14-15 ans · « Intensité et compétition »
- **Durée :** 100 min · **Fréquence :** 3-4 fois/semaine · **Complexité :** 4/5
- **Priorités :** intensité, vitesse, physique **avec ballon**, tactique, compétition
- **Attention :** pic de croissance → surveiller la charge, adapter individuellement

### U16 — 16 ans · « Vers la performance »
- **Durée :** 100 min · **Fréquence :** 4 fois/semaine · **Complexité :** 5/5
- **Priorités :** spécialisation progressive, analyse, autonomie, préparation physique

### U18 — 17-18 ans · « Le joueur autonome »
- **Durée :** 105 min · **Fréquence :** 4-5 fois/semaine · **Complexité :** 5/5
- **Priorités :** performance, analyse vidéo, autonomie, projet de vie
- **Sortie :** 📄 **Dossier de développement FUTURISTE** (12 ans de données)

---

## 6. Les 7 phases d'une séance

| # | Phase | Part | Rôle | Ballon ? |
|:---:|---|:---:|---|:---:|
| 1 | **ACCUEIL** | 10 % | Jeu libre. Le joueur arrive quand il arrive | ✅ toujours |
| 2 | **ACTIVATION** | 15 % | Éveil, coordination, mise en action | ✅ |
| 3 | **TECHNIQUE** | 15 % | Répétition **avec variation** et opposition légère | ✅ |
| 4 | **JEU RÉDUIT** | 20 % | Petits jeux, duels, densité de décisions | ✅ |
| 5 | **JEU DE POSITION** | 20 % | Rondos, supériorités, occupation de l'espace | ✅ |
| 6 | **SITUATION RÉELLE** | 15 % | Le match, avec le thème du jour | ✅ |
| 7 | **RETOUR AU CALME** | 5 % | Étirements, débriefing, question au joueur | ⚪ |

**Adaptations automatiques :**
- **U7-U9 :** on fusionne 4 et 5 (le jeu de position formel vient plus tard)
- **U13+ :** la phase 5 devient obligatoire
- **< 70 min :** on supprime la phase 3 avant de toucher aux phases 4-6

> **Règle du débriefing (phase 7) :** le coach pose une question, il ne fait pas
> un discours. *« Qu'est-ce que tu as vu avant de faire ta passe ? »*
> C'est là que l'intelligence de jeu se construit vraiment.

---

## 7. L'échelle d'évaluation

| Niveau | Libellé | Signification observable |
|:---:|---|---|
| **1** | Découverte | Il essaie. Le geste n'est pas encore là |
| **2** | En progression | Réussit sans pression, sans opposition |
| **3** | Acquis | Réussit en situation de jeu, sous pression légère |
| **4** | Très bon | Réussit sous pression réelle, avec régularité |
| **5** | Excellence | Le fait sans y penser, et le fait au bon moment |

### ⭐ Le commentaire vaut plus que la note

> ❌ *« Sekou : 2/5 en prise d'information »* → informe de rien, ne dit pas quoi faire.
>
> ✅ *« Sekou regarde rarement avant de recevoir, surtout côté gauche »* →
> se transforme immédiatement en objectif, en exercice et en progression.

L'application pousse le commentaire **avant** la note. Une évaluation sans
commentaire qualitatif déclenche un rappel.

---

## 8. MY NEXT LEVEL — les objectifs individuels

**Règles :**
- **1 à 3 objectifs actifs maximum.** Quatre objectifs = aucun objectif.
- Formulé **à la première personne, en action observable**.
- Rattaché à **une** compétence du référentiel.
- Il naît d'une **observation réelle**, jamais d'une case cochée au hasard.
- Revu toutes les 4 à 6 semaines.

| ❌ Mauvais objectif | ✅ Bon objectif |
|---|---|
| « Améliorer sa technique » | « Réussir mon contrôle orienté côté gauche » |
| « Être plus intelligent » | « Regarder autour de moi avant de recevoir » |
| « Progresser du pied gauche » | « Faire 5 passes du pied gauche par match » |
| « Être plus combatif » | « Revenir défendre après chaque perte de balle » |

---

## 9. PLAYER DNA — les 7 archétypes

| Archétype | Ce qui le caractérise |
|---|---|
| 🎨 **Créateur** | Trouve la passe que personne ne voit |
| 🪄 **Dribbleur** | Élimine, ose, prend le risque du 1v1 |
| 🎯 **Finisseur** | Se place, conclut, sent le but |
| 🧭 **Organisateur** | Oriente le jeu, rythme, relie les lignes |
| 🛡️ **Défenseur** | Anticipe, protège, gagne le duel |
| ⚡ **Transition** | Bascule vite d'une phase à l'autre |
| 🔄 **Polyvalent** | Efficace partout, s'adapte |

**Les 4 garde-fous :**
1. Désactivé en **U7 et U9**.
2. Masqué tant que `confidence < 0,6` → affiche *« Profil en construction »*.
3. **Jamais visible du parent.**
4. **Évolutif** : recalculé chaque mois, et il change. Un enfant n'est pas figé.

---

## 10. Les badges FUTURISTE

Les badges récompensent le **développement**, jamais le résultat.
Aucun badge pour « meilleur buteur ». Aucun classement entre joueurs.

| Domaine | Badge | Se gagne en… |
|---|---|---|
| TECHNIQUE | ⚽ Ball Master | atteignant le niveau 4 en conduite et contrôle |
| TECHNIQUE | 🪄 1v1 Creator | osant le dribble régulièrement, réussi ou non |
| TECHNIQUE | 🎯 Finisher | progressant de 2 niveaux en finition |
| TECHNIQUE | 🦶 Weak Foot | atteignant le niveau 3 du pied faible |
| INTELLIGENCE | 🧠 Game Thinker | progressant en décision sur un trimestre |
| INTELLIGENCE | 👁️ Scanner | atteignant le niveau 4 en prise d'information |
| INTELLIGENCE | 📐 Space Finder | progressant en occupation de l'espace |
| MENTAL | 🔥 Never Give Up | atteignant un objectif difficile |
| MENTAL | 💪 Courage | osant après un échec |
| MENTAL | ⭐ Leader | par décision du coach |
| SOCIAL | 🤝 Team First | par décision du coach |
| ÉDUCATION | 📚 Student | assiduité scolaire + académie |
| ÉDUCATION | 🕊️ Fair-Play | par décision du coach |

**Ce qui est interdit :** badge de buteur, badge de vainqueur, classement public,
comparaison entre joueurs. Le football des jeunes n'a pas besoin de ça.

---

## 11. Le contrat de l'IA FUTURISTE

Quand l'IA sera branchée (Phase 12), elle sera liée par ce document :

1. Elle ne propose **que** des exercices de la bibliothèque de l'académie.
2. Elle ne peut violer **aucune** règle dure du §4 — le code refuse et corrige.
3. Elle respecte la répartition des 7 phases du §6.
4. Elle formule les objectifs selon les règles du §8.
5. Elle ne produit **jamais** de jugement définitif sur un enfant.
6. Elle propose ; **le coach décide**. Toujours.
