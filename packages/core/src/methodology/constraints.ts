import { isYoungCategory, type AgeGroupCode } from './age-groups';
import type { SessionPhase } from './session-phases';

/**
 * Règles dures FUTURISTE (docs/11 §4).
 *
 * Ce sont les garde-fous pédagogiques. Ils restent du CODE, jamais de l'IA :
 * c'est ce qui garantit qu'une future génération automatique de séance
 * ne pourra pas proposer 20 minutes d'analytique à des U7.
 */
export type RuleSeverity = 'BLOCKING' | 'WARNING';

export interface RuleViolation {
  rule: string;
  severity: RuleSeverity;
  messageFr: string;
}

export interface SessionBlockDraft {
  phase: SessionPhase;
  durationMin: number;
  /** Bloc analytique : répétition sans opposition ni décision. */
  isAnalytic?: boolean;
  /** Travail physique sans ballon. */
  isPhysicalWithoutBall?: boolean;
  /** Plus grande file d'attente induite par l'organisation du bloc. */
  maxQueueLength?: number;
  /** Part du bloc où chaque enfant a un ballon (0 → 1). */
  ballContactRatio?: number;
}

export interface SessionDraft {
  ageGroup: AgeGroupCode;
  durationMin: number;
  blocks: SessionBlockDraft[];
}

const MAX_ANALYTIC_MIN_U7 = 10;
const MAX_QUEUE_LENGTH = 4;
const MIN_BALL_RATIO_YOUNG = 0.6;
const MAX_DURATION_YOUNG_MIN = 75;

/**
 * Valide une séance contre les règles dures.
 * Le Session Studio refuse une séance comportant au moins une violation
 * BLOCKING, et explique laquelle au coach.
 */
export function validateSession(draft: SessionDraft): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const young = isYoungCategory(draft.ageGroup);
  const preAdolescent = young || draft.ageGroup === 'U11';

  if (draft.ageGroup === 'U7') {
    for (const block of draft.blocks) {
      if (block.isAnalytic && block.durationMin > MAX_ANALYTIC_MIN_U7) {
        violations.push({
          rule: 'U7_ANALYTIC_MAX_10MIN',
          severity: 'BLOCKING',
          messageFr: `En U7, un bloc analytique ne dépasse pas ${MAX_ANALYTIC_MIN_U7} min (ici ${block.durationMin} min).`,
        });
      }
    }
  }

  if (young && draft.durationMin > MAX_DURATION_YOUNG_MIN) {
    violations.push({
      rule: 'YOUNG_MAX_DURATION',
      severity: 'BLOCKING',
      messageFr: `En ${draft.ageGroup}, une séance ne dépasse pas ${MAX_DURATION_YOUNG_MIN} min (ici ${draft.durationMin} min).`,
    });
  }

  if (young) {
    const withBall = draft.blocks.reduce(
      (sum, b) => sum + b.durationMin * (b.ballContactRatio ?? 0),
      0,
    );
    const ratio = draft.durationMin > 0 ? withBall / draft.durationMin : 0;
    if (ratio < MIN_BALL_RATIO_YOUNG) {
      violations.push({
        rule: 'YOUNG_MIN_BALL_CONTACT',
        severity: 'BLOCKING',
        messageFr: `En ${draft.ageGroup}, au moins ${MIN_BALL_RATIO_YOUNG * 100} % du temps se fait avec un ballon par enfant (ici ${Math.round(ratio * 100)} %).`,
      });
    }
  }

  if (preAdolescent) {
    for (const block of draft.blocks) {
      if (block.isPhysicalWithoutBall) {
        violations.push({
          rule: 'NO_PHYSICAL_WITHOUT_BALL_BEFORE_U13',
          severity: 'BLOCKING',
          messageFr: `En ${draft.ageGroup}, aucun travail physique sans ballon.`,
        });
      }
    }
  }

  for (const block of draft.blocks) {
    if ((block.maxQueueLength ?? 0) > MAX_QUEUE_LENGTH) {
      violations.push({
        rule: 'MAX_QUEUE_LENGTH',
        severity: 'BLOCKING',
        messageFr: `Une file d'attente ne dépasse jamais ${MAX_QUEUE_LENGTH} joueurs (ici ${block.maxQueueLength}).`,
      });
    }
  }

  const hasFreePlay = draft.blocks.some(
    (b) => b.phase === 'JEU_REDUIT' || b.phase === 'SITUATION_REELLE' || b.phase === 'ACCUEIL',
  );
  if (!hasFreePlay) {
    violations.push({
      rule: 'AT_LEAST_ONE_GAME_BLOCK',
      severity: 'BLOCKING',
      messageFr: 'Toute séance comporte au moins un bloc de jeu libre ou réduit.',
    });
  }

  if (!draft.blocks.some((b) => b.phase === 'RETOUR_CALME')) {
    violations.push({
      rule: 'COOLDOWN_REQUIRED',
      severity: 'BLOCKING',
      messageFr: 'Le retour au calme est obligatoire (récupération et débriefing).',
    });
  }

  const positional = draft.blocks.some((b) => b.phase === 'JEU_POSITION');
  const needsPositional = !young && draft.ageGroup !== 'U11';
  if (needsPositional && !positional) {
    violations.push({
      rule: 'POSITIONAL_GAME_FROM_U13',
      severity: 'WARNING',
      messageFr: `À partir de U13, le jeu de position est attendu au moins une fois par semaine.`,
    });
  }

  const senior = draft.ageGroup === 'U15' || draft.ageGroup === 'U16' || draft.ageGroup === 'U18';
  if (senior) {
    const last = draft.blocks.filter((b) => b.phase !== 'RETOUR_CALME').at(-1);
    if (last?.phase === 'ACTIVATION') {
      violations.push({
        rule: 'SPEED_WHEN_FRESH',
        severity: 'WARNING',
        messageFr: 'La vitesse se travaille à l’état frais, jamais en fin de séance.',
      });
    }
  }

  return violations;
}

export function isSessionAllowed(draft: SessionDraft): boolean {
  return !validateSession(draft).some((v) => v.severity === 'BLOCKING');
}

/** Nombre maximum d'objectifs MY NEXT LEVEL actifs par joueur (docs/11 §8). */
export const MAX_ACTIVE_GOALS = 3;

/** Seuil de confiance en dessous duquel le PLAYER DNA reste masqué (docs/11 §9). */
export const PLAYER_DNA_MIN_CONFIDENCE = 0.6;

/** Le PLAYER DNA est-il affichable pour cette catégorie et ce niveau de confiance ? */
export function isPlayerDnaVisible(ageGroup: AgeGroupCode, confidence: number): boolean {
  if (isYoungCategory(ageGroup)) return false;
  return confidence >= PLAYER_DNA_MIN_CONFIDENCE;
}

/** Les statistiques chiffrées sont masquées en U7/U9 (docs/04 §9). */
export function areMatchStatsVisible(ageGroup: AgeGroupCode): boolean {
  return !isYoungCategory(ageGroup);
}
