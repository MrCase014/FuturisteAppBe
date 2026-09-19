import { describe, expect, it } from 'vitest';
import {
  validateSession,
  isSessionAllowed,
  isPlayerDnaVisible,
  areMatchStatsVisible,
  MAX_ACTIVE_GOALS,
  PLAYER_DNA_MIN_CONFIDENCE,
  type SessionDraft,
} from '../src';

/** Séance conforme servant de base aux tests : on n'en casse qu'une règle à la fois. */
function validDraft(overrides: Partial<SessionDraft> = {}): SessionDraft {
  return {
    ageGroup: 'U13',
    durationMin: 90,
    blocks: [
      { phase: 'ACCUEIL', durationMin: 10, ballContactRatio: 1 },
      { phase: 'ACTIVATION', durationMin: 15, ballContactRatio: 1 },
      { phase: 'JEU_REDUIT', durationMin: 25, ballContactRatio: 1, maxQueueLength: 0 },
      { phase: 'JEU_POSITION', durationMin: 20, ballContactRatio: 1 },
      { phase: 'SITUATION_REELLE', durationMin: 15, ballContactRatio: 1 },
      { phase: 'RETOUR_CALME', durationMin: 5, ballContactRatio: 0 },
    ],
    ...overrides,
  };
}

const rules = (draft: SessionDraft) => validateSession(draft).map((v) => v.rule);

describe('règles dures de séance', () => {
  it('accepte une séance conforme', () => {
    expect(validateSession(validDraft())).toEqual([]);
    expect(isSessionAllowed(validDraft())).toBe(true);
  });

  it('refuse un bloc analytique de plus de 10 min en U7', () => {
    const draft = validDraft({
      ageGroup: 'U7',
      durationMin: 60,
      blocks: [
        { phase: 'ACCUEIL', durationMin: 10, ballContactRatio: 1 },
        { phase: 'TECHNIQUE', durationMin: 20, isAnalytic: true, ballContactRatio: 1 },
        { phase: 'JEU_REDUIT', durationMin: 25, ballContactRatio: 1 },
        { phase: 'RETOUR_CALME', durationMin: 5 },
      ],
    });
    expect(rules(draft)).toContain('U7_ANALYTIC_MAX_10MIN');
    expect(isSessionAllowed(draft)).toBe(false);
  });

  it('refuse une séance de plus de 75 min en U7/U9', () => {
    for (const ageGroup of ['U7', 'U9'] as const) {
      expect(rules(validDraft({ ageGroup, durationMin: 90 }))).toContain('YOUNG_MAX_DURATION');
    }
  });

  it('exige 60 % de temps au ballon en U7/U9', () => {
    const draft = validDraft({
      ageGroup: 'U9',
      durationMin: 75,
      blocks: [
        { phase: 'ACCUEIL', durationMin: 10, ballContactRatio: 0.2 },
        { phase: 'JEU_REDUIT', durationMin: 60, ballContactRatio: 0.2 },
        { phase: 'RETOUR_CALME', durationMin: 5, ballContactRatio: 0 },
      ],
    });
    expect(rules(draft)).toContain('YOUNG_MIN_BALL_CONTACT');
  });

  it('refuse le physique sans ballon jusqu’en U11', () => {
    for (const ageGroup of ['U7', 'U9', 'U11'] as const) {
      const draft = validDraft({
        ageGroup,
        durationMin: ageGroup === 'U11' ? 90 : 75,
        blocks: [
          { phase: 'ACCUEIL', durationMin: 10, ballContactRatio: 1 },
          {
            phase: 'ACTIVATION',
            durationMin: 15,
            isPhysicalWithoutBall: true,
            ballContactRatio: 1,
          },
          { phase: 'JEU_REDUIT', durationMin: 45, ballContactRatio: 1 },
          { phase: 'RETOUR_CALME', durationMin: 5, ballContactRatio: 0 },
        ],
      });
      expect(rules(draft)).toContain('NO_PHYSICAL_WITHOUT_BALL_BEFORE_U13');
    }
  });

  it('autorise le physique sans ballon à partir de U13', () => {
    const draft = validDraft();
    draft.blocks[1]!.isPhysicalWithoutBall = true;
    expect(rules(draft)).not.toContain('NO_PHYSICAL_WITHOUT_BALL_BEFORE_U13');
  });

  it('refuse une file d’attente de plus de 4 joueurs', () => {
    const draft = validDraft();
    draft.blocks[2]!.maxQueueLength = 6;
    expect(rules(draft)).toContain('MAX_QUEUE_LENGTH');
  });

  it('exige au moins un bloc de jeu', () => {
    const draft = validDraft({
      blocks: [
        { phase: 'ACTIVATION', durationMin: 40, ballContactRatio: 1 },
        { phase: 'TECHNIQUE', durationMin: 45, ballContactRatio: 1 },
        { phase: 'RETOUR_CALME', durationMin: 5 },
      ],
    });
    expect(rules(draft)).toContain('AT_LEAST_ONE_GAME_BLOCK');
  });

  it('exige le retour au calme', () => {
    const draft = validDraft();
    draft.blocks = draft.blocks.filter((b) => b.phase !== 'RETOUR_CALME');
    expect(rules(draft)).toContain('COOLDOWN_REQUIRED');
  });

  it('signale l’absence de jeu de position à partir de U13, sans bloquer', () => {
    const draft = validDraft();
    draft.blocks = draft.blocks.filter((b) => b.phase !== 'JEU_POSITION');
    const violations = validateSession(draft);
    const positional = violations.find((v) => v.rule === 'POSITIONAL_GAME_FROM_U13');
    expect(positional?.severity).toBe('WARNING');
    expect(isSessionAllowed(draft)).toBe(true);
  });

  it('chaque violation porte un message en français', () => {
    const draft = validDraft({ ageGroup: 'U7', durationMin: 120 });
    const violations = validateSession(draft);
    expect(violations.length).toBeGreaterThan(0);
    for (const violation of violations) {
      expect(violation.messageFr.length).toBeGreaterThan(10);
      expect(['BLOCKING', 'WARNING']).toContain(violation.severity);
    }
  });
});

describe('garde-fous de développement', () => {
  it('limite les objectifs actifs à 3', () => {
    expect(MAX_ACTIVE_GOALS).toBe(3);
  });

  it('masque le PLAYER DNA en U7 et U9, quelle que soit la confiance', () => {
    expect(isPlayerDnaVisible('U7', 1)).toBe(false);
    expect(isPlayerDnaVisible('U9', 0.99)).toBe(false);
  });

  it('masque le PLAYER DNA sous le seuil de confiance', () => {
    expect(isPlayerDnaVisible('U13', PLAYER_DNA_MIN_CONFIDENCE - 0.01)).toBe(false);
    expect(isPlayerDnaVisible('U13', PLAYER_DNA_MIN_CONFIDENCE)).toBe(true);
  });

  it('masque les statistiques de match en U7 et U9', () => {
    expect(areMatchStatsVisible('U7')).toBe(false);
    expect(areMatchStatsVisible('U9')).toBe(false);
    expect(areMatchStatsVisible('U11')).toBe(true);
  });
});
