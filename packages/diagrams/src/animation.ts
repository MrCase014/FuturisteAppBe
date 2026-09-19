/**
 * Interpolation entre les images-clés.
 *
 * Écrite ici, hors de tout composant : le web dessine du SVG, le mobile du
 * `react-native-svg`, mais tous deux demandent la même chose — « où est
 * chaque élément à l'instant t ? ». Si ce calcul vivait dans le composant
 * web, le mobile en referait une version, et les deux finiraient par ne plus
 * montrer le même exercice.
 *
 * Chaque élément a sa PROPRE piste, construite avec les seules images-clés
 * qui le citent. C'est la conséquence directe du format : `positions` ne
 * nomme que ce qui bouge. Un joueur cité en t=0 et t=1, mais pas en t=0,5,
 * se déplace donc en ligne droite sur toute la durée — et non par à-coups,
 * comme le ferait une interpolation qui prendrait les images-clés en bloc.
 */
import type { DiagramCanvas, GamePhase, Keyframe, Point } from './schema';
import { isMovable } from './schema';

/** Les libellés de phase, pour le bandeau du lecteur (docs/14 §4). */
export const PHASE_LABELS: Record<GamePhase, string> = {
  POSSESSION: 'Nous avons le ballon',
  PERTE: 'Ballon perdu → réaction',
  RECUPERATION: 'Ballon récupéré → sortir vite',
  TRANSITION: 'Bascule',
};

/** Le nom court, pour une pastille ou une liste d'étapes. */
export const PHASE_SHORT: Record<GamePhase, string> = {
  POSSESSION: 'Possession',
  PERTE: 'Perte',
  RECUPERATION: 'Récupération',
  TRANSITION: 'Transition',
};

const lerp = (a: number, b: number, ratio: number): number => a + (b - a) * ratio;

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Les positions d'un élément au fil du temps, dans l'ordre. */
function trackFor(id: string, base: Point, keyframes: readonly Keyframe[]): [number, Point][] {
  const track: [number, Point][] = [];
  for (const frame of keyframes) {
    const point = frame.positions[id];
    if (point) track.push([frame.t, point]);
  }
  // Avant sa première image-clé, l'élément est là où le schéma l'a posé.
  if (track.length > 0 && track[0]![0] > 0) track.unshift([0, base]);
  return track;
}

function pointAt(track: readonly [number, Point][], t: number): Point | null {
  if (track.length === 0) return null;
  if (t <= track[0]![0]) return track[0]![1];
  const last = track[track.length - 1]!;
  if (t >= last[0]) return last[1];

  for (let i = 1; i < track.length; i += 1) {
    const [tPrev, pPrev] = track[i - 1]!;
    const [tNext, pNext] = track[i]!;
    if (t <= tNext) {
      const span = tNext - tPrev;
      const ratio = span === 0 ? 0 : (t - tPrev) / span;
      return { x: lerp(pPrev.x, pNext.x, ratio), y: lerp(pPrev.y, pNext.y, ratio) };
    }
  }
  return last[1];
}

/**
 * Où se trouve chaque élément déplaçable à l'instant t (0 → 1).
 *
 * Un schéma sans image-clé rend simplement les positions d'origine : c'est
 * un schéma fixe, pas une animation vide.
 */
export function positionsAt(diagram: DiagramCanvas, t: number): Map<string, Point> {
  const clamped = clamp01(t);
  const result = new Map<string, Point>();

  for (const element of diagram.elements) {
    if (!isMovable(element) || !('x' in element)) continue;
    const base: Point = { x: element.x, y: element.y };
    const track = trackFor(element.id, base, diagram.keyframes);
    result.set(element.id, pointAt(track, clamped) ?? base);
  }
  return result;
}

/** L'image-clé en cours à l'instant t : celle dont on joue les conséquences. */
export function keyframeAt(diagram: DiagramCanvas, t: number): Keyframe | null {
  const clamped = clamp01(t);
  let current: Keyframe | null = null;
  for (const frame of diagram.keyframes) {
    if (frame.t <= clamped) current = frame;
    else break;
  }
  return current ?? diagram.keyframes[0] ?? null;
}

/** La phase de jeu à l'instant t — ce qui donne sa couleur d'ambiance au lecteur. */
export function phaseAt(diagram: DiagramCanvas, t: number): GamePhase | null {
  return keyframeAt(diagram, t)?.phase ?? null;
}

/** Le commentaire affiché à l'instant t. */
export function captionAt(diagram: DiagramCanvas, t: number): string | null {
  return keyframeAt(diagram, t)?.caption ?? null;
}

/** Un schéma anime-t-il quelque chose, ou est-il fixe ? */
export function isAnimated(diagram: DiagramCanvas): boolean {
  return diagram.keyframes.length >= 2;
}

/**
 * Durée d'une lecture, en secondes.
 *
 * Le format porte des instants relatifs (0 → 1) et non des secondes : un
 * schéma reste lisible quelle que soit la vitesse choisie par le coach. On
 * compte 3 secondes par image-clé — assez pour suivre un déplacement, assez
 * court pour tenir la promesse des 10 secondes de compréhension (docs/14).
 */
export const SECONDS_PER_KEYFRAME = 3;

export function durationSeconds(diagram: DiagramCanvas): number {
  if (!isAnimated(diagram)) return 0;
  return (diagram.keyframes.length - 1) * SECONDS_PER_KEYFRAME;
}

/** Les vitesses proposées au coach. */
export const PLAYBACK_SPEEDS = [0.5, 1, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
