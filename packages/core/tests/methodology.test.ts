import { describe, expect, it } from 'vitest';
import {
  AGE_GROUPS,
  DOMAINS,
  DOMAIN_ORDER,
  TOTAL_COMPETENCIES,
  SESSION_PHASES,
  buildTimeline,
  ageGroupForAge,
  getAgeGroup,
  isYoungCategory,
  computeAge,
  ageGroupForBirthDate,
} from '../src';

describe('catégories', () => {
  it('couvre 6 à 18 ans sans trou ni chevauchement', () => {
    const sorted = [...AGE_GROUPS].sort((a, b) => a.minAge - b.minAge);
    expect(sorted[0]!.minAge).toBe(6);
    expect(sorted.at(-1)!.maxAge).toBe(18);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.minAge).toBe(sorted[i - 1]!.maxAge + 1);
    }
  });

  it('trouve la catégorie d’un âge et rien hors bornes', () => {
    expect(ageGroupForAge(10)?.code).toBe('U11');
    expect(ageGroupForAge(16)?.code).toBe('U16');
    expect(ageGroupForAge(5)).toBeUndefined();
    expect(ageGroupForAge(19)).toBeUndefined();
  });

  it('U7 et U9 sont les seules catégories dites jeunes', () => {
    const young = AGE_GROUPS.filter((g) => isYoungCategory(g.code)).map((g) => g.code);
    expect(young).toEqual(['U7', 'U9']);
  });

  it('la complexité ne décroît jamais avec l’âge', () => {
    const sorted = [...AGE_GROUPS].sort((a, b) => a.orderIndex - b.orderIndex);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.complexityLevel).toBeGreaterThanOrEqual(sorted[i - 1]!.complexityLevel);
    }
  });

  it('respecte la durée maximale de 75 min en U7/U9', () => {
    for (const group of AGE_GROUPS.filter((g) => isYoungCategory(g.code))) {
      expect(group.sessionDurationMin).toBeLessThanOrEqual(75);
    }
  });

  it('refuse une catégorie inconnue', () => {
    // @ts-expect-error catégorie volontairement invalide
    expect(() => getAgeGroup('U12')).toThrow();
  });
});

describe('domaines', () => {
  it('compte 8 domaines aux slots 1 à 8, sans doublon', () => {
    expect(DOMAINS).toHaveLength(8);
    expect([...DOMAINS].map((d) => d.slot).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(DOMAIN_ORDER).size).toBe(8);
  });

  it('respecte l’ordre de slots validé du design system', () => {
    expect(DOMAIN_ORDER).toEqual([
      'INTELLIGENCE',
      'PHYSIQUE',
      'VITESSE',
      'EDUCATION',
      'MENTAL',
      'SOCIAL',
      'TECHNIQUE',
      'TACTIQUE',
    ]);
  });

  it('couvre environ 70 compétences, toutes non vides', () => {
    expect(TOTAL_COMPETENCIES).toBeGreaterThanOrEqual(65);
    for (const domain of DOMAINS) {
      expect(domain.competencies.length).toBeGreaterThan(0);
      for (const competency of domain.competencies) expect(competency.trim()).not.toBe('');
    }
  });
});

describe('timeline de séance', () => {
  it('répartit exactement la durée demandée', () => {
    for (const duration of [60, 75, 90, 100, 105]) {
      const total = buildTimeline('U13', duration).reduce((s, b) => s + b.durationMin, 0);
      expect(total).toBe(duration);
    }
  });

  it('les parts des 7 phases somment à 1', () => {
    const sum = SESSION_PHASES.reduce((s, p) => s + p.ratio, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('fusionne le jeu de position en U7 et U9', () => {
    for (const group of ['U7', 'U9'] as const) {
      const phases = buildTimeline(group, 60).map((b) => b.phase);
      expect(phases).not.toContain('JEU_POSITION');
      expect(phases).toContain('JEU_REDUIT');
    }
  });

  it('garde le jeu de position à partir de U11', () => {
    expect(buildTimeline('U13', 90).map((b) => b.phase)).toContain('JEU_POSITION');
  });

  it('supprime la technique avant les phases de jeu sur une séance courte', () => {
    const phases = buildTimeline('U13', 60).map((b) => b.phase);
    expect(phases).not.toContain('TECHNIQUE');
    expect(phases).toContain('JEU_REDUIT');
    expect(phases).toContain('SITUATION_REELLE');
  });

  it('conserve toujours accueil et retour au calme', () => {
    for (const duration of [45, 60, 90, 105]) {
      const phases = buildTimeline('U15', duration).map((b) => b.phase);
      expect(phases).toContain('ACCUEIL');
      expect(phases).toContain('RETOUR_CALME');
    }
  });

  it('rend les blocs dans l’ordre chronologique', () => {
    const blocks = buildTimeline('U15', 100);
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i]!.orderIndex).toBeGreaterThan(blocks[i - 1]!.orderIndex);
    }
  });

  it('refuse une durée nulle ou négative', () => {
    expect(() => buildTimeline('U11', 0)).toThrow();
    expect(() => buildTimeline('U11', -30)).toThrow();
  });
});

describe('âge', () => {
  it('ne compte pas l’anniversaire à venir', () => {
    const birth = new Date('2016-12-25');
    expect(computeAge(birth, new Date('2026-12-24'))).toBe(9);
    expect(computeAge(birth, new Date('2026-12-25'))).toBe(10);
  });

  it('déduit la catégorie de la date de naissance', () => {
    expect(ageGroupForBirthDate(new Date('2015-03-10'), new Date('2026-09-16'))?.code).toBe('U11');
  });
});
