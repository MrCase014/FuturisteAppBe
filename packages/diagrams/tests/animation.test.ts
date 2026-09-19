import { describe, expect, it } from 'vitest';
import {
  captionAt,
  durationSeconds,
  isAnimated,
  keyframeAt,
  phaseAt,
  positionsAt,
} from '../src/animation';
import { parseDiagram } from '../src/parse';
import type { DiagramCanvas } from '../src/schema';

const build = (raw: unknown): DiagramCanvas => {
  const result = parseDiagram(raw);
  if (!result.ok) throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join(' | '));
  return result.diagram;
};

const diagram = build({
  version: 1,
  field: { kind: 'CUSTOM', lengthM: 20, widthM: 20, orientation: 'HORIZONTAL' },
  elements: [
    { id: 'a1', kind: 'PLAYER', team: 'A', x: 0, y: 0 },
    { id: 'a2', kind: 'PLAYER', team: 'A', x: 50, y: 50 },
    { id: 'fixe', kind: 'CONE', x: 90, y: 90 },
  ],
  keyframes: [
    { t: 0, phase: 'POSSESSION', caption: 'début', positions: { a1: { x: 0, y: 0 } } },
    { t: 0.5, phase: 'PERTE', caption: 'milieu', positions: { a1: { x: 50, y: 100 } } },
    { t: 1, phase: 'RECUPERATION', caption: 'fin', positions: { a1: { x: 100, y: 0 } } },
  ],
});

describe('positionsAt', () => {
  it('rend les positions d’origine à t = 0', () => {
    expect(positionsAt(diagram, 0).get('a1')).toEqual({ x: 0, y: 0 });
  });

  it('interpole linéairement entre deux images-clés', () => {
    expect(positionsAt(diagram, 0.25).get('a1')).toEqual({ x: 25, y: 50 });
    expect(positionsAt(diagram, 0.75).get('a1')).toEqual({ x: 75, y: 50 });
  });

  it('laisse en place ce qu’aucune image-clé ne cite', () => {
    for (const t of [0, 0.3, 1]) {
      expect(positionsAt(diagram, t).get('a2')).toEqual({ x: 50, y: 50 });
      expect(positionsAt(diagram, t).get('fixe')).toEqual({ x: 90, y: 90 });
    }
  });

  it('ne rend aucune position pour ce qui ne se déplace pas — zones, flèches, textes', () => {
    const avecZone = build({
      version: 1,
      field: { kind: 'CUSTOM', lengthM: 20, widthM: 20, orientation: 'HORIZONTAL' },
      elements: [
        { id: 'a1', kind: 'PLAYER', team: 'A', x: 10, y: 10 },
        { id: 'z1', kind: 'ZONE', shape: 'RECT', purpose: 'CIBLE', x: 0, y: 0, w: 10, h: 10 },
      ],
      keyframes: [],
    });
    const positions = positionsAt(avecZone, 0.5);
    expect(positions.has('a1')).toBe(true);
    expect(positions.has('z1')).toBe(false);
  });

  it('borne t hors de 0-1 au lieu d’extrapoler hors du terrain', () => {
    expect(positionsAt(diagram, -3).get('a1')).toEqual({ x: 0, y: 0 });
    expect(positionsAt(diagram, 7).get('a1')).toEqual({ x: 100, y: 0 });
  });

  /**
   * Chaque élément a sa propre piste. Un joueur cité en t=0 et t=1 mais pas
   * en t=0,5 doit glisser d'un bout à l'autre, et non attendre puis sauter.
   */
  it('donne à chaque élément sa propre piste, indépendante des autres', () => {
    const decale = build({
      version: 1,
      field: { kind: 'CUSTOM', lengthM: 20, widthM: 20, orientation: 'HORIZONTAL' },
      elements: [
        { id: 'lent', kind: 'PLAYER', team: 'A', x: 0, y: 0 },
        { id: 'vif', kind: 'PLAYER', team: 'B', x: 0, y: 0 },
      ],
      keyframes: [
        { t: 0, positions: { lent: { x: 0, y: 0 }, vif: { x: 0, y: 0 } } },
        { t: 0.5, positions: { vif: { x: 100, y: 0 } } },
        { t: 1, positions: { lent: { x: 100, y: 0 }, vif: { x: 100, y: 100 } } },
      ],
    });
    expect(positionsAt(decale, 0.5).get('lent')).toEqual({ x: 50, y: 0 });
    expect(positionsAt(decale, 0.5).get('vif')).toEqual({ x: 100, y: 0 });
  });
});

describe('phases et commentaires', () => {
  it('garde la phase de la dernière image-clé franchie', () => {
    expect(phaseAt(diagram, 0)).toBe('POSSESSION');
    expect(phaseAt(diagram, 0.49)).toBe('POSSESSION');
    expect(phaseAt(diagram, 0.5)).toBe('PERTE');
    expect(phaseAt(diagram, 0.99)).toBe('PERTE');
    expect(phaseAt(diagram, 1)).toBe('RECUPERATION');
  });

  it('rend le commentaire de l’étape en cours', () => {
    expect(captionAt(diagram, 0.2)).toBe('début');
    expect(captionAt(diagram, 0.6)).toBe('milieu');
  });

  it('ne rend aucune image-clé pour un schéma fixe', () => {
    const fixe = build({
      version: 1,
      field: { kind: 'CUSTOM', lengthM: 10, widthM: 10, orientation: 'HORIZONTAL' },
      elements: [{ id: 'a1', kind: 'PLAYER', team: 'A', x: 1, y: 1 }],
      keyframes: [],
    });
    expect(keyframeAt(fixe, 0.5)).toBeNull();
    expect(isAnimated(fixe)).toBe(false);
    expect(durationSeconds(fixe)).toBe(0);
  });

  it('compte 3 secondes par image-clé', () => {
    expect(durationSeconds(diagram)).toBe(6);
  });
});
