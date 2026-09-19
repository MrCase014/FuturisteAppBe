import type { AgeGroupCode } from '../methodology/age-groups';
import type { SessionPhase } from '../methodology/session-phases';
import type { DomainCode } from '../methodology/domains';

/**
 * Recherche d'exercices.
 *
 * Le test de recette de la phase 5 est chronométré : « un coach trouve un
 * exercice U11 · intelligence · 16 joueurs en moins de 20 secondes ». Ce n'est
 * pas une figure de style — un coach cherche entre deux séances, debout, sur
 * un téléphone. La règle de correspondance vit donc ici, testée, et non
 * répartie entre une requête SQL et un filtre d'interface où elle finirait par
 * diverger.
 */

export interface ExerciseCriteria {
  /** Catégorie d'âge visée. Un exercice sans restriction convient à toutes. */
  ageGroup?: AgeGroupCode;
  /** Effectif réellement présent — souvent différent de l'effectif théorique. */
  playersPresent?: number;
  domain?: DomainCode;
  phase?: SessionPhase;
  /** Durée disponible pour le bloc, en minutes. */
  maxDurationMin?: number;
  /** Recherche libre sur le nom et l'objectif. */
  text?: string;
}

export interface SearchableExercise {
  id: string;
  name: string;
  objective: string;
  domainCode: DomainCode | null;
  ageGroupCodes: readonly string[];
  playersMin: number;
  playersMax: number;
  durationMin: number;
  defaultPhase: SessionPhase | null;
  isPublished: boolean;
}

/** Normalise pour une recherche insensible à la casse ET aux accents. */
export function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

export type MismatchReason =
  'AGE' | 'EFFECTIF' | 'DOMAINE' | 'PHASE' | 'DUREE' | 'TEXTE' | 'BROUILLON';

/**
 * Pourquoi un exercice ne convient PAS — plutôt qu'un simple booléen.
 *
 * Un coach qui ne trouve rien doit savoir quel critère écarter. « Aucun
 * résultat » l'oblige à tâtonner ; « 12 exercices écartés faute d'effectif »
 * lui dit quoi changer.
 */
export function mismatchReasons(
  exercise: SearchableExercise,
  criteria: ExerciseCriteria,
): MismatchReason[] {
  const reasons: MismatchReason[] = [];

  if (!exercise.isPublished) reasons.push('BROUILLON');

  // Un exercice sans catégorie déclarée convient partout : c'est un exercice
  // général, pas un exercice qui ne conviendrait à personne.
  if (
    criteria.ageGroup &&
    exercise.ageGroupCodes.length > 0 &&
    !exercise.ageGroupCodes.includes(criteria.ageGroup)
  ) {
    reasons.push('AGE');
  }

  if (criteria.playersPresent !== undefined) {
    if (
      criteria.playersPresent < exercise.playersMin ||
      criteria.playersPresent > exercise.playersMax
    ) {
      reasons.push('EFFECTIF');
    }
  }

  if (criteria.domain && exercise.domainCode !== criteria.domain) reasons.push('DOMAINE');
  if (criteria.phase && exercise.defaultPhase !== criteria.phase) reasons.push('PHASE');

  if (criteria.maxDurationMin !== undefined && exercise.durationMin > criteria.maxDurationMin) {
    reasons.push('DUREE');
  }

  const text = normalize(criteria.text ?? '');
  if (text) {
    const haystack = `${normalize(exercise.name)} ${normalize(exercise.objective)}`;
    if (!haystack.includes(text)) reasons.push('TEXTE');
  }

  return reasons;
}

export function matchesCriteria(exercise: SearchableExercise, criteria: ExerciseCriteria): boolean {
  return mismatchReasons(exercise, criteria).length === 0;
}

export interface SearchOutcome<T> {
  matches: T[];
  /** Combien d'exercices chaque critère a écartés, pour guider le coach. */
  excludedBy: Record<MismatchReason, number>;
}

export function searchExercises<T extends SearchableExercise>(
  exercises: readonly T[],
  criteria: ExerciseCriteria,
): SearchOutcome<T> {
  const excludedBy: Record<MismatchReason, number> = {
    AGE: 0,
    EFFECTIF: 0,
    DOMAINE: 0,
    PHASE: 0,
    DUREE: 0,
    TEXTE: 0,
    BROUILLON: 0,
  };
  const matches: T[] = [];

  for (const exercise of exercises) {
    const reasons = mismatchReasons(exercise, criteria);
    if (reasons.length === 0) {
      matches.push(exercise);
      continue;
    }
    // Un exercice écarté par trois critères compte pour les trois : on veut
    // savoir quel critère débloquerait le plus de résultats, pas lequel a
    // frappé en premier.
    for (const reason of reasons) excludedBy[reason] += 1;
  }

  return { matches, excludedBy };
}

/** Le critère qui, seul, écarte le plus d'exercices. Null si rien n'est écarté. */
export function mostLimitingCriterion(
  outcome: SearchOutcome<SearchableExercise>,
): MismatchReason | null {
  let best: MismatchReason | null = null;
  let bestCount = 0;
  for (const [reason, count] of Object.entries(outcome.excludedBy) as [MismatchReason, number][]) {
    if (count > bestCount) {
      best = reason;
      bestCount = count;
    }
  }
  return best;
}

export const MISMATCH_LABEL: Record<MismatchReason, string> = {
  AGE: 'la catégorie',
  EFFECTIF: "l'effectif",
  DOMAINE: 'le domaine',
  PHASE: 'la phase de séance',
  DUREE: 'la durée',
  TEXTE: 'la recherche',
  BROUILLON: 'des brouillons non publiés',
};
