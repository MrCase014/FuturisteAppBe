# 14 — SCHÉMAS TACTIQUES 2D ANIMÉS

> **Objectif mesurable : le coach comprend l'exercice en moins de 10 secondes,
> sans lire une ligne de texte.**
>
> C'est la fonctionnalité la plus difficile du MVP (complexité **XL**) et celle
> qui différencie le plus FUTURISTE d'un simple classeur d'exercices.

---

## 1. Le principe

Un schéma n'est **pas une image**. C'est un **fichier de données** (JSON) que
l'application dessine. Conséquences directes :

| Conséquence | Bénéfice |
|---|---|
| Poids : **~20 Ko** au lieu de 2 Mo | Fonctionne hors ligne, se charge instantanément |
| Modifiable | On corrige une position sans refaire l'image |
| Animable | Les déplacements se jouent, ils ne se devinent pas |
| Adaptable | Le même schéma s'affiche à 8 ou à 20 joueurs |
| Un seul format | Web et mobile lisent exactement le même fichier |
| Traduisible | Les étiquettes suivent la langue de l'utilisateur |

---

## 2. Le format (contrat figé dès aujourd'hui)

```ts
// packages/diagrams/src/schema.ts

export type DiagramCanvas = {
  version: 1;
  field: {
    kind: 'FULL' | 'HALF' | 'THIRD' | 'CUSTOM';
    lengthM: number;          // dimensions réelles, en mètres
    widthM: number;
    orientation: 'HORIZONTAL' | 'VERTICAL';
  };
  elements: DiagramElement[];
  keyframes: Keyframe[];      // [] = schéma fixe, non animé
  legend?: { label: string; color: string }[];
};

export type DiagramElement =
  | { id: string; kind: 'PLAYER';    team: 'A'|'B'|'JOKER'|'NEUTRE';
      number?: number; label?: string; x: number; y: number; hasBall?: boolean }
  | { id: string; kind: 'GK';        team: 'A'|'B'; x: number; y: number }
  | { id: string; kind: 'BALL';      x: number; y: number }
  | { id: string; kind: 'CONE';      color?: string; x: number; y: number }
  | { id: string; kind: 'GOAL';      size: 'MINI'|'SMALL'|'FULL';
      rotation: number; x: number; y: number }
  | { id: string; kind: 'ZONE';      shape: 'RECT'|'CIRCLE';
      purpose: 'OCCUPER'|'PROTEGER'|'INTERDITE'|'CIBLE'|'NEUTRE';
      x: number; y: number; w: number; h: number; label?: string }
  | { id: string; kind: 'ARROW';     motion: 'COURSE'|'PASSE'|'CONDUITE'|'TIR'|'PRESSING';
      points: {x:number;y:number}[]; label?: string }
  | { id: string; kind: 'TEXT';      text: string; x: number; y: number };

export type Keyframe = {
  t: number;                            // 0 → 1
  phase?: 'POSSESSION'|'PERTE'|'RECUPERATION'|'TRANSITION';
  caption?: string;                     // "Perte de balle → réaction immédiate"
  positions: Record<string, { x: number; y: number }>;
};
```

**Coordonnées :** `x` et `y` vont de **0 à 100** (pourcentage du terrain),
jamais en pixels. Le schéma s'affiche donc identiquement sur un téléphone de
5 pouces et sur un écran de 27 pouces.

---

## 3. Le langage visuel

| Élément | Représentation |
|---|---|
| Joueur équipe A | Cercle plein **violet** `#7C3AED`, numéro en blanc |
| Joueur équipe B | Cercle plein **rouge** `#E34948`, numéro en blanc |
| **Joker** | Cercle **jaune** `#EDA100`, contour noir (joue avec celui qui a le ballon) |
| Joueur neutre | Cercle **gris** |
| Gardien | Cercle avec anneau épais |
| Ballon | Disque blanc, contour noir |
| Cône | Petit triangle orange |
| But | Rectangle ouvert, 3 tailles |
| **Zone à OCCUPER** | Remplissage **bleu clair** hachuré, bord pointillé |
| **Zone à PROTÉGER** | Remplissage **rouge** transparent, bord plein |
| Zone interdite | Hachures grises |
| Zone cible | Contour **vert** |
| Course sans ballon | Flèche **pleine** |
| Passe | Flèche **pointillée** |
| Conduite de balle | Flèche **ondulée** |
| Tir | Flèche pleine **épaisse** |
| Pressing | Flèche **double** |

> **Ce vocabulaire est universel chez les éducateurs.** On ne l'invente pas :
> un coach doit reconnaître le langage dès le premier schéma, sans apprentissage.

---

## 4. Les phases de jeu — le point demandé explicitement

