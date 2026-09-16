---
name: futuriste-design-system
description: Jetons de design, palette validée et règles d'interface FUTURISTE. À charger avant d'écrire un composant, un écran, une feuille de style, un graphique (radar, courbe de progression, barre de présence) ou un écran du Mode Terrain. Contient la palette de marque violet/blanc/bleu clair, les 8 couleurs de domaines validées pour les daltonismes en modes clair et sombre, l'échelle d'évaluation 1-5, la typographie, les rayons et les seuils d'accessibilité.
---

# Design system FUTURISTE

Référence complète : `docs/08-DESIGN-SYSTEM.md`.

## Règle n°1
**Aucune couleur ni aucun texte en dur dans un écran.**
Couleurs → jetons de `packages/ui/tokens`. Textes → `t('clé')` via `packages/i18n`.

## Marque
| Jeton | Clair | Sombre |
|---|---|---|
| violet | `#7C3AED` | `#9A7CF0` |
| violet-deep | `#5B21B6` | `#7A4CDB` |
| sky | `#38BDF8` | `#38BDF8` |
| sky-deep | `#0284C7` | `#3987E5` |

Surfaces clair/sombre : app `#FAFAFC`/`#0F0E17` · carte `#FFFFFF`/`#1A1A19` ·
bordure `#E8E5F5`/`#2F2D3F`.
Texte : primaire `#0B0A14`/`#FFFFFF` · secondaire `#52506B`/`#C3C2B7`.

## 8 domaines — ordre de slots VALIDÉ, ne jamais réordonner
| Slot | Domaine | Clair | Sombre |
|---|---|---|---|
| 1 | INTELLIGENCE | `#2A78D6` | `#3987E5` |
| 2 | PHYSIQUE | `#EB6834` | `#D95926` |
| 3 | VITESSE | `#1BAF7A` | `#199E70` |
| 4 | ÉDUCATION | `#EDA100` | `#C98500` |
| 5 | MENTAL | `#E87BA4` | `#D55181` |
| 6 | SOCIAL | `#008300` | `#008300` |
| 7 | TECHNIQUE | `#7C3AED` | `#9A7CF0` |
| 8 | TACTIQUE | `#E34948` | `#E66767` |

L'ordre est une mesure de sécurité visuelle (séparation daltonisme), pas une
décoration. Toute modification impose de relancer le validateur de palette.
VITESSE, ÉDUCATION et MENTAL passent sous 3:1 en mode clair → **libellé visible
ou vue tableau obligatoire** partout où ils apparaissent.

## Échelle 1→5 (une seule teinte, violet)
clair : `#B9A7F7` `#9A7CF0` `#7C3AED` `#6425C7` `#4A1D96`
sombre : `#5D35A6` `#7A4CDB` `#9668F8` `#B69FFC` `#D4CAFE`
Toujours afficher chiffre + libellé, jamais la pastille seule.

## États (jamais réutilisés comme couleur de domaine)
good `#0CA30C` · warning `#FAB219` · serious `#EC835A` · critical `#D03B3B`
Toujours accompagnés d'une icône et d'un mot.

## Typographie
Titres **Outfit**, texte **Inter**, chiffres en `tabular-nums`.
Jamais sous 14 px sur mobile. Mode Terrain : 20 px minimum.

## Graphiques — non négociables
Un seul axe Y (jamais de double échelle) · la couleur suit l'entité, jamais son
rang · légende dès 2 séries · vue tableau toujours disponible · lignes 2 px,
points ≥ 8 px · pas de chiffre sur chaque point · le texte porte des jetons de
texte, jamais la couleur de la série.

## Mode Terrain — règles spéciales
Boutons ≥ 56 px · texte ≥ 20 px · chrono 64 px · contraste AAA (7:1) ·
1 information par écran · écran maintenu allumé · aucune saisie clavier ·
réseau supposé absent.

## Accessibilité
Contraste ≥ 4,5:1 (7:1 en Mode Terrain) · zone tactile ≥ 44 px (56 en terrain) ·
navigation clavier web complète · `prefers-reduced-motion` respecté ·
**jamais d'information portée par la couleur seule**.

## Ton (français)
Tutoiement joueur, vouvoiement parent et coach. On parle de progression, jamais
de niveau atteint. On ne compare jamais deux joueurs dans un texte affiché.
