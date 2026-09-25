/**
 * La géométrie du terrain, et le passage du doigt aux coordonnées du schéma.
 *
 * Pourquoi ici, et non dans le composant qui dessine : l'éditeur et le
 * lecteur doivent projeter le repère 0-100 EXACTEMENT de la même façon. Si le
 * lecteur dessinait un joueur à un endroit et que l'éditeur le déplaçait
 * d'après un autre calcul, les deux ne se recroiseraient jamais — et le coach
 * verrait son joueur sauter d'un centimètre au moment de le lâcher.
 *
 * Ce fichier n'importe ni React, ni le DOM : il prend des nombres et rend des
 * nombres. C'est ce qui permet de le VÉRIFIER, alors qu'un calcul de
 * coordonnées enfoui dans un gestionnaire d'événement ne se teste qu'à la
 * main, sur un téléphone, en regardant si ça a l'air juste.
 */
import type { DiagramCanvas, DiagramElement, DiagramField, Point } from './schema';
import { BALL_RADIUS, GOAL_WIDTHS, PLAYER_RADIUS } from './visual';

/** Marge du dessin, en unités de terrain : un joueur au bord n'est pas coupé. */
export const FIELD_PADDING = 2;

export interface FieldGeometry {
  /** Hauteur du repère vertical. 100 pour un carré, moins pour un terrain large. */
  height: number;
  /** Facteur appliqué à `y` pour garder les proportions réelles. */
  scaleY: number;
  /** L'attribut `viewBox` du SVG, calculé une seule fois pour tout le monde. */
  viewBox: string;
}

/**
 * Le repère d'un terrain donné.
 *
 * Le fichier parle en pourcentages sur les deux axes ; le terrain, lui, a de
 * vraies proportions. Un carré de 12 × 12 m doit rester carré, un demi-terrain
 * de 45 × 40 rester plus long que large, et les joueurs rester ronds dans les
 * deux cas — d'où un facteur sur `y` seul.
 *
 * Les bornes 30 et 160 évitent les deux extrêmes inutilisables : un couloir
 * si plat qu'on n'y distingue plus deux joueurs, et un terrain si haut qu'il
 * ne tient plus dans un écran de téléphone.
 */
export function fieldGeometry(field: Pick<DiagramField, 'lengthM' | 'widthM'>): FieldGeometry {
  const ratio = field.lengthM > 0 ? (field.widthM / field.lengthM) * 100 : 100;
  const height = Math.max(30, Math.min(160, ratio));
  return {
    height,
    scaleY: height / 100,
    viewBox: `${-FIELD_PADDING} ${-FIELD_PADDING} ${100 + FIELD_PADDING * 2} ${
      height + FIELD_PADDING * 2
    }`,
  };
}

/** Une coordonnée du fichier (0-100) vers le repère du dessin. */
export function toViewPoint(point: Point, geometry: FieldGeometry): Point {
  return { x: point.x, y: point.y * geometry.scaleY };
}

/** L'inverse : du repère du dessin vers le fichier. */
export function fromViewPoint(point: Point, geometry: FieldGeometry): Point {
  return { x: point.x, y: geometry.scaleY === 0 ? 0 : point.y / geometry.scaleY };
}

/** Ramène une coordonnée dans le terrain. Un doigt qui glisse dehors ne crée pas un schéma invalide. */
export function clampCoordinate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  // Deux décimales : au-delà, on alourdit le fichier sans que l'œil voie la
  // différence — 0,01 unité, c'est un cinquième de millimètre sur un téléphone.
  return Math.round(value * 100) / 100;
}

export function clampPoint(point: Point): Point {
  return { x: clampCoordinate(point.x), y: clampCoordinate(point.y) };
}

export interface ElementRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Où le doigt a touché, en coordonnées du fichier.
 *
 * Le SVG est servi avec un `viewBox` décalé de la marge et une largeur fluide.
 * Trois erreurs classiques sont donc réunies ici une fois pour toutes : oublier
 * la marge, oublier le facteur vertical, et ne pas borner le résultat.
 */
