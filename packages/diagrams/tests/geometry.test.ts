import { describe, expect, it } from 'vitest';
import {
  FIELD_PADDING,
  clampCoordinate,
  clampPoint,
  fieldGeometry,
  fromViewPoint,
  hitTest,
  pointerToDiagram,
  toViewPoint,
} from '../src/geometry';
import { parseDiagram } from '../src/parse';
import type { DiagramCanvas } from '../src/schema';

const build = (raw: unknown): DiagramCanvas => {
  const result = parseDiagram(raw);
  if (!result.ok) throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join(' | '));
  return result.diagram;
};

describe('fieldGeometry', () => {
  it('garde un terrain carré carré', () => {
    expect(fieldGeometry({ lengthM: 20, widthM: 20 }).height).toBe(100);
  });

  it('aplatit un terrain plus long que large', () => {
    // 100 × 64 : la hauteur du repère vaut 64 % de sa largeur.
    expect(fieldGeometry({ lengthM: 100, widthM: 64 }).height).toBe(64);
  });

  it('borne les proportions extrêmes, illisibles sur un téléphone', () => {
    expect(fieldGeometry({ lengthM: 100, widthM: 2 }).height).toBe(30);
    expect(fieldGeometry({ lengthM: 10, widthM: 90 }).height).toBe(160);
  });

  it('survit à une longueur nulle sans produire NaN', () => {
    expect(Number.isFinite(fieldGeometry({ lengthM: 0, widthM: 20 }).height)).toBe(true);
  });
});

describe('pointerToDiagram', () => {
  const geometry = fieldGeometry({ lengthM: 100, widthM: 64 });
  // Un SVG de 520 px de large : la hauteur suit le viewBox, marges comprises.
  const rect = {
    left: 10,
    top: 20,
    width: 520,
    height: (520 * (geometry.height + FIELD_PADDING * 2)) / (100 + FIELD_PADDING * 2),
  };

  it('rend le centre du terrain pour le centre du dessin', () => {
    const at = pointerToDiagram(
      { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      rect,
      geometry,
    );
    expect(at.x).toBeCloseTo(50, 1);
    expect(at.y).toBeCloseTo(50, 1);
  });

  it('tient compte de la marge du viewBox, et non du seul bord du dessin', () => {
    // Sans la marge, le coin haut-gauche du dessin donnerait (0, 0) ; il est en
    // réalité à -2 unités, et la valeur est ramenée dans le terrain.
    const at = pointerToDiagram({ x: rect.left, y: rect.top }, rect, geometry);
    expect(at).toEqual({ x: 0, y: 0 });
  });

  it('ramène dans le terrain un doigt qui sort du cadre', () => {
    const at = pointerToDiagram(
      { x: rect.left + rect.width * 2, y: rect.top - 500 },
      rect,
      geometry,
    );
    expect(at.x).toBe(100);
    expect(at.y).toBe(0);
  });

  it('ne divise pas par zéro sur un élément pas encore mesuré', () => {
    expect(
      pointerToDiagram({ x: 5, y: 5 }, { left: 0, top: 0, width: 0, height: 0 }, geometry),
    ).toEqual({ x: 0, y: 0 });
  });

  it('fait l’aller-retour : un point du fichier retrouvé au pixel près', () => {
    const point = { x: 37.5, y: 62.5 };
    const view = toViewPoint(point, geometry);
    const client = {
      x: rect.left + ((view.x + FIELD_PADDING) / (100 + FIELD_PADDING * 2)) * rect.width,
      y:
        rect.top + ((view.y + FIELD_PADDING) / (geometry.height + FIELD_PADDING * 2)) * rect.height,
    };
    const back = pointerToDiagram(client, rect, geometry);
    expect(back.x).toBeCloseTo(point.x, 1);
    expect(back.y).toBeCloseTo(point.y, 1);
  });
});

describe('clampCoordinate', () => {
  it('arrondit à deux décimales : au-delà, on alourdit le fichier pour rien', () => {
    expect(clampCoordinate(33.333333)).toBe(33.33);
  });

  it('refuse NaN plutôt que de l’écrire dans le schéma', () => {
    expect(clampCoordinate(Number.NaN)).toBe(0);
    expect(clampPoint({ x: Number.POSITIVE_INFINITY, y: -5 })).toEqual({ x: 0, y: 0 });
  });
});

describe('toViewPoint / fromViewPoint', () => {
  it('sont inverses l’un de l’autre', () => {
    const geometry = fieldGeometry({ lengthM: 100, widthM: 50 });
    const point = { x: 20, y: 80 };
    expect(fromViewPoint(toViewPoint(point, geometry), geometry).y).toBeCloseTo(80, 6);
  });
});

describe('hitTest', () => {
  const geometry = fieldGeometry({ lengthM: 20, widthM: 20 });
  const diagram = build({
    version: 1,
    field: { kind: 'CUSTOM', lengthM: 20, widthM: 20, orientation: 'HORIZONTAL' },
    elements: [
      { id: 'z1', kind: 'ZONE', shape: 'RECT', purpose: 'OCCUPER', x: 0, y: 0, w: 100, h: 100 },
      { id: 'z2', kind: 'ZONE', shape: 'RECT', purpose: 'CIBLE', x: 70, y: 70, w: 20, h: 20 },
      {
        id: 'ar1',
        kind: 'ARROW',
        motion: 'PASSE',
        points: [
          { x: 10, y: 90 },
          { x: 40, y: 90 },
        ],
      },
      { id: 'a1', kind: 'PLAYER', team: 'A', x: 50, y: 50 },
    ],
    keyframes: [],
  });
  const positions = new Map([['a1', { x: 50, y: 50 }]]);

  it('attrape le joueur posé par-dessus la grande zone', () => {
    // Sans priorité aux figures, la zone qui couvre tout le terrain
    // intercepterait chaque geste et les joueurs seraient insaisissables.
    expect(hitTest(diagram, positions, { x: 50, y: 50 }, geometry)).toBe('a1');
  });

  it('attrape une flèche sur son tracé', () => {
    expect(hitTest(diagram, positions, { x: 25, y: 90 }, geometry)).toBe('ar1');
  });

  it('attrape la plus petite zone quand deux se superposent', () => {
    expect(hitTest(diagram, positions, { x: 80, y: 80 }, geometry)).toBe('z2');
  });

  it('rend null sur une case vraiment vide', () => {
    const vide = build({
      version: 1,
      field: { kind: 'CUSTOM', lengthM: 20, widthM: 20, orientation: 'HORIZONTAL' },
      elements: [{ id: 'a1', kind: 'PLAYER', team: 'A', x: 10, y: 10 }],
      keyframes: [],
    });
    expect(hitTest(vide, new Map(), { x: 90, y: 90 }, geometry)).toBeNull();
  });

  it('suit l’élément là où l’image-clé l’a emmené, pas là où il a été posé', () => {
    // C'est la raison d'être du paramètre `positions` : sur l'image 2, le
    // joueur s'attrape à sa position du moment.
    expect(hitTest(diagram, new Map([['a1', { x: 10, y: 10 }]]), { x: 10, y: 10 }, geometry)).toBe(
      'a1',
    );
    expect(hitTest(diagram, new Map([['a1', { x: 10, y: 10 }]]), { x: 50, y: 50 }, geometry)).toBe(
      'z1',
    );
  });
});
