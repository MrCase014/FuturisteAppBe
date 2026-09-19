/**
 * Le format d'un schéma tactique — contrat figé (docs/14 §2).
 *
 * Un schéma n'est PAS une image : c'est un fichier de données que
 * l'application dessine. Une image de 800 Ko devient 1,4 Ko de JSON, se
 * corrige sans être refaite, s'anime, et se lit hors ligne au bord du terrain.
 *
 * Les coordonnées `x` et `y` vont de 0 à 100 — un pourcentage du terrain,
 * jamais des pixels. Le même fichier s'affiche donc à l'identique sur un
 * téléphone de 5 pouces et sur un écran de 27 pouces, sur le web comme sur
 * mobile, sans deuxième version.
 */

export type FieldKind = 'FULL' | 'HALF' | 'THIRD' | 'CUSTOM';
export type Orientation = 'HORIZONTAL' | 'VERTICAL';
export type Team = 'A' | 'B' | 'JOKER' | 'NEUTRE';
export type ZonePurpose = 'OCCUPER' | 'PROTEGER' | 'INTERDITE' | 'CIBLE' | 'NEUTRE';
export type Motion = 'COURSE' | 'PASSE' | 'CONDUITE' | 'TIR' | 'PRESSING';
export type GoalSize = 'MINI' | 'SMALL' | 'FULL';
export type GamePhase = 'POSSESSION' | 'PERTE' | 'RECUPERATION' | 'TRANSITION';

export interface Point {
  x: number;
  y: number;
}

export interface DiagramField {
  kind: FieldKind;
  /** Dimensions réelles, en mètres : elles servent à annoncer l'espace au coach. */
  lengthM: number;
  widthM: number;
  orientation: Orientation;
}

export type DiagramElement =
  | {
      id: string;
      kind: 'PLAYER';
      team: Team;
      number?: number;
      label?: string;
      x: number;
      y: number;
      hasBall?: boolean;
    }
  | { id: string; kind: 'GK'; team: 'A' | 'B'; x: number; y: number }
  | { id: string; kind: 'BALL'; x: number; y: number }
  | { id: string; kind: 'CONE'; color?: string; x: number; y: number }
  | { id: string; kind: 'GOAL'; size: GoalSize; rotation: number; x: number; y: number }
  | {
      id: string;
      kind: 'ZONE';
      shape: 'RECT' | 'CIRCLE';
      purpose: ZonePurpose;
      x: number;
      y: number;
      w: number;
      h: number;
      label?: string;
    }
  | { id: string; kind: 'ARROW'; motion: Motion; points: Point[]; label?: string }
  | { id: string; kind: 'TEXT'; text: string; x: number; y: number };

export type ElementKind = DiagramElement['kind'];

/**
 * Une image-clé. `positions` ne cite QUE les éléments qui bougent : ceux qui
 * restent en place n'ont rien à y faire, et les nommer quand même serait une
 * duplication qui finirait par se contredire.
 */
export interface Keyframe {
  /** Instant, de 0 à 1. */
  t: number;
  phase?: GamePhase;
  caption?: string;
  positions: Record<string, Point>;
}

export interface LegendEntry {
  label: string;
  color: string;
}

export interface DiagramCanvas {
  version: 1;
  field: DiagramField;
  elements: DiagramElement[];
  /** Vide = schéma fixe. C'est un cas normal, pas un schéma incomplet. */
  keyframes: Keyframe[];
  legend?: LegendEntry[];
  /**
   * Texte alternatif : l'exercice en une phrase, pour qui ne voit pas
   * l'animation (docs/14 §7). Facultatif dans le format, mais
   * `describeDiagram()` en fabrique toujours un à défaut.
   */
  alt?: string;
}

/** Les éléments qui peuvent être déplacés par une image-clé. */
export const MOVABLE_KINDS: readonly ElementKind[] = ['PLAYER', 'GK', 'BALL', 'CONE'];

/** Un élément est-il déplaçable par une image-clé ? */
export function isMovable(element: DiagramElement): boolean {
  return MOVABLE_KINDS.includes(element.kind);
}