Chaque image-clé porte une `phase`. C'est ce qui permet de montrer
**ce qu'on fait quand on perd le ballon et quand on le récupère** — la demande
la plus précise du cahier des charges.

| Phase | Couleur d'ambiance | Bandeau affiché |
|---|---|---|
| `POSSESSION` | violet léger | « Nous avons le ballon » |
| `PERTE` | rouge léger | « Ballon perdu → réaction » |
| `RECUPERATION` | vert léger | « Ballon récupéré → sortir vite » |
| `TRANSITION` | orange léger | « Bascule » |

Exemple d'un exercice à 4 images-clés :

```
 t=0.00  POSSESSION      Équipe A fait circuler, zone à occuper en bleu
 t=0.33  PERTE           ⚠️ le fond vire au rouge, les 3 joueurs A les plus
                         proches convergent (flèches doubles = pressing)
 t=0.66  RECUPERATION    ✅ fond vert, ouverture immédiate en largeur
 t=1.00  POSSESSION      retour à la circulation, mais dans l'autre sens
```

Le coach appuie sur ▶️ et **voit** le principe. Il n'a rien à lire.

---

## 5. Lecteur et éditeur — deux chantiers séparés

> **Ordre de développement impératif : le LECTEUR d'abord, l'ÉDITEUR ensuite.**
> Le lecteur est de complexité **M**. L'éditeur est **XL**. Faire le lecteur
> en premier permet de saisir les 20 exercices du MVP (JSON écrit à la main ou
> généré) sans attendre l'éditeur.

### Le lecteur (Phase 5.6, ~4 jours)

```
┌─────────────────────────────────────────┐
│  ⚡ Rondo 4v4+3 · Occupation des espaces │
│                                         │
│   ┌───────────────────────────────┐     │
│   │  ▓▓▓▓ zone à occuper ▓▓▓▓     │     │
│   │   ⑦ ──▷ ⑨      ●              │     │
│   │       ╲                       │     │
│   │   ③    ▽    ⑤     ⑪           │     │
│   └───────────────────────────────┘     │
│                                         │
│  ▶️ ──────●──────────  0:03 / 0:08      │
│  🟣 Possession                          │
│  [Vitesse ×0,5  ×1  ×2]   [⛶ Plein écran]│
└─────────────────────────────────────────┘
```

- SVG sur le web (`framer-motion`), `react-native-svg` + `Reanimated` sur mobile
- Interpolation linéaire entre les images-clés
- Lecture, pause, vitesse, boucle, plein écran
- **Fonctionne hors ligne** (le JSON est en cache)
- Génère un PNG d'aperçu pour les listes

### L'éditeur (Phase 5.7) ✅ livré

**Version 1 volontairement limitée** — c'est la décision qui a évité de perdre
trois semaines :

```
✅ Dans la v1                      ⏳ Reporté en V2
   Poser des éléments                 Annuler/refaire illimité (20 pas livrés)
   Déplacer (glisser-déposer)         Travail à plusieurs
   Tracer une flèche                  Courbes de Bézier
   Dessiner une zone                  Bibliothèque de modèles
   Jusqu'à 5 images-clés              Enregistrement vidéo
   Aperçu de l'animation              Import depuis d'autres outils
   Dupliquer un schéma                Symétrie automatique
```

Le garde-fou de calendrier (12 jours, ADR-14) n'a pas eu à jouer.

#### Où vit quoi

| Morceau | Fichier | Pourquoi là |
|---|---|---|
| Le moteur | `packages/diagrams/src/editor.ts` | Pur, sans React : c'est ce qui le rend vérifiable |
| La géométrie | `packages/diagrams/src/geometry.ts` | Le lecteur et l'éditeur projettent le terrain avec les **mêmes** nombres |
| L'écran | `apps/web/components/diagrams/diagram-editor.tsx` | Ne décide de rien : traduit un doigt en action |
| Le dessin | `apps/web/components/diagrams/field.tsx` | **Le même composant que le lecteur** — ce qu'on déplace est ce qu'on verra |

#### L'invariant, et pourquoi il vaut plus que les exemples

> Quelle que soit la suite de gestes reçue, le schéma produit reste un fichier
> que `parseDiagram()` accepte.

Un éditeur qui produit un fichier que le lecteur refuse fait perdre au coach le
travail qu'il vient de faire — et il ne s'en aperçoit qu'à la relecture, au
bord du terrain. Aucun test d'exemple ne couvre l'espace des gestes possibles :
on en joue donc **12 000 tirés au sort**, avec un générateur reproductible pour
qu'un échec se rejoue à l'identique. Quatre sabotages ont confirmé que ces
tests tombent bien quand on retire une protection.

Conséquence sur la conception : le moteur **borne et refuse**, il ne « corrige
jamais plus tard ». Et un refus n'est pas silencieux — il remplit un message
que l'écran affiche. Un éditeur qui ignore un geste sans rien dire passe pour
cassé.

