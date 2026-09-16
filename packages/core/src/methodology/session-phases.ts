import type { AgeGroupCode } from './age-groups';

/** Les 7 phases d'une séance FUTURISTE (docs/11 §6). */
export type SessionPhase =
  | 'ACCUEIL'
  | 'ACTIVATION'
  | 'TECHNIQUE'
  | 'JEU_REDUIT'
  | 'JEU_POSITION'
  | 'SITUATION_REELLE'
  | 'RETOUR_CALME';

export interface PhaseDefinition {
  phase: SessionPhase;
  orderIndex: number;
  labelFr: string;
  /** Part du temps total de séance. La somme vaut 1. */
  ratio: number;
  withBall: boolean;
}

export const SESSION_PHASES: readonly PhaseDefinition[] = [
  { phase: 'ACCUEIL', orderIndex: 1, labelFr: 'Accueil', ratio: 0.1, withBall: true },
  { phase: 'ACTIVATION', orderIndex: 2, labelFr: 'Activation', ratio: 0.15, withBall: true },
  { phase: 'TECHNIQUE', orderIndex: 3, labelFr: 'Technique', ratio: 0.15, withBall: true },
  { phase: 'JEU_REDUIT', orderIndex: 4, labelFr: 'Jeu réduit', ratio: 0.2, withBall: true },
  { phase: 'JEU_POSITION', orderIndex: 5, labelFr: 'Jeu de position', ratio: 0.2, withBall: true },
  {
    phase: 'SITUATION_REELLE',
    orderIndex: 6,
    labelFr: 'Situation réelle',
    ratio: 0.15,
    withBall: true,
  },
  {
    phase: 'RETOUR_CALME',
    orderIndex: 7,
    labelFr: 'Retour au calme',
    ratio: 0.05,
    withBall: false,
  },
] as const;

export interface TimelineBlock {
  phase: SessionPhase;
  orderIndex: number;
  labelFr: string;
  durationMin: number;
}

/**
 * Construit la timeline d'une séance.
 *
 * Adaptations imposées par la méthodologie (docs/11 §6) :
 * - U7/U9 : JEU_POSITION est fusionné dans JEU_REDUIT (le jeu de position
 *   formel vient plus tard) ;
 * - séance < 70 min : on supprime TECHNIQUE avant de toucher aux phases de jeu.
 *
 * Le total des blocs est toujours égal à `durationMin` : l'arrondi est absorbé
 * par la phase la plus longue, jamais par le retour au calme.
 */
export function buildTimeline(ageGroup: AgeGroupCode, durationMin: number): TimelineBlock[] {
  if (durationMin <= 0) throw new Error('La durée de séance doit être positive.');

  const merged = ageGroup === 'U7' || ageGroup === 'U9';
  const short = durationMin < 70;

  let phases = SESSION_PHASES.filter((p) => {
    if (merged && p.phase === 'JEU_POSITION') return false;
    if (short && p.phase === 'TECHNIQUE') return false;
    return true;
  });

  // Les parts retirées sont redistribuées au prorata sur les phases restantes.
  const totalRatio = phases.reduce((sum, p) => sum + p.ratio, 0);
  const blocks: TimelineBlock[] = phases.map((p) => ({
    phase: p.phase,
    orderIndex: p.orderIndex,
    labelFr: p.labelFr,
    durationMin: Math.round((p.ratio / totalRatio) * durationMin),
  }));

  const drift = durationMin - blocks.reduce((sum, b) => sum + b.durationMin, 0);
  if (drift !== 0) {
    const adjustable = blocks
      .filter((b) => b.phase !== 'RETOUR_CALME')
      .sort((a, b) => b.durationMin - a.durationMin)[0];
    if (adjustable) adjustable.durationMin += drift;
  }

  return blocks.sort((a, b) => a.orderIndex - b.orderIndex);
}
