import { describe, expect, it } from 'vitest';
import { canonicalDiagram, parseDiagram } from '../src/parse';
import type { DiagramCanvas } from '../src/schema';

/** Un schéma minimal valide, que chaque test abîme d'une seule façon. */
const valide = (): Record<string, unknown> => ({
  version: 1,
  field: { kind: 'CUSTOM', lengthM: 20, widthM: 15, orientation: 'HORIZONTAL' },
  elements: [
    { id: 'a1', kind: 'PLAYER', team: 'A', number: 7, x: 20, y: 50 },
    { id: 'b1', kind: 'PLAYER', team: 'B', number: 4, x: 60, y: 50 },
    { id: 'ball', kind: 'BALL', x: 24, y: 50 },
  ],
  keyframes: [
    { t: 0, phase: 'POSSESSION', positions: { ball: { x: 24, y: 50 } } },
    { t: 1, phase: 'PERTE', positions: { ball: { x: 60, y: 40 } } },
  ],
});

const issues = (raw: unknown): string[] => {
  const result = parseDiagram(raw);
  return result.ok ? [] : result.issues.map((i) => `${i.path} · ${i.message}`);
};

describe('parseDiagram', () => {
  it('accepte un schéma conforme', () => {
    const result = parseDiagram(valide());
    expect(result.ok).toBe(true);
  });

  it('accepte un schéma fixe, sans aucune image-clé', () => {
    const fixe = { ...valide(), keyframes: [] };
    expect(parseDiagram(fixe).ok).toBe(true);
  });

  it('refuse ce qui n’est pas un objet', () => {
    expect(issues('bonjour')).toHaveLength(1);
    expect(issues(null)).toHaveLength(1);
    expect(issues([])).toHaveLength(1);
  });

  it('refuse une version inconnue plutôt que de deviner', () => {
    expect(issues({ ...valide(), version: 2 }).join()).toContain('version');
  });

  it('refuse une coordonnée hors du terrain', () => {
    const hors = valide();
    (hors.elements as Record<string, unknown>[])[0]!.x = 140;
    expect(issues(hors).join()).toContain('hors du terrain');
  });

  it('refuse un identifiant en double — deux éléments qui se répondraient', () => {
    const double = valide();
    (double.elements as Record<string, unknown>[])[1]!.id = 'a1';
    expect(issues(double).join()).toContain('double');
  });

  /**
   * Le cas qui motive toute cette validation : une image-clé qui déplace un
   * élément inexistant ne provoque AUCUNE erreur à l'exécution. Elle ne fait
   * simplement rien, et le coach voit un schéma figé sans comprendre pourquoi.
   */
  it('refuse une image-clé qui déplace un élément inexistant', () => {
    const fantome = valide();
    (fantome.keyframes as Record<string, unknown>[])[1]!.positions = {
      a9: { x: 10, y: 10 },
    };
    expect(issues(fantome).join()).toContain('a9');
  });

  it('refuse de déplacer une flèche ou une zone, qui ne sont pas des figurants', () => {
    const raw = valide();
    (raw.elements as Record<string, unknown>[]).push({
      id: 'ar1',
      kind: 'ARROW',
      motion: 'PASSE',
      points: [
        { x: 10, y: 10 },
        { x: 40, y: 40 },
      ],
    });
    (raw.keyframes as Record<string, unknown>[])[1]!.positions = { ar1: { x: 20, y: 20 } };
    expect(issues(raw).join()).toContain('ar1');
  });

  it('refuse des images-clés dans le désordre', () => {
    const desordre = valide();
    (desordre.keyframes as Record<string, unknown>[])[1]!.t = 0;
    expect(issues(desordre).join()).toContain('chronologique');
  });

  it('refuse une image-clé unique, qui n’anime rien', () => {
    const seule = { ...valide(), keyframes: [{ t: 0, positions: {} }] };
    expect(issues(seule).join()).toContain('n’anime rien');
  });

  it('refuse une flèche à moins de deux points', () => {
    const raw = valide();
    (raw.elements as Record<string, unknown>[]).push({
      id: 'ar1',
      kind: 'ARROW',
      motion: 'PASSE',
      points: [{ x: 10, y: 10 }],
    });
    expect(issues(raw).join()).toContain('au moins 2 points');
  });

  it('refuse un schéma vide : il ne montrerait rien', () => {
    expect(issues({ ...valide(), elements: [], keyframes: [] }).join()).toContain('ne montre rien');
  });

  it('signale TOUT ce qui cloche, pas seulement la première erreur', () => {
    const casse = {
      version: 3,
      field: { kind: 'AUTRE', orientation: 'DIAGONALE', lengthM: 0, widthM: -2 },
      elements: [{ id: '', kind: 'LICORNE', x: 'gauche', y: 400 }],
      keyframes: [{ t: 5, positions: { inconnu: { x: 1, y: 1 } } }],
    };
    expect(issues(casse).length).toBeGreaterThan(5);
  });

  it('rend un type utilisable quand tout va bien', () => {
    const result = parseDiagram(valide());
    if (!result.ok) throw new Error('le schéma de référence doit être valide');
    const diagram: DiagramCanvas = result.diagram;
    expect(diagram.field.lengthM).toBe(20);
    expect(diagram.keyframes).toHaveLength(2);
  });
});

