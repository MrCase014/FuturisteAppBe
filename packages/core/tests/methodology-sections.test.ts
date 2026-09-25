import { describe, expect, it } from 'vitest';
import methodology from '../data/methodology.json';
import {
  METHODOLOGY_BODY_MAX,
  METHODOLOGY_SECTIONS,
  METHODOLOGY_TITLE_MAX,
  isMethodologySectionKey,
  methodologyProblems,
  methodologySectionOrder,
  methodologySectionTitle,
  sortMethodologySections,
} from '../src/methodology/sections';
import { AGE_GROUPS } from '../src/methodology/age-groups';

describe('sections de méthodologie', () => {
  it('reconnaît ses propres clés, et rien d’autre', () => {
    for (const section of METHODOLOGY_SECTIONS) {
      expect(isMethodologySectionKey(section.key)).toBe(true);
    }
    expect(isMethodologySectionKey('AUTRE_CHOSE')).toBe(false);
  });

  it('préfère l’intitulé écrit par la direction au sien', () => {
    expect(methodologySectionTitle('REPERE')).toBe('Point de repère');
    expect(methodologySectionTitle('REPERE', 'La charnière')).toBe('La charnière');
    expect(methodologySectionTitle('REPERE', '   ')).toBe('Point de repère');
  });

  /**
   * Une section ajoutée à la main en base, avec une clé qu'on n'avait pas
   * prévue, doit se ranger à la fin — jamais disparaître. On ne perd pas le
   * travail de quelqu'un parce qu'on n'avait pas anticipé son besoin.
   */
  it('range une section inconnue à la fin plutôt que de la perdre', () => {
    const trie = sortMethodologySections([
      { key: 'INVENTEE' },
      { key: 'EVALUATION' },
      { key: 'PRIORITES' },
    ]);
    expect(trie.map((s) => s.key)).toEqual(['PRIORITES', 'EVALUATION', 'INVENTEE']);
    expect(methodologySectionOrder('INVENTEE')).toBe(99);
  });

  it('trie dans l’ordre de lecture', () => {
    const trie = sortMethodologySections([
      { key: 'INTERDITS' },
      { key: 'FORMAT' },
      { key: 'PRIORITES' },
      { key: 'REPERE' },
    ]);
    expect(trie.map((s) => s.key)).toEqual(['PRIORITES', 'FORMAT', 'REPERE', 'INTERDITS']);
  });
});

describe('contrôle d’une section avant enregistrement', () => {
  it('accepte une section normale', () => {
    expect(methodologyProblems({ titleFr: 'Priorités', bodyFr: 'Le contrôle orienté.' })).toEqual(
      [],
    );
  });

  it('refuse le vide, en titre comme en corps', () => {
    expect(methodologyProblems({ titleFr: '   ', bodyFr: 'texte' })).toContain('TITRE_VIDE');
    expect(methodologyProblems({ titleFr: 'Titre', bodyFr: '  ' })).toContain('CORPS_VIDE');
  });

  it('refuse ce qui ne se lit pas au bord du terrain', () => {
    expect(
      methodologyProblems({ titleFr: 'T', bodyFr: 'x'.repeat(METHODOLOGY_BODY_MAX + 1) }),
    ).toContain('CORPS_TROP_LONG');
    expect(
      methodologyProblems({ titleFr: 'T'.repeat(METHODOLOGY_TITLE_MAX + 1), bodyFr: 'texte' }),
    ).toContain('TITRE_TROP_LONG');
  });

  it('accepte la limite exacte — une borne se teste des deux côtés', () => {
    expect(methodologyProblems({ titleFr: 'T', bodyFr: 'x'.repeat(METHODOLOGY_BODY_MAX) })).toEqual(
      [],
    );
  });

  it('signale tout ce qui cloche d’un coup', () => {
    expect(methodologyProblems({ titleFr: '', bodyFr: '' })).toHaveLength(2);
  });
});

/**
 * Le contenu livré est vérifié par le MÊME code que celui qui vérifiera les
 * modifications de la direction. Un texte trop long écrit par nous serait
 * refusé à quelqu'un d'autre : ce serait deux poids, deux mesures.
 */
describe('le contenu livré', () => {
  const codes = Object.keys(methodology.byAgeGroup);

  it('couvre les sept catégories, sans en inventer', () => {
    expect(new Set(codes)).toEqual(new Set(AGE_GROUPS.map((g) => g.code)));
  });

  it.each(codes)('%s : chaque section est valide et connue', (code) => {
    const sections = methodology.byAgeGroup[code as keyof typeof methodology.byAgeGroup];
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      expect(isMethodologySectionKey(section.key)).toBe(true);
      const titleFr = methodologySectionTitle(
        section.key,
        (section as { titleFr?: string }).titleFr,
      );
      expect(methodologyProblems({ titleFr, bodyFr: section.bodyFr })).toEqual([]);
    }
  });

  it.each(codes)('%s : aucune section en double', (code) => {
    const keys = methodology.byAgeGroup[code as keyof typeof methodology.byAgeGroup].map(
      (s) => s.key,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('commence toujours par les priorités : c’est ce qu’un coach lit en premier', () => {
    for (const code of codes) {
      const sections = methodology.byAgeGroup[code as keyof typeof methodology.byAgeGroup];
      expect(sortMethodologySections(sections)[0]!.key).toBe('PRIORITES');
    }
  });
});
