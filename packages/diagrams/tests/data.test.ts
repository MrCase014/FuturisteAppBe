import { describe, expect, it } from 'vitest';
import diagrams from '../data/diagrams.json';
import { parseDiagram } from '../src/parse';
import { describeDiagram } from '../src/describe';
import { durationSeconds, isAnimated } from '../src/animation';

/**
 * Le garde-fou qui compte : les schémas livrés sont validés par le MÊME
 * code que celui qui les lira à l'écran. Un fichier abîmé fait échouer
 * `pnpm test`, donc la CI, donc la livraison — il n'atteint jamais la base.
 */
describe('les schémas livrés', () => {
  it('en contient au moins trois', () => {
    expect(diagrams.length).toBeGreaterThanOrEqual(3);
  });

  it.each(diagrams.map((d) => [d.exerciseSlug, d] as const))('%s est valide', (slug, entry) => {
    const result = parseDiagram(entry.canvas);
    if (!result.ok) {
      throw new Error(
        `${slug} : ${result.issues.map((i) => `${i.path} → ${i.message}`).join(' | ')}`,
      );
    }
    expect(result.ok).toBe(true);
  });

  it.each(diagrams.map((d) => [d.exerciseSlug, d] as const))(
    '%s porte un texte alternatif et des étapes lisibles',
    (_slug, entry) => {
      const result = parseDiagram(entry.canvas);
      if (!result.ok) throw new Error('schéma invalide');
      const { alt, steps } = describeDiagram(result.diagram);
      expect(alt.length).toBeGreaterThan(30);
      expect(isAnimated(result.diagram)).toBe(true);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      for (const step of steps) expect(step.caption).not.toBeNull();
    },
  );

  it.each(diagrams.map((d) => [d.exerciseSlug, d] as const))(
    '%s se lit en moins de 15 secondes',
    (_slug, entry) => {
      const result = parseDiagram(entry.canvas);
      if (!result.ok) throw new Error('schéma invalide');
      // Objectif de docs/14 : comprendre sans lire. Un schéma qui dure une
      // minute n'est plus un schéma, c'est une vidéo.
      expect(durationSeconds(result.diagram)).toBeLessThanOrEqual(15);
    },
  );

  it('reste léger : un schéma pèse moins de 20 Ko', () => {
    for (const entry of diagrams) {
      const bytes = Buffer.byteLength(JSON.stringify(entry.canvas), 'utf8');
      expect(bytes).toBeLessThan(20_000);
    }
  });

  it('ne référence chaque exercice qu’une fois', () => {
    const slugs = diagrams.map((d) => d.exerciseSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