describe('canonicalDiagram', () => {
  const build = (raw: unknown) => {
    const result = parseDiagram(raw);
    if (!result.ok)
      throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join(' | '));
    return result.diagram;
  };

  it('laisse dehors ce que le format ne décrit pas', () => {
    // Un navigateur peut poster n'importe quoi à côté des joueurs : sans cette
    // recopie, la charge entrerait dans la colonne jsonb et y resterait.
    const diagram = build({
      version: 1,
      field: { kind: 'CUSTOM', lengthM: 20, widthM: 20, orientation: 'HORIZONTAL' },
      elements: [{ id: 'a1', kind: 'PLAYER', team: 'A', x: 10, y: 10, charge: 'x'.repeat(5000) }],
      keyframes: [],
      secret: { jeton: 'abc' },
    });
    const clean = canonicalDiagram(diagram);
    expect(JSON.stringify(clean)).not.toContain('secret');
    expect(JSON.stringify(clean)).not.toContain('charge');
    expect(clean.elements[0]).toEqual({ id: 'a1', kind: 'PLAYER', team: 'A', x: 10, y: 10 });
  });

  it('garde tout ce que le format décrit, sans rien perdre', () => {
    const complet = {
      version: 1 as const,
      field: { kind: 'HALF' as const, lengthM: 50, widthM: 64, orientation: 'VERTICAL' as const },
      elements: [
        {
          id: 'a1',
          kind: 'PLAYER' as const,
          team: 'A' as const,
          number: 7,
          label: 'Ailier',
          x: 1,
          y: 2,
          hasBall: true,
        },
        { id: 'g1', kind: 'GK' as const, team: 'B' as const, x: 3, y: 4 },
        { id: 'ball1', kind: 'BALL' as const, x: 5, y: 6 },
        { id: 'c1', kind: 'CONE' as const, x: 7, y: 8 },
        { id: 'but1', kind: 'GOAL' as const, size: 'MINI' as const, rotation: 90, x: 9, y: 10 },
        {
          id: 'z1',
          kind: 'ZONE' as const,
          shape: 'RECT' as const,
          purpose: 'CIBLE' as const,
          x: 11,
          y: 12,
          w: 13,
          h: 14,
          label: 'Cible',
        },
        {
          id: 'ar1',
          kind: 'ARROW' as const,
          motion: 'TIR' as const,
          points: [
            { x: 15, y: 16 },
            { x: 17, y: 18 },
          ],
        },
        { id: 't1', kind: 'TEXT' as const, text: 'Vite', x: 19, y: 20 },
      ],
      keyframes: [
        { t: 0, positions: {} },
        {
          t: 1,
          phase: 'PERTE' as const,
          caption: 'on réagit',
          positions: { a1: { x: 30, y: 40 } },
        },
      ],
      legend: [{ label: 'Équipe A', color: '#7C3AED' }],
      alt: 'Un exercice.',
    };
    expect(canonicalDiagram(build(complet))).toEqual(complet);
  });

  it('rend un schéma que le lecteur accepte encore', () => {
    const diagram = build({
      version: 1,
      field: { kind: 'CUSTOM', lengthM: 20, widthM: 20, orientation: 'HORIZONTAL' },
      elements: [{ id: 'a1', kind: 'PLAYER', team: 'A', x: 10, y: 10 }],
      keyframes: [],
    });
    expect(parseDiagram(canonicalDiagram(diagram)).ok).toBe(true);
  });
});
