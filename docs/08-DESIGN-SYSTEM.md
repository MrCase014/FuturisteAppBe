# 08 — DESIGN SYSTEM FUTURISTE

Identité **premium, sportive, moderne, très visuelle**.
Palette officielle : **violet · blanc · bleu clair**.

> Règle d'or : **aucune couleur écrite en dur dans un écran.** Toujours un *token*.
> Le jour où le directeur change une nuance, on modifie **un** fichier.

---

## 1. Couleurs de marque

| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `--futuriste-violet` | `#7C3AED` | `#9A7CF0` | Couleur primaire, actions, identité |
| `--futuriste-violet-deep` | `#5B21B6` | `#7A4CDB` | Titres, en-têtes, survol |
| `--futuriste-sky` | `#38BDF8` | `#38BDF8` | Accent, bleu clair de la marque |
| `--futuriste-sky-deep` | `#0284C7` | `#3987E5` | Liens, éléments interactifs secondaires |
| `--futuriste-white` | `#FFFFFF` | — | Fonds de cartes (mode clair) |
| `--futuriste-ink` | `#0B0A14` | `#F5F3FF` | Texte principal |

### Surfaces

| Token | Clair | Sombre |
|---|---|---|
| `--surface-app` | `#FAFAFC` | `#0F0E17` |
| `--surface-card` | `#FFFFFF` | `#1A1A19` |
| `--surface-raised` | `#F4F2FF` | `#242233` |
| `--border` | `#E8E5F5` | `#2F2D3F` |

### Texte

| Token | Clair | Sombre |
|---|---|---|
| `--text-primary` | `#0B0A14` | `#FFFFFF` |
| `--text-secondary` | `#52506B` | `#C3C2B7` |
| `--text-muted` | `#8B89A3` | `#8E8C9E` |

> **Le mode sombre n'est pas un inversement automatique.** Chaque valeur sombre
> est choisie et vérifiée séparément. Utile en soirée sur le terrain.

---

## 2. Couleurs des 8 domaines (palette de graphiques)

**Validée par script**, pas à l'œil : bande de luminosité, seuil de saturation,
séparation pour les daltonismes (protan/deutan/tritan) et contraste sur fond.
Résultat : *tous les contrôles passent, en clair et en sombre.*

| Slot | Domaine | Clair | Sombre |
|:---:|---|---|---|
| 1 | **INTELLIGENCE** | `#2A78D6` | `#3987E5` |
| 2 | **PHYSIQUE** | `#EB6834` | `#D95926` |
| 3 | **VITESSE** | `#1BAF7A` | `#199E70` |
| 4 | **ÉDUCATION** | `#EDA100` | `#C98500` |
| 5 | **MENTAL** | `#E87BA4` | `#D55181` |
| 6 | **SOCIAL** | `#008300` | `#008300` |
| 7 | **TECHNIQUE** | `#7C3AED` | `#9A7CF0` |
| 8 | **TACTIQUE** | `#E34948` | `#E66767` |

**L'ordre des slots est une mesure de sécurité visuelle, pas une décoration.**
Il a été choisi pour que deux domaines voisins restent distinguables par une
personne daltonienne. **Ne jamais réordonner sans relancer le validateur.**

⚠️ **Règle de secours obligatoire.** Trois couleurs claires (VITESSE, ÉDUCATION,
MENTAL) passent sous 3:1 de contraste sur fond clair. Partout où elles
apparaissent, l'écran **doit** afficher un libellé visible ou proposer la vue
tableau. La couleur ne porte jamais l'information seule.

---

## 3. Échelle d'évaluation 1 → 5

Une seule teinte (le violet de la marque), du clair au foncé. La progression de
niveau se lit **même en noir et blanc**.

| Niveau | Libellé | Clair | Sombre |
|:---:|---|---|---|
| 1 | Découverte | `#B9A7F7` | `#5D35A6` |
| 2 | En progression | `#9A7CF0` | `#7A4CDB` |
| 3 | Acquis | `#7C3AED` | `#9668F8` |
| 4 | Très bon | `#6425C7` | `#B69FFC` |
| 5 | Excellence | `#4A1D96` | `#D4CAFE` |

Rampe validée : luminosité monotone, écarts visibles entre chaque niveau,
extrémité claire détachée du fond. **Un niveau s'affiche toujours avec son
chiffre ET son libellé**, jamais par la pastille seule.

---

## 4. Couleurs d'état (jamais réutilisées pour un domaine)

| Rôle | Hex | Usage |
|---|---|---|
| `good` | `#0CA30C` | Présent, objectif atteint, en hausse |
| `warning` | `#FAB219` | Retard, à surveiller |
| `serious` | `#EC835A` | Absence non justifiée, présence en baisse |
| `critical` | `#D03B3B` | Blessure, consentement manquant, alerte |

