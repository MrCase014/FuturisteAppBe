import { describe, expect, it } from 'vitest';
import exercisesData from '../data/exercises.json';
import {
  MAX_BLOCKS,
  MAX_BLOCK_MIN,
  MIN_BLOCK_MIN,
  checkSubmission,
  blockedByHeadcount,
  blockProblem,
  editStateFromPlan,
  editViolations,
  editWarnings,
  plannedMinutes,
  sessionEditReducer,
  type SessionEditAction,
  type SessionEditState,
} from '../src/sessions/edit';
import { planSession, type PlannableExercise } from '../src/sessions/plan';
import type { DomainCode } from '../src/methodology/domains';
import type { SessionPhase } from '../src/methodology/session-phases';

interface RawExercise {
  slug: string;
  name: string;
  objective: string;
  domain: string;
  ageGroups: string[];
  level: string;
  phase: string;
  durationMin: number;
  playersMin: number;
  playersMax: number;
  goalkeepers: number;
}

const LIBRARY: PlannableExercise[] = (exercisesData as RawExercise[]).map((e) => ({
  id: e.slug,
  name: e.name,
  objective: e.objective,
  domainCode: e.domain as DomainCode,
  ageGroupCodes: e.ageGroups,
  playersMin: e.playersMin,
  playersMax: e.playersMax,
  durationMin: e.durationMin,
  defaultPhase: e.phase as SessionPhase,
  isPublished: true,
  level: e.level as PlannableExercise['level'],
  goalkeepers: e.goalkeepers,
}));

const start = (): SessionEditState =>
  editStateFromPlan(
    planSession(LIBRARY, {
      ageGroup: 'U11',
      durationMin: 90,
      playersPresent: 14,
      goalkeepersPresent: 1,
      priorityDomains: ['INTELLIGENCE'],
    }),
    { playersPresent: 14, goalkeepersPresent: 1 },
  );

const play = (state: SessionEditState, ...actions: SessionEditAction[]): SessionEditState =>
  actions.reduce(sessionEditReducer, state);

const phases = (state: SessionEditState) => state.blocks.map((b) => b.phase);

describe('ouverture', () => {
  it('reprend le plan proposé, bloc pour bloc', () => {
    const state = start();
    expect(state.blocks).toHaveLength(7);
    expect(plannedMinutes(state)).toBe(90);
    expect(state.dirty).toBe(false);
  });

  it('calcule les ateliers dès l’ouverture', () => {
    const state = editStateFromPlan(
      planSession(LIBRARY, { ageGroup: 'U11', durationMin: 90, playersPresent: 24 }),
      { playersPresent: 24, goalkeepersPresent: 0 },
    );
    expect(state.blocks.some((b) => b.groups > 1)).toBe(true);
  });
});

describe('déplacer un bloc', () => {
  it('déplace, et l’ordre suit', () => {
    const state = sessionEditReducer(start(), { type: 'MOVE', from: 2, to: 4 });
    expect(phases(state)[4]).toBe('TECHNIQUE');
    expect(state.dirty).toBe(true);
  });

  it('ignore un déplacement sur place, sans rien salir', () => {
    const state = sessionEditReducer(start(), { type: 'MOVE', from: 1, to: 1 });
    expect(state.dirty).toBe(false);
  });

  it('ignore un index hors de la séance', () => {
    expect(sessionEditReducer(start(), { type: 'MOVE', from: 0, to: 99 }).dirty).toBe(false);
  });

  it('prévient quand la vitesse finirait la séance, sans l’interdire', () => {
    // SPEED_WHEN_FRESH est un AVERTISSEMENT : le coach décide, on l'informe.
    let state = start();
    const activation = phases(state).indexOf('ACTIVATION');
    const calme = phases(state).indexOf('RETOUR_CALME');
    state = play({ ...state, ageGroup: 'U15' }, { type: 'MOVE', from: activation, to: calme - 1 });
    expect(editWarnings(state).some((v) => v.rule === 'SPEED_WHEN_FRESH')).toBe(true);
  });
});

