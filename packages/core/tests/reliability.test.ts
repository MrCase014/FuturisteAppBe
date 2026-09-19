import { describe, expect, it } from 'vitest';
import {
  MIN_RELIABLE_SAMPLE,
  isReliable,
  reliabilityNoteFr,
  reliabilityOf,
  weightedAverage,
} from '../src/methodology/reliability';

describe('fiabilité des moyennes', () => {
  it('au seuil, la moyenne devient fiable', () => {
    expect(reliabilityOf(MIN_RELIABLE_SAMPLE)).toBe('fiable');
    expect(isReliable(MIN_RELIABLE_SAMPLE)).toBe(true);
  });

  it('juste sous le seuil, elle reste indicative', () => {
    expect(reliabilityOf(MIN_RELIABLE_SAMPLE - 1)).toBe('indicatif');
    expect(isReliable(MIN_RELIABLE_SAMPLE - 1)).toBe(false);
  });

  it('sans aucune évaluation, elle est insuffisante et non « indicative »', () => {
    expect(reliabilityOf(0)).toBe('insuffisant');
    expect(reliabilityOf(-3)).toBe('insuffisant');
  });

  it('une valeur non numérique ne passe pas pour fiable', () => {
    expect(reliabilityOf(Number.NaN)).toBe('insuffisant');
    expect(reliabilityOf(Number.POSITIVE_INFINITY)).toBe('insuffisant');
  });

  it('une moyenne fiable ne porte aucune mention', () => {
    expect(reliabilityNoteFr(MIN_RELIABLE_SAMPLE)).toBeNull();
  });

  it('une évaluation unique le dit au singulier', () => {
    expect(reliabilityNoteFr(1)).toBe('sur 1 évaluation seulement — indicatif');
  });

  it('deux évaluations le disent au pluriel', () => {
    expect(reliabilityNoteFr(2)).toBe('sur 2 évaluations seulement — indicatif');
  });
});

describe('moyenne pondérée', () => {
  it("pondère par le nombre d'observations, pas par le nombre de joueurs", () => {
    // Un joueur évalué 10 fois à 4, un joueur évalué 1 fois à 1.
    // Moyenne à plat : 2,5. Moyenne pondérée : 3,7 — la bonne.
    const result = weightedAverage([
      { value: 4, weight: 10 },
      { value: 1, weight: 1 },
    ]);
    expect(result).not.toBeNull();
    expect(result!.average).toBeCloseTo(41 / 11, 5);
    expect(result!.totalWeight).toBe(11);
  });

  it('sans observation, renvoie null et non zéro — 0/5 est le pire niveau', () => {
    expect(weightedAverage([])).toBeNull();
    expect(weightedAverage([{ value: 4, weight: 0 }])).toBeNull();
  });

  it('ignore un poids négatif au lieu de soustraire', () => {
    const result = weightedAverage([
      { value: 3, weight: 2 },
      { value: 5, weight: -4 },
    ]);
    expect(result!.average).toBe(3);
    expect(result!.totalWeight).toBe(2);
  });

  it('ignore une valeur non numérique plutôt que de produire NaN', () => {
    const result = weightedAverage([
      { value: Number.NaN, weight: 3 },
      { value: 2, weight: 1 },
    ]);
    expect(result!.average).toBe(2);
  });

  it('une seule observation donne sa propre valeur', () => {
    expect(weightedAverage([{ value: 3.5, weight: 1 }])!.average).toBe(3.5);
  });
});
