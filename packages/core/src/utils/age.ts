import { ageGroupForAge, type AgeGroupDefinition } from '../methodology/age-groups';

/**
 * Âge révolu à une date donnée.
 * L'âge n'est JAMAIS stocké en base — il se calcule, sinon il devient faux
 * à chaque anniversaire (docs/04 §14).
 */
export function computeAge(birthDate: Date, at: Date = new Date()): number {
  let age = at.getFullYear() - birthDate.getFullYear();
  const monthDiff = at.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export function ageGroupForBirthDate(
  birthDate: Date,
  at: Date = new Date(),
): AgeGroupDefinition | undefined {
  return ageGroupForAge(computeAge(birthDate, at));
}