export function pointerToDiagram(client: Point, rect: ElementRect, geometry: FieldGeometry): Point {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  const boxWidth = 100 + FIELD_PADDING * 2;
  const boxHeight = geometry.height + FIELD_PADDING * 2;
  const viewX = ((client.x - rect.left) / rect.width) * boxWidth - FIELD_PADDING;
  const viewY = ((client.y - rect.top) / rect.height) * boxHeight - FIELD_PADDING;
  return clampPoint(fromViewPoint({ x: viewX, y: viewY }, geometry));
}

/** Rayon de saisie d'un élément, dans le repère du dessin. */
function grabRadius(element: DiagramElement): number {
  switch (element.kind) {
    case 'PLAYER':
    case 'GK':
      return PLAYER_RADIUS + 1;
    case 'BALL':
      return BALL_RADIUS + 2.2;
    case 'CONE':
      return 3;
    case 'GOAL':
      return GOAL_WIDTHS[element.size] / 2;
    case 'TEXT':
      return 4;
    default:
      return 0;
  }
}

/** Distance d'un point à un segment, dans le repère du dessin. */
function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const ratio = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared),
  );
  return Math.hypot(point.x - (a.x + dx * ratio), point.y - (a.y + dy * ratio));
}

function insideZone(
  zone: Extract<DiagramElement, { kind: 'ZONE' }>,
  view: Point,
  geometry: FieldGeometry,
): boolean {
  const y = zone.y * geometry.scaleY;
  const h = zone.h * geometry.scaleY;
  if (zone.shape === 'CIRCLE') {
    const rx = zone.w / 2;
    const ry = h / 2;
    if (rx <= 0 || ry <= 0) return false;
    const nx = (view.x - (zone.x + rx)) / rx;
    const ny = (view.y - (y + ry)) / ry;
    return nx * nx + ny * ny <= 1;
  }
  return view.x >= zone.x && view.x <= zone.x + zone.w && view.y >= y && view.y <= y + h;
}

/**
 * Quel élément le doigt a-t-il attrapé ?
 *
 * On cherche dans l'ordre INVERSE du dessin : figures d'abord, puis flèches,
 * puis zones. Sinon une grande zone posée par-dessus tout le terrain
 * intercepterait chaque geste, et les joueurs deviendraient insaisissables
 * alors qu'ils sont visibles au premier plan. Ce que l'on voit devant est ce
 * que l'on attrape.
 *
 * `positions` vient de `positionsAt()` : sur une image-clé, un joueur s'attrape
 * là où il est à cet instant, pas là où le schéma l'a posé au départ.
 */
export function hitTest(
  diagram: DiagramCanvas,
  positions: ReadonlyMap<string, Point>,
  at: Point,
  geometry: FieldGeometry,
): string | null {
  const view = toViewPoint(at, geometry);

  const figures = diagram.elements.filter((e) => e.kind !== 'ZONE' && e.kind !== 'ARROW');
  let best: { id: string; distance: number } | null = null;
  for (const element of figures) {
    if (!('x' in element)) continue;
    const moved = positions.get(element.id);
    const centre = toViewPoint(moved ?? { x: element.x, y: element.y }, geometry);
    const distance = Math.hypot(view.x - centre.x, view.y - centre.y);
    const radius = grabRadius(element);
    if (distance <= radius && (best === null || distance < best.distance)) {
      best = { id: element.id, distance };
    }
  }
  if (best) return best.id;

  for (const element of diagram.elements) {
    if (element.kind !== 'ARROW') continue;
    for (let i = 1; i < element.points.length; i += 1) {
      const a = toViewPoint(element.points[i - 1]!, geometry);
      const b = toViewPoint(element.points[i]!, geometry);
      if (distanceToSegment(view, a, b) <= 2) return element.id;
    }
  }

  // Les zones en dernier, et la plus PETITE d'abord : une zone posée dans une
  // autre doit rester atteignable.
  const zones = diagram.elements
    .filter((e): e is Extract<DiagramElement, { kind: 'ZONE' }> => e.kind === 'ZONE')
    .sort((a, b) => a.w * a.h - b.w * b.h);
  for (const zone of zones) {
    if (insideZone(zone, view, geometry)) return zone.id;
  }
  return null;
}