#### Trois choix dictés par le pouce, pas par l'écran

1. **Une flèche se trace en TOUCHANT ses points**, pas en glissant. Un
   glissement de trois segments se rate une fois sur deux sur un écran
   tactile ; une suite de touchers, jamais.
2. **`touch-action: none` sur le terrain.** Sans cela, traîner un joueur fait
   défiler la page, et l'éditeur est inutilisable sur téléphone.
3. **Capture du pointeur.** Un doigt qui sort du cadre continue de déplacer son
   joueur, au lieu de le lâcher à mi-chemin.

#### Deux règles que le format impose, et que l'écran explique

- **Sur une image-clé, on ne pose ni ne supprime rien** : on déplace ce qui
  existe. Un élément ajouté à l'image 2 n'existerait pas à l'image 1, et le
  format ne sait pas faire apparaître quelqu'un en cours d'animation.
- **Une flèche, une zone, un but et un texte ne se déplacent pas d'une image à
  l'autre** : ils sont dessinés une fois pour tout le schéma. Une position
  écrite pour eux serait refusée à la relecture.

Dans les deux cas l'éditeur le DIT, plutôt que d'ignorer le geste.

#### Qui peut modifier quoi

RLS n'autorise la modification qu'à **l'auteur du schéma ou à la direction**.
L'écran le dit **avant** le premier trait : ouvrir le schéma d'un collègue
affiche « Partir de ce schéma », et l'enregistrement crée *votre version* sans
toucher à l'originale. Rien n'est plus décourageant que de dessiner dix minutes
avant d'apprendre qu'on n'avait pas le droit.

#### Ce qui part en base

Le canevas est **relu par `parseDiagram()` côté serveur**, puis **recopié champ
par champ** (`canonicalDiagram`). RLS filtre des lignes, il ne regarde pas ce
qu'il y a dans une colonne `jsonb` : sans cette recopie, n'importe quelle
donnée envoyée par un navigateur entrerait en base à côté des joueurs, et y
resterait.

---

## 6. Exemple complet

```json
{
  "version": 1,
  "field": { "kind": "CUSTOM", "lengthM": 25, "widthM": 20,
             "orientation": "HORIZONTAL" },
  "elements": [
    { "id": "z1", "kind": "ZONE", "shape": "RECT", "purpose": "OCCUPER",
      "x": 35, "y": 20, "w": 30, "h": 60, "label": "Zone centrale" },
    { "id": "a1", "kind": "PLAYER", "team": "A", "number": 1,
      "x": 15, "y": 50, "hasBall": true },
    { "id": "a2", "kind": "PLAYER", "team": "A", "number": 2, "x": 50, "y": 20 },
    { "id": "a3", "kind": "PLAYER", "team": "A", "number": 3, "x": 50, "y": 80 },
    { "id": "j1", "kind": "PLAYER", "team": "JOKER", "number": 9,
      "x": 50, "y": 50, "label": "J" },
    { "id": "b1", "kind": "PLAYER", "team": "B", "number": 5, "x": 35, "y": 50 },
    { "id": "ar1", "kind": "ARROW", "motion": "PASSE",
      "points": [{"x":15,"y":50},{"x":50,"y":20}], "label": "1re passe" }
  ],
  "keyframes": [
    { "t": 0,    "phase": "POSSESSION",
      "caption": "Occuper la largeur avant de passer",
      "positions": { "a1": {"x":15,"y":50}, "a2": {"x":50,"y":20} } },
    { "t": 0.5,  "phase": "PERTE",
      "caption": "Ballon perdu : les 2 plus proches pressent",
      "positions": { "a1": {"x":30,"y":45}, "a2": {"x":40,"y":30} } },
    { "t": 1,    "phase": "RECUPERATION",
      "caption": "Récupéré : on ressort par le joker",
      "positions": { "a1": {"x":25,"y":50}, "a2": {"x":55,"y":15} } }
  ],
  "legend": [
    { "label": "Zone à occuper", "color": "#38BDF8" },
    { "label": "Joker",          "color": "#EDA100" }
  ]
}
```

**Poids réel : environ 1,4 Ko.** Une image équivalente ferait 800 Ko.
C'est exactement ce qui rend le mode hors ligne possible sur le terrain.

---

## 7. Accessibilité

- Chaque schéma porte un **texte alternatif** décrivant l'exercice en une phrase
- La vue **« étapes »** liste les images-clés en texte, pour qui ne peut pas voir l'animation
- `prefers-reduced-motion` → l'animation ne démarre pas automatiquement
- Les équipes ne sont **jamais** distinguées par la seule couleur :
  l'équipe A porte des cercles pleins, l'équipe B des cercles à contour épais