describe('retirer un bloc', () => {
  it('retire un bloc ordinaire', () => {
    const state = sessionEditReducer(start(), { type: 'REMOVE', index: 2 });
    expect(state.blocks).toHaveLength(6);
  });

  it('REFUSE de retirer le retour au calme, et dit pourquoi', () => {
    let state = start();
    const calme = phases(state).indexOf('RETOUR_CALME');
    state = sessionEditReducer(state, { type: 'REMOVE', index: calme });
    expect(state.blocks).toHaveLength(7);
    expect(state.notice).toContain('retour au calme');
  });

  it('REFUSE de retirer le dernier bloc de jeu', () => {
    // Le refus dépend de ce qui RESTE : on retire les autres d'abord.
    let state = start();
    for (const phase of ['ACCUEIL', 'JEU_REDUIT', 'JEU_POSITION'] as const) {
      const index = phases(state).indexOf(phase);
      if (index >= 0) state = sessionEditReducer(state, { type: 'REMOVE', index });
    }
    const reste = phases(state).indexOf('SITUATION_REELLE');
    state = sessionEditReducer(state, { type: 'REMOVE', index: reste });
    expect(state.notice).toContain('jeu libre ou réduit');
    expect(phases(state)).toContain('SITUATION_REELLE');
  });
});

describe('durée d’un bloc', () => {
  it('allonge un bloc, et le total suit', () => {
    const avant = plannedMinutes(start());
    const state = sessionEditReducer(start(), { type: 'SET_DURATION', index: 0, minutes: 20 });
    expect(plannedMinutes(state)).toBe(avant - start().blocks[0]!.durationMin + 20);
  });

  it('refuse un bloc trop court ou trop long, plutôt que de le tronquer', () => {
    expect(
      sessionEditReducer(start(), { type: 'SET_DURATION', index: 0, minutes: 1 }).notice,
    ).toContain(String(MIN_BLOCK_MIN));
    expect(
      sessionEditReducer(start(), { type: 'SET_DURATION', index: 0, minutes: 90 }).notice,
    ).toContain(String(MAX_BLOCK_MIN));
  });

  it('refuse une durée qui n’est pas un nombre', () => {
    expect(
      sessionEditReducer(start(), { type: 'SET_DURATION', index: 0, minutes: Number.NaN }).dirty,
    ).toBe(false);
  });
});

describe('remplacer un exercice', () => {
  const rondo = LIBRARY.find((e) => e.defaultPhase === 'ACTIVATION')!;

  it('remplace par un exercice de la MÊME phase', () => {
    let state = start();
    const index = phases(state).indexOf('ACTIVATION');
    const autre = LIBRARY.find(
      (e) =>
        e.defaultPhase === 'ACTIVATION' &&
        e.id !== state.blocks[index]!.exercise?.id &&
        e.ageGroupCodes.includes('U11'),
    )!;
    state = sessionEditReducer(state, { type: 'REPLACE', index, exercise: autre });
    expect(state.blocks[index]!.exercise?.id).toBe(autre.id);
  });

  it('REFUSE un exercice d’une autre phase, et le nomme', () => {
    let state = start();
    const index = phases(state).indexOf('RETOUR_CALME');
    state = sessionEditReducer(state, { type: 'REPLACE', index, exercise: rondo });
    expect(state.notice).toContain(rondo.name);
    expect(state.blocks[index]!.exercise?.id).not.toBe(rondo.id);
  });

  it('REFUSE un exercice qui ne tourne pas avec l’effectif du jour', () => {
    let state = { ...start(), playersPresent: 4 };
    const index = phases(state).indexOf('ACTIVATION');
    const gourmand = LIBRARY.find((e) => e.defaultPhase === 'ACTIVATION' && e.playersMin > 4)!;
    state = sessionEditReducer(state, { type: 'REPLACE', index, exercise: gourmand });
    // Le message donne le CHIFFRE : le coach sait quoi changer sans chercher.
    expect(state.notice).toContain(String(gourmand.playersMin));
    expect(state.notice).toContain('4 présents');
  });

  it('un exercice n’apparaît qu’une fois — par construction, pas par garde-fou', () => {
    // Une séance n'a qu'UN bloc par phase, et un exercice n'appartient qu'à
    // UNE phase : le doublon est impossible sans qu'aucun code l'interdise.
    // Le jour où l'on pourra AJOUTER un bloc, ce test tombera, et il faudra
    // écrire la garde pour de bon.
    let state = start();
    for (let i = 0; i < state.blocks.length; i += 1) {
      for (const exercise of LIBRARY) {
        state = sessionEditReducer(state, { type: 'REPLACE', index: i, exercise });
      }
    }
    const ids = state.blocks.map((b) => b.exercise?.id).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(phases(state)).size).toBe(phases(state).length);
  });

  it('accepte de vider un bloc : un trou assumé reste possible', () => {
    let state = start();
    const index = phases(state).indexOf('TECHNIQUE');
    state = sessionEditReducer(state, { type: 'REPLACE', index, exercise: null });
    expect(state.blocks[index]!.exercise).toBeNull();
  });
});