Une couleur d'état s'accompagne **toujours** d'une icône et d'un mot.
Jamais une pastille rouge seule.

---

## 4bis. Illustrations

> Source : `apps/web/components/illustrations/`, jetons `illustration` de
> `packages/ui/tokens/colors.json`.

### Pourquoi dessinées, et non photographiées

L'académie forme des **mineurs**. Une photographie d'enfant identifiable ne
s'affiche pas sans le consentement écrit de sa famille, et ce consentement se
retire (docs/12). Une illustration ne pose aucune de ces questions : elle va en
page d'accueil publique, se partage, s'imprime, sans exposer personne.

Elles sont en **SVG dessiné dans le code**, pas en fichier image : quelques
kilo-octets au lieu de plusieurs centaines, nettes sur tous les écrans, et aux
couleurs du club parce qu'elles lisent les mêmes jetons que le reste.

### Le parti pris visuel

Le football **tel qu'il se joue ici** : terre battue ocre, mur de parpaings,
soleil bas de saison sèche, maillots violets du club. Pas un gazon anglais sous
un ciel gris — ce serait l'image d'un autre club.

| Règle | Raison |
|---|---|
| Une seule palette, identique en thème clair et sombre | Une image ne change pas de couleur quand l'interface s'assombrit |
| Aucun visage n'a de traits | Elles représentent des enfants, et aucun enfant en particulier |
| Les membres sont des traits (`stroke`) ancrés à l'épaule ou la hanche | Dessinés en polygones, ils se détachaient du corps dès qu'une pose changeait |
| Texte alternatif obligatoire | Le type `SceneProps` l'impose : on ne peut pas l'oublier |

### Le jeu de scènes

| Composant | Usage |
|---|---|
| `TerrainDeTerre` | Bandeau d'accueil — un entraînement ordinaire |
| `EnRouteVersLeStade` | Le parcours individuel — ballon sous le bras, crampons sur l'épaule |
| `DuelAuSoleil` | L'évaluation — le duel, là où l'on apprend le plus |
| `GardienQuiPlonge` | L'appel à se connecter |
| `CoachEtSonGroupe` | La méthodologie — la consigne avant l'atelier |
| `BallonAuRepos` | Les écrans vides |

Les voir toutes : **`/apercu-illustrations`**.

### Les écrans vides ne sont pas décoratifs

Un écran vide **sans** image dit « il n'y a rien ». **Avec** l'illustration, il
dit « il n'y a rien ENCORE ». Ce n'est pas la même phrase, et la différence se
joue exactement au moment où l'on vient de créer son académie et où l'on est
le plus prêt à croire à une panne.

---

## 5. Typographie

| Rôle | Police | Détail |
|---|---|---|
| Titres | **Outfit** (Google Fonts) | Géométrique, sportive, du caractère |
| Texte | **Inter** | Lisible partout, excellent en petit |
| Chiffres | Inter `font-variant-numeric: tabular-nums` | Les colonnes s'alignent |

| Style | Taille / graisse | Usage |
|---|---|---|
| Display | 40 / 700 Outfit | Chiffre héros du tableau de bord |
| H1 | 32 / 700 Outfit | Titre de page |
| H2 | 24 / 600 Outfit | Section |
| H3 | 18 / 600 Outfit | Carte |
| Body | 16 / 400 Inter | Texte courant |
| Small | 14 / 400 Inter | Métadonnées |
| Caption | 12 / 500 Inter | Étiquettes |
| **Field** | **20 / 600 Inter** | **Mode Terrain uniquement** |

**Jamais en dessous de 14 px sur mobile.** Le coach lit au soleil, en mouvement.

---

## 6. Espacement, rayons, ombres

Grille de **4 px** : `1=4 · 2=8 · 3=12 · 4=16 · 6=24 · 8=32 · 12=48 · 16=64`

| Rayon | Valeur | Usage |
|---|---|---|
| `sm` | 8 px | Étiquettes, pastilles |
| `md` | 12 px | Boutons, champs |
| `lg` | 16 px | Cartes |
| `xl` | 24 px | Grandes cartes, feuilles |
| `full` | 9999 px | Avatars, badges |

Ombres douces et violacées, jamais noires :
`sm 0 1px 2px rgba(124,58,237,.06)` · `md 0 4px 12px rgba(124,58,237,.08)` ·
`lg 0 8px 28px rgba(124,58,237,.12)`

---

## 7. Composants de base

