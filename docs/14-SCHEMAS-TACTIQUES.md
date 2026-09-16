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

### L'éditeur (Phase 5.7, ~10 jours) 🔴

**Version 1 volontairement limitée** — c'est la décision qui évite de perdre
trois semaines :

```
✅ Dans la v1                      ⏳ Reporté en V2
   Poser des éléments                 Annuler/refaire illimité
   Déplacer (glisser-déposer)         Travail à plusieurs
   Tracer une flèche                  Courbes de Bézier
   Dessiner une zone                  Bibliothèque de modèles
   Jusqu'à 5 images-clés              Enregistrement vidéo
   Aperçu de l'animation              Import depuis d'autres outils
   Dupliquer un schéma                Symétrie automatique
```

**Garde-fou de calendrier :** si l'éditeur dépasse **12 jours**, on l'arrête,
on livre le lecteur seul, et on saisit les schémas en JSON pour le MVP.
Le produit reste utilisable. Le calendrier, lui, ne se rattrape pas.

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