describe('adapter à l’effectif réel', () => {
  it('signale les exercices qui ne tournent plus, sans les effacer', () => {
    // Effacer le travail du coach au moment où il corrige un chiffre serait la
    // pire des aides : il ne saurait même pas ce qu'il a perdu.
    const avant = start();
    const state = sessionEditReducer(avant, { type: 'SET_PLAYERS', playersPresent: 4 });
    expect(blockedByHeadcount(state).length).toBeGreaterThan(0);
    expect(state.blocks.filter((b) => b.exercise).length).toBe(
      avant.blocks.filter((b) => b.exercise).length,
    );
  });

  it('recalcule les ateliers quand le groupe grossit', () => {
    const state = sessionEditReducer(start(), { type: 'SET_PLAYERS', playersPresent: 30 });
    expect(state.blocks.some((b) => b.groups > 1)).toBe(true);
  });

  it('efface les alertes quand l’effectif redevient suffisant', () => {
    let state = sessionEditReducer(start(), { type: 'SET_PLAYERS', playersPresent: 4 });
    expect(blockedByHeadcount(state).length).toBeGreaterThan(0);
    state = sessionEditReducer(state, { type: 'SET_PLAYERS', playersPresent: 14 });
    expect(blockedByHeadcount(state)).toHaveLength(0);
  });

  it('refuse un effectif impossible', () => {
    expect(
      sessionEditReducer(start(), { type: 'SET_PLAYERS', playersPresent: 0 }).notice,
    ).toContain('au moins un joueur');
    expect(
      sessionEditReducer(start(), { type: 'SET_PLAYERS', playersPresent: 99 }).notice,
    ).toContain('Soixante');
  });

  it('refuse plus de gardiens que de joueurs', () => {
    expect(
      sessionEditReducer(start(), {
        type: 'SET_PLAYERS',
        playersPresent: 5,
        goalkeepersPresent: 9,
      }).notice,
    ).toContain('plus de gardiens');
  });

  it('signale un exercice à gardien quand le gardien manque', () => {
    const gardien = LIBRARY.find((e) => (e.goalkeepers ?? 0) > 0)!;
    expect(
      blockProblem(gardien, { ageGroup: 'U13', playersPresent: 16, goalkeepersPresent: 0 }),
    ).toContain('gardien');
  });
});

describe('annuler', () => {
  it('défait le dernier geste', () => {
    const avant = phases(start());
    const state = play(start(), { type: 'MOVE', from: 0, to: 3 }, { type: 'UNDO' });
    expect(phases(state)).toEqual(avant);
  });

  it('défait aussi un changement d’effectif — CHIFFRE compris', () => {
    // La première version de ce test regardait les ateliers, pas l'effectif :
    // elle passait au vert alors que « Annuler » laissait le nombre de joueurs
    // inchangé. C'est l'écran qui l'a montré, pas le test.
    const state = play(start(), { type: 'SET_PLAYERS', playersPresent: 30 }, { type: 'UNDO' });
    expect(state.playersPresent).toBe(14);
  });

  it('défait un effectif tombé à 6, alertes comprises', () => {
    let state = sessionEditReducer(start(), { type: 'SET_PLAYERS', playersPresent: 6 });
    expect(blockedByHeadcount(state).length).toBeGreaterThan(0);
    state = sessionEditReducer(state, { type: 'UNDO' });
    expect(state.playersPresent).toBe(14);
    expect(blockedByHeadcount(state)).toHaveLength(0);
  });

  it('le dit quand il n’y a rien à annuler', () => {
    expect(sessionEditReducer(start(), { type: 'UNDO' }).notice).toContain('rien à annuler');
  });

  it('n’empile pas les gestes refusés', () => {
    const state = sessionEditReducer(start(), { type: 'REMOVE', index: 6 });
    expect(state.past).toHaveLength(0);
  });
});

