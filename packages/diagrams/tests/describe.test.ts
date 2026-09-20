import { describe, expect, it } from 'vitest';
import { describeDiagram } from '../src/describe';
import { parseDiagram } from '../src/parse';
import type { DiagramCanvas } from '../src/schema';

const build = (raw: unknown): DiagramCanvas => {
  const result = parseDiagram(raw);
  if (!result.ok) throw new Error('schéma de test invalide');
  return result.diagram;
};

const base = {
  version: 1,
  field: { kind: 'CUSTOM', lengthM: 25, widthM: 20, orientation: 'HORIZONTAL' },
  elements: [
    { id: 'a1', kind: 'PLAYER', team: 'A', x: 10, y: 50 },
    { id: 'a2', kind: 'PLAYER', team: 'A', x: 30, y: 20 },
    { id: 'b1', kind: 'PLAYER', team: 'B', x: 50, y: 50 },
    { id: 'j1', kind: 'PLAYER', team: 'JOKER', x: 60, y: 50 },
    { id: 'gk', kind: 'GK', team: 'A', x: 5, y: 50 },
    { id: 'z1', kind: 'ZONE', shape: 'RECT', purpose: 'OCCUPER', x: 30, y: 10, w: 30, h: 60 },
  ],
  keyframes: [
    { t: 0, phase: 'POSSESSION', caption: 'un', positions: { a1: { x: 10, y: 50 } } },
    { t: 1, phase: 'PERTE', caption: 'deux', positions: { a1: { x: 40, y: 50 } } },
  ],
};

describe('describeDiagram', () => {
  it('compte les figurants et accorde le pluriel', () => {
    const { alt } = describeDiagram(build(base));
    expect(alt).toContain('25 × 20 m');
    expect(alt).toContain('2 joueurs de l’équipe A');
    expect(alt).toContain('1 joueur de l’équipe B');
    expect(alt).toContain('1 joker');
    expect(alt).toContain('1 gardien');
  });

  it('nomme la zone par son intention, pas par sa forme', () => {
    expect(describeDiagram(build(base)).alt).toContain('zone à occuper');
  });

  it('préfère le texte écrit par l’auteur à celui qu’il calcule', () => {
    const avecAlt = build({ ...base, alt: '  Rondo simple pour les U9.  ' });
    expect(describeDiagram(avecAlt).alt).toBe('Rondo simple pour les U9.');
  });

  it('liste les étapes avec leur phase, pour qui ne voit pas l’animation', () => {
    const { steps } = describeDiagram(build(base));
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ index: 1, phaseLabel: 'Possession', caption: 'un' });
    expect(steps[1]).toMatchObject({ index: 2, phaseLabel: 'Perte', caption: 'deux' });
  });
});
