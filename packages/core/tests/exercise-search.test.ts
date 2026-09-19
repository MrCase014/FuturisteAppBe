import { describe, expect, it } from 'vitest';
import {
  matchesCriteria,
  mismatchReasons,
  mostLimitingCriterion,
  normalize,
  searchExercises,
  type SearchableExercise,
} from '../src/library/exercise-search';

function exercise(overrides: Partial<SearchableExercise> = {}): SearchableExercise {
  return {
    id: 'x1',
    name: 'Conservation en carré',
    objective: 'Prise d’information avant réception',
    domainCode: 'INTELLIGENCE',
    ageGroupCodes: ['U11', 'U13'],
    playersMin: 8,
    playersMax: 16,
    durationMin: 15,
    defaultPhase: 'JEU_REDUIT',
    isPublished: true,
    ...overrides,
  };
}

describe('recherche d’exercices', () => {
  it('accepte un exercice sans critère', () => {
    expect(matchesCriteria(exercise(), {})).toBe(true);
  });

  it('écarte un brouillon non publié, même sans autre critère', () => {
    expect(mismatchReasons(exercise({ isPublished: false }), {})).toContain('BROUILLON');
  });

  it('retient l’exercice du test de recette : U11 · intelligence · 16 joueurs', () => {
    const found = matchesCriteria(exercise(), {
      ageGroup: 'U11',
      domain: 'INTELLIGENCE',
      playersPresent: 16,
    });
    expect(found).toBe(true);
  });

  it('écarte sur la catégorie', () => {
    expect(mismatchReasons(exercise(), { ageGroup: 'U7' })).toContain('AGE');
  });

  it('un exercice sans catégorie déclarée convient à toutes', () => {
    // Sans cette règle, un exercice général n'apparaîtrait jamais — le pire
    // des deux mondes : présent en base, introuvable à l'écran.
    expect(matchesCriteria(exercise({ ageGroupCodes: [] }), { ageGroup: 'U7' })).toBe(true);
  });

  it('écarte aux deux bornes de l’effectif', () => {
    expect(mismatchReasons(exercise(), { playersPresent: 7 })).toContain('EFFECTIF');
    expect(mismatchReasons(exercise(), { playersPresent: 17 })).toContain('EFFECTIF');
  });

  it('accepte exactement aux bornes', () => {
    expect(matchesCriteria(exercise(), { playersPresent: 8 })).toBe(true);
    expect(matchesCriteria(exercise(), { playersPresent: 16 })).toBe(true);
  });

  it('écarte un exercice trop long pour le temps disponible', () => {
    expect(mismatchReasons(exercise(), { maxDurationMin: 10 })).toContain('DUREE');
    expect(matchesCriteria(exercise(), { maxDurationMin: 15 })).toBe(true);
  });

  it('cherche sans tenir compte des accents ni de la casse', () => {
    expect(normalize('Prise d’Information')).toBe('prise d’information');
    expect(matchesCriteria(exercise(), { text: 'CARRÉ' })).toBe(true);
    expect(matchesCriteria(exercise(), { text: 'carre' })).toBe(true);
    expect(matchesCriteria(exercise(), { text: 'RECEPTION' })).toBe(true);
  });

  it('cherche aussi dans l’objectif, pas seulement dans le nom', () => {
    expect(matchesCriteria(exercise(), { text: 'réception' })).toBe(true);
  });

  it('cumule les raisons plutôt que de s’arrêter à la première', () => {
    const reasons = mismatchReasons(exercise(), {
      ageGroup: 'U7',
      playersPresent: 2,
      domain: 'PHYSIQUE',
    });
    expect(reasons).toEqual(expect.arrayContaining(['AGE', 'EFFECTIF', 'DOMAINE']));
  });

  it('compte ce que chaque critère écarte, pour dire quoi relâcher', () => {
    const library = [
      exercise({ id: 'a', playersMin: 20, playersMax: 24 }),
      exercise({ id: 'b', playersMin: 18, playersMax: 22 }),
      exercise({ id: 'c', domainCode: 'PHYSIQUE' }),
    ];
    const outcome = searchExercises(library, { playersPresent: 10, domain: 'INTELLIGENCE' });
    expect(outcome.matches).toHaveLength(0);
    expect(outcome.excludedBy.EFFECTIF).toBe(2);
    expect(outcome.excludedBy.DOMAINE).toBe(1);
    expect(mostLimitingCriterion(outcome)).toBe('EFFECTIF');
  });

  it('ne désigne aucun critère limitant quand tout passe', () => {
    const outcome = searchExercises([exercise()], {});
    expect(outcome.matches).toHaveLength(1);
    expect(mostLimitingCriterion(outcome)).toBeNull();
  });
});