describe('enregistrement', () => {
  it('signale le travail non enregistré, puis l’oublie', () => {
    let state = sessionEditReducer(start(), { type: 'MOVE', from: 0, to: 1 });
    expect(state.dirty).toBe(true);
    state = sessionEditReducer(state, { type: 'SAVED' });
    expect(state.dirty).toBe(false);
  });
});

/**
 * L'INVARIANT : aucun geste ne produit une séance que la méthodologie
 * interdit. C'est la promesse de l'écran — le coach réorganise librement, et
 * ce qu'il obtient reste conforme.
 */
describe('invariant : la séance reste conforme', () => {
  const random = (seed: number) => {
    let value = seed;
    return () => {
      value = (value * 1103515245 + 12345) % 2147483648;
      return value / 2147483648;
    };
  };

  it('tient sur 200 parties de 30 gestes tirés au hasard', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const next = random(seed);
      let state = start();

      for (let step = 0; step < 30; step += 1) {
        const index = Math.floor(next() * 8);
        const dice = next();
        const action: SessionEditAction =
          dice < 0.3
            ? { type: 'MOVE', from: index, to: Math.floor(next() * 8) }
            : dice < 0.5
              ? { type: 'REMOVE', index }
              : dice < 0.7
                ? { type: 'SET_DURATION', index, minutes: Math.floor(next() * 80) }
                : dice < 0.85
                  ? {
                      type: 'REPLACE',
                      index,
                      exercise: LIBRARY[Math.floor(next() * LIBRARY.length)] ?? null,
                    }
                  : dice < 0.95
                    ? { type: 'SET_PLAYERS', playersPresent: Math.floor(next() * 40) }
                    : { type: 'UNDO' };
        state = sessionEditReducer(state, action);

        // `editViolations` et non `editWarnings` : le second filtre déjà les
        // règles bloquantes, et l'assertion serait vraie sans rien vérifier.
        const bloquantes = editViolations(state).filter((v) => v.severity === 'BLOCKING');
        if (bloquantes.length > 0) {
          throw new Error(
            `graine ${seed}, geste ${step} : ${bloquantes.map((v) => v.rule).join(', ')}`,
          );
        }
        expect(state.blocks.length).toBeGreaterThan(0);
        expect(state.blocks.every((b) => b.durationMin >= MIN_BLOCK_MIN)).toBe(true);
        expect(state.blocks.every((b) => b.durationMin <= MAX_BLOCK_MIN)).toBe(true);
      }
    }
  });
});