| Composant | Variantes | Règle |
|---|---|---|
| `Button` | primary · secondary · ghost · danger | Hauteur ≥ 44 px, **≥ 56 px en Mode Terrain** |
| `Card` | default · stat · player · exercise | Rayon `lg`, ombre `sm` |
| `Avatar` | xs → xl | Initiales si pas de photo |
| `Badge` | domain · level · status | Toujours texte + couleur |
| `LevelPill` | 1 → 5 | Chiffre + libellé, jamais la couleur seule |
| `DomainChip` | 8 domaines | Pastille + nom |
| `ProgressBar` | linear · circular | Pourcentage écrit |
| `EmptyState` | illustration + action | Jamais un écran blanc |
| `Timer` | Mode Terrain | 64 px, chiffres tabulaires |

### Composants métier

| Composant | Où | Ce qu'il fait |
|---|---|---|
| `PlayerRadar` | Fiche joueur | Radar 8 domaines, 1 ou 2 périodes comparées |
| `ProgressionChart` | Fiche joueur | Courbe 1-5 dans le temps, par domaine |
| `AttendanceBar` | Joueur / équipe | Présent · retard · absent |
| `SessionTimeline` | Session Studio | Les 7 phases, réordonnables |
| `TacticalDiagram` | Exercice | Schéma 2D animé (voir doc 14) |
| `GoalCard` | MY NEXT LEVEL | Objectif + progression + vidéo |
| `PlayerGrid` | Présences | Photos tactiles, 1 tap |
| `BadgeShelf` | Espace joueur | Collection de badges |

---

## 8. Règles de graphiques (non négociables)

1. **Un seul axe des ordonnées.** Jamais deux échelles sur un même graphique.
   Deux mesures différentes = deux graphiques.
2. **La couleur suit l'entité, jamais son rang.** INTELLIGENCE est bleu, qu'il
   soit premier ou dernier. Un filtre ne repeint jamais les survivants.
3. **Légende dès 2 séries**, plus étiquetage direct jusqu'à 4 séries.
   L'identité ne repose jamais sur la couleur seule.
4. **Une vue tableau existe toujours** derrière un graphique.
5. **Marques fines** : lignes 2 px, points ≥ 8 px, extrémités arrondies 4 px,
   2 px de fond entre deux barres voisines.
6. **Grille et axes discrets** : gris clair, jamais noir.
7. **Survol systématique** : info-bulle sur les points et les barres.
8. **Pas de chiffre sur chaque point** : étiquetage sélectif (début, fin, extrêmes).
9. **Le texte porte des jetons de texte**, jamais la couleur de la série.

---

## 9. Mise en page responsive

| Largeur | Cible | Mise en page |
|---|---|---|
| < 640 px | Téléphone | 1 colonne, navigation basse, marge latérale 16 px |
| 640-1024 px | Tablette | 2 colonnes, navigation basse ou latérale |
| 1024-1440 px | Ordinateur | Barre latérale + contenu |
| > 1440 px | Grand écran | Barre latérale + contenu + panneau de détail |

**Conception mobile d'abord.** On dessine le téléphone en premier, l'ordinateur
ensuite. L'inverse produit toujours un mobile bricolé.

---

## 10. Mode Terrain — règles spéciales

C'est un contexte, pas un thème. Il change les règles :

| Règle | Valeur normale | Mode Terrain |
|---|---|---|
| Hauteur de bouton | 44 px | **56 px minimum** |
| Taille du texte | 16 px | **20 px minimum** |
| Chronomètre | — | **64 px** |
| Contraste | AA (4,5:1) | **AAA (7:1)** |
| Informations par écran | libre | **1 seule** |
| Écran | veille normale | **maintenu allumé** |
| Saisie clavier | autorisée | **interdite** (taps uniquement) |
| Réseau | supposé | **supposé absent** |

---

## 11. Accessibilité (seuil d'acceptation)

- Contraste texte **≥ 4,5:1** (**≥ 7:1** en Mode Terrain)
- Zone tactile **≥ 44 × 44 px** (**≥ 56 px** en Mode Terrain)
- Navigation clavier complète sur le web, focus visible
- Étiquettes de formulaire explicites, jamais un simple texte d'aide
- Images et schémas : texte alternatif décrivant l'exercice
- Animations : respect de `prefers-reduced-motion`
- **Jamais d'information portée par la couleur seule**

---

## 12. Ton et écriture (français)

| ✅ Écrire | ❌ Éviter |
|---|---|
| « Sekou progresse sur le contrôle orienté » | « Sekou : 3/5 technique » |
| « À travailler : regarder avant de recevoir » | « Point faible : vision du jeu » |
| « Séance enregistrée » | « Opération effectuée avec succès » |
| « Aucune séance pour l'instant. Créer la première ? » | « Aucun résultat » |

- **Tutoiement** pour le joueur, **vouvoiement** pour le parent et le coach.
- On parle de **progression**, jamais de **niveau atteint**.
- On ne compare jamais deux joueurs dans un texte affiché.
