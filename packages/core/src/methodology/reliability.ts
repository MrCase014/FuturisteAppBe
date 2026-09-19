/**
 * Fiabilité d'une moyenne affichée.
 *
 * Une moyenne calculée sur deux évaluations n'est pas une mesure, c'est une
 * anecdote. L'afficher comme le niveau d'une catégorie conduirait un directeur
 * à décider — réorienter une méthodologie, interpeller un coach — sur du
 * bruit. Et dans une académie de jeunes, ce genre de décision touche des
 * enfants réels.
 *
 * Le principe est déjà celui du PLAYER DNA (docs/11 §250) : sous le seuil, on
 * ne masque pas le chiffre, on refuse de le présenter comme acquis.
 */

/** En deçà, une moyenne est indicative et doit être annoncée comme telle. */
export const MIN_RELIABLE_SAMPLE = 5;

export type ReliabilityLevel = 'fiable' | 'indicatif' | 'insuffisant';

export function reliabilityOf(sampleSize: number): ReliabilityLevel {
  if (!Number.isFinite(sampleSize) || sampleSize <= 0) return 'insuffisant';
  if (sampleSize >= MIN_RELIABLE_SAMPLE) return 'fiable';
  return 'indicatif';
}

export function isReliable(sampleSize: number): boolean {
  return reliabilityOf(sampleSize) === 'fiable';
}

/** Mention affichée à côté d'une moyenne peu étayée. */
export function reliabilityNoteFr(sampleSize: number): string | null {
  const level = reliabilityOf(sampleSize);
  if (level === 'fiable') return null;
  if (level === 'insuffisant') return 'aucune évaluation';
  return sampleSize === 1
    ? 'sur 1 évaluation seulement — indicatif'
    : `sur ${sampleSize} évaluations seulement — indicatif`;
}

export interface WeightedSample {
  /** Moyenne déjà calculée pour un sous-ensemble (un joueur, par exemple). */
  value: number;
  /** Nombre d'observations derrière cette moyenne. */
  weight: number;
}

export interface WeightedResult {
  average: number;
  totalWeight: number;
}

/**
 * Moyenne pondérée par le nombre d'observations.
 *
 * Pourquoi pondérer : la base renvoie une moyenne PAR JOUEUR. Les moyenner à
 * plat donnerait le même poids à un joueur évalué douze fois et à un joueur
 * évalué une seule fois — et cette unique évaluation déplacerait la moyenne de
 * toute l'académie. Un directeur y lirait une baisse de niveau qui n'existe pas.
 *
 * Renvoie null si aucune observation : il n'y a pas de moyenne de rien, et
 * renvoyer 0 ferait afficher « 0 / 5 », c'est-à-dire le pire niveau possible.
 */
export function weightedAverage(samples: readonly WeightedSample[]): WeightedResult | null {
  let sum = 0;
  let totalWeight = 0;

  for (const sample of samples) {
    if (!Number.isFinite(sample.value) || !Number.isFinite(sample.weight)) continue;
    if (sample.weight <= 0) continue;
    sum += sample.value * sample.weight;
    totalWeight += sample.weight;
  }

  if (totalWeight === 0) return null;
  return { average: sum / totalWeight, totalWeight };
}
