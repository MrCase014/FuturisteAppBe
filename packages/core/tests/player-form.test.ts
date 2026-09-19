import { describe, expect, it } from 'vitest';
import {
  MAX_PLAYER_AGE,
  MIN_PLAYER_AGE,
  validatePlayer,
  type PlayerInput,
} from '../src/people/player-form';

const NOW = new Date('2026-09-19T12:00:00Z');

function base(overrides: Partial<PlayerInput> = {}): PlayerInput {
  return {
    firstName: 'Awa',
    lastName: 'Traoré',
    birthDate: '2015-03-08',
    gender: 'F',
    ...overrides,
  };
}

const fields = (input: PlayerInput) => validatePlayer(input, NOW).map((e) => e.field);

describe('saisie d’un joueur', () => {
  it('accepte une fiche correcte', () => {
    expect(validatePlayer(base(), NOW)).toEqual([]);
  });

  it('refuse un prénom ou un nom trop court', () => {
    expect(fields(base({ firstName: 'A' }))).toContain('firstName');
    expect(fields(base({ lastName: '' }))).toContain('lastName');
  });

  it('ignore les espaces autour du nom plutôt que de les compter', () => {
    expect(fields(base({ firstName: '  A  ' }))).toContain('firstName');
    expect(validatePlayer(base({ firstName: '  Awa  ' }), NOW)).toEqual([]);
  });

  it('refuse une date de naissance dans le futur', () => {
    expect(fields(base({ birthDate: '2030-01-01' }))).toContain('birthDate');
  });

  it('refuse une date impossible que Date accepterait en glissant', () => {
    // new Date('2015-02-31') donne le 3 mars : la fiche serait acceptée avec
    // une date que personne n'a saisie.
    expect(fields(base({ birthDate: '2015-02-31' }))).toContain('birthDate');
  });

  it('refuse un format de date approximatif', () => {
    expect(fields(base({ birthDate: '08/03/2015' }))).toContain('birthDate');
    expect(fields(base({ birthDate: '2015-3-8' }))).toContain('birthDate');
  });

  it(`refuse un enfant plus jeune que ${MIN_PLAYER_AGE} ans`, () => {
    expect(fields(base({ birthDate: '2024-01-01' }))).toContain('birthDate');
  });

  it(`refuse un joueur plus âgé que ${MAX_PLAYER_AGE} ans`, () => {
    expect(fields(base({ birthDate: '1995-01-01' }))).toContain('birthDate');
  });

  it("dit l'âge calculé, pour que l'erreur de saisie saute aux yeux", () => {
    const [error] = validatePlayer(base({ birthDate: '2024-01-01' }), NOW);
    expect(error?.message).toContain('2 ans');
  });

  it('exige un genre connu', () => {
    expect(fields(base({ gender: '' }))).toContain('gender');
    expect(fields(base({ gender: 'MIXED' }))).toContain('gender');
  });

  it('accepte un maillot absent, refuse un maillot hors bornes', () => {
    expect(validatePlayer(base({ jerseyNumber: '' }), NOW)).toEqual([]);
    expect(validatePlayer(base({ jerseyNumber: '10' }), NOW)).toEqual([]);
    expect(fields(base({ jerseyNumber: '0' }))).toContain('jerseyNumber');
    expect(fields(base({ jerseyNumber: '100' }))).toContain('jerseyNumber');
    expect(fields(base({ jerseyNumber: '7.5' }))).toContain('jerseyNumber');
    expect(fields(base({ jerseyNumber: 'dix' }))).toContain('jerseyNumber');
  });

  it('refuse un pied fort ou un statut inventé', () => {
    expect(fields(base({ dominantFoot: 'TROISIEME' }))).toContain('dominantFoot');
    expect(fields(base({ status: 'VACANCES' }))).toContain('status');
  });

  it('signale toutes les erreurs à la fois, pas seulement la première', () => {
    const errors = validatePlayer(
      { firstName: '', lastName: '', birthDate: 'n’importe quoi', gender: '' },
      NOW,
    );
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});