describe('relire une séance ajustée par le navigateur', () => {
  const contexte = { ageGroup: 'U11' as const, playersPresent: 14, goalkeepersPresent: 1 };
  const soumission = (state: SessionEditState) =>
    state.blocks.map((b) => ({
      phase: b.phase,
      durationMin: b.durationMin,
      exerciseId: b.exercise?.id ?? null,
    }));

  it('accepte une séance ajustée normalement', () => {
    const state = sessionEditReducer(start(), { type: 'MOVE', from: 1, to: 3 });
    const result = checkSubmission(soumission(state), LIBRARY, contexte);
    expect(result.ok).toBe(true);
  });

  it('refuse une séance vide', () => {
    const result = checkSubmission([], LIBRARY, contexte);
    expect(result).toMatchObject({ ok: false });
  });

  it('refuse un exercice qui n’est pas dans la bibliothèque servie', () => {
    // La bibliothèque passée ici est déjà filtrée par RLS : un identifiant
    // absent, c'est un exercice d'une autre académie ou un identifiant inventé.
    const result = checkSubmission(
      [{ phase: 'ACCUEIL', durationMin: 10, exerciseId: 'exercice-invente' }],
      LIBRARY,
      contexte,
    );
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.problem).toContain('introuvable');
  });

  it('refuse un exercice glissé dans la mauvaise phase', () => {
    const rondo = LIBRARY.find((e) => e.defaultPhase === 'ACTIVATION')!;
    const result = checkSubmission(
      [{ phase: 'RETOUR_CALME', durationMin: 10, exerciseId: rondo.id }],
      LIBRARY,
      contexte,
    );
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.problem).toContain(rondo.name);
  });

  it('refuse une phase inconnue', () => {
    const result = checkSubmission(
      [{ phase: 'PAUSE_CAFE' as never, durationMin: 10, exerciseId: null }],
      LIBRARY,
      contexte,
    );
    expect(result).toMatchObject({ ok: false });
  });

  it('refuse une durée hors bornes, même si l’écran l’a laissée passer', () => {
    for (const minutes of [0, 1, 200, Number.NaN]) {
      expect(
        checkSubmission(
          [{ phase: 'ACCUEIL', durationMin: minutes, exerciseId: null }],
          LIBRARY,
          contexte,
        ),
      ).toMatchObject({ ok: false });
    }
  });

  it('refuse plus de blocs qu’une séance n’en supporte', () => {
    const trop = Array.from({ length: MAX_BLOCKS + 1 }, () => ({
      phase: 'ACCUEIL' as const,
      durationMin: 10,
      exerciseId: null,
    }));
    expect(checkSubmission(trop, LIBRARY, contexte)).toMatchObject({ ok: false });
  });

  it('refuse le même exercice deux fois, que l’écran ne peut pourtant pas produire', () => {
    // Ici la garde n'est PAS morte : le navigateur envoie ce qu'il veut.
    const rondo = LIBRARY.find((e) => e.defaultPhase === 'ACTIVATION')!;
    const result = checkSubmission(
      [
        { phase: 'ACTIVATION', durationMin: 10, exerciseId: rondo.id },
        { phase: 'ACTIVATION', durationMin: 10, exerciseId: rondo.id },
        { phase: 'JEU_REDUIT', durationMin: 10, exerciseId: null },
        { phase: 'RETOUR_CALME', durationMin: 5, exerciseId: null },
      ],
      LIBRARY,
      contexte,
    );
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.problem).toContain('deux fois');
  });

  it('refuse une séance sans retour au calme, quoi qu’en dise le navigateur', () => {
    const result = checkSubmission(
      [{ phase: 'JEU_REDUIT', durationMin: 20, exerciseId: null }],
      LIBRARY,
      contexte,
    );
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.problem).toContain('retour au calme');
  });

  it('refuse un exercice qui ne tourne pas avec l’effectif annoncé', () => {
    const gourmand = LIBRARY.find((e) => e.playersMin >= 10)!;
    const result = checkSubmission(
      [
        { phase: gourmand.defaultPhase!, durationMin: 15, exerciseId: gourmand.id },
        { phase: 'JEU_REDUIT', durationMin: 15, exerciseId: null },
        { phase: 'RETOUR_CALME', durationMin: 5, exerciseId: null },
      ],
      LIBRARY,
      { ...contexte, playersPresent: 5 },
    );
    expect(result).toMatchObject({ ok: false });
  });
});

describe('la raison du choix', () => {
  it('accompagne un exercice proposé par le moteur', () => {
    const state = start();
    expect(state.blocks.some((b) => b.reasons.length > 0)).toBe(true);
  });

  it('DISPARAÎT dès que le coach choisit lui-même', () => {
    // « Travaille un objectif actif du groupe » sous un exercice que le coach
    // a mis lui-même serait une phrase inventée par l'application.
    let state = start();
    const index = state.blocks.findIndex((b) => b.reasons.length > 0);
    const autre = LIBRARY.find(
      (e) =>
        e.defaultPhase === state.blocks[index]!.phase &&
        e.id !== state.blocks[index]!.exercise?.id &&
        e.ageGroupCodes.includes('U11') &&
        e.playersMin <= 14,
    );
    if (!autre) return;
    state = sessionEditReducer(state, { type: 'REPLACE', index, exercise: autre });
    expect(state.blocks[index]!.reasons).toHaveLength(0);
  });
});
