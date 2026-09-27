/**
 * L'édition d'une séance proposée (phases 6.4 à 6.6).
 *
 * Le moteur de `plan.ts` PROPOSE ; celui-ci laisse le coach DISPOSER —
 * déplacer un bloc, en retirer un, remplacer un exercice, allonger une phase,
 * et surtout adapter à l'effectif qui arrive vraiment. Séparés parce qu'ils ne
 * répondent pas à la même question : « que faire ? » puis « comment
 * l'ajuster ? ».
 *
 * Pur, sans React ni base : un geste se teste en une ligne. Même raison que
 * pour l'éditeur de schémas, et même règle — le moteur BORNE et REFUSE, il ne
 * corrige jamais en douce, et un refus porte toujours son motif.
 *
 * LA RÈGLE QUI GOUVERNE TOUT LE RESTE
 *
 * Un geste qui produirait une séance interdite par la méthodologie (docs/11
 * §4) est refusé AU MOMENT DU GESTE, avec la phrase de la règle. Laisser le
 * coach réorganiser librement puis lui refuser l'enregistrement à la fin
 * serait cruel : il aurait tout défait sans savoir lequel de ses gestes posait
 * problème.
 */
import type { AgeGroupCode } from '../methodology/age-groups';
import { SESSION_PHASES, type SessionPhase } from '../methodology/session-phases';
import { validateSession, type RuleViolation } from '../methodology/constraints';
import { mismatchReasons, MISMATCH_LABEL } from '../library/exercise-search';
import { groupsNeeded, type PlanReason, type PlannableExercise, type SessionPlan } from './plan';

/** Bornes d'un bloc, en minutes. Au-delà, ce n'est plus une phase de séance. */
export const MIN_BLOCK_MIN = 3;
export const MAX_BLOCK_MIN = 60;

export interface EditableBlock {
  /** Identifiant en base. `null` tant que la séance n'est pas enregistrée. */
  id: string | null;
  phase: SessionPhase;
  labelFr: string;
  durationMin: number;
  exercise: PlannableExercise | null;
  /** Ateliers à monter en parallèle pour l'effectif du jour. */
  groups: number;
  /**
   * Pourquoi le moteur a proposé CET exercice.
   *
   * Vidé dès que le coach en choisit un autre : c'est alors SON choix, et il
   * n'a pas à être justifié par un raisonnement qui ne l'a pas produit.
   * Afficher « travaille un objectif actif du groupe » sous un exercice que
   * le coach a mis lui-même serait une phrase inventée.
   */
  reasons: readonly PlanReason[];
  /**
   * Ce qui cloche pour CE bloc avec l'effectif du jour.
   *
   * Recalculé à chaque changement d'effectif : c'est tout l'intérêt de la
   * phase 6.6. Neuf joueurs au lieu de seize, et trois exercices ne tournent
   * plus — le coach doit le savoir avant d'arriver au terrain, pas pendant.
   */
  problem: string | null;
}

export interface SessionEditState {
  ageGroup: AgeGroupCode;
  /** Durée visée par le coach. Les blocs peuvent s'en écarter, et on le dit. */
  targetMin: number;
  playersPresent: number;
  goalkeepersPresent: number;
  blocks: readonly EditableBlock[];
  notice: string | null;
  /**
   * L'historique garde AUSSI l'effectif, et pas seulement les blocs.
   *
   * Sans lui, annuler un changement d'effectif ne défaisait rien : les blocs
   * étaient les mêmes, seules leurs alertes en dépendaient — et elles se
   * recalculent depuis l'effectif COURANT. Le bouton semblait cassé, et il
   * l'était. Relevé à l'écran, pas dans les tests : le mien regardait à côté.
   */
  past: readonly EditSnapshot[];
  dirty: boolean;
}

export interface EditSnapshot {
  blocks: readonly EditableBlock[];
  playersPresent: number;
  goalkeepersPresent: number;
}

export type SessionEditAction =
  | { type: 'MOVE'; from: number; to: number }
  | { type: 'REMOVE'; index: number }
  | { type: 'SET_DURATION'; index: number; minutes: number }
  | { type: 'REPLACE'; index: number; exercise: PlannableExercise | null }
  | { type: 'SET_PLAYERS'; playersPresent: number; goalkeepersPresent?: number }
  | { type: 'UNDO' }
  | { type: 'DISMISS_NOTICE' }
  | { type: 'SAVED' };

/** Ce qui empêche CET exercice de tourner aujourd'hui, ou `null`. */
export function blockProblem(
  exercise: PlannableExercise | null,
  state: Pick<SessionEditState, 'ageGroup' | 'playersPresent' | 'goalkeepersPresent'>,
): string | null {
  if (!exercise) return null;

  const reasons = mismatchReasons(exercise, {
    ageGroup: state.ageGroup,
    playersPresent: state.playersPresent,
    allowMultipleGroups: true,
  });

  // Le CHIFFRE, et non l'étiquette du critère. « Ne convient plus :
  // l'effectif » laisse le coach chercher ce qu'il doit changer ; « demande
  // au moins 8 joueurs, 6 présents » lui donne la réponse dans la phrase.
  if (reasons.includes('EFFECTIF')) {
    return `Demande au moins ${exercise.playersMin} joueurs, ${state.playersPresent} présents.`;
  }
  if (reasons.length > 0) {
    return `Ne convient plus à ${reasons.map((r) => MISMATCH_LABEL[r]).join(', ')}.`;
  }

  const needed = exercise.goalkeepers ?? 0;
  if (needed > 0 && needed > state.goalkeepersPresent) {
    return `Demande ${needed} gardien(s), ${state.goalkeepersPresent} présent(s).`;
  }
  return null;
}

function withContext(
  blocks: readonly EditableBlock[],
  state: Pick<SessionEditState, 'ageGroup' | 'playersPresent' | 'goalkeepersPresent'>,
): EditableBlock[] {
  return blocks.map((block) => ({
    ...block,
    groups: block.exercise ? groupsNeeded(state.playersPresent, block.exercise.playersMax) : 1,
    problem: blockProblem(block.exercise, state),
  }));
}

/** Reprend un plan proposé pour l'ouvrir à la modification. */
export function editStateFromPlan(
  plan: SessionPlan,
  context: { playersPresent: number; goalkeepersPresent: number },
): SessionEditState {
  const base = {
    ageGroup: plan.ageGroup,
    playersPresent: context.playersPresent,
    goalkeepersPresent: context.goalkeepersPresent,
  };
  return {
    ...base,
    targetMin: plan.durationMin,
    blocks: withContext(
      plan.blocks.map((block) => ({
        id: null,
        phase: block.phase,
        labelFr: block.labelFr,
        durationMin: block.durationMin,
        exercise: block.exercise,
        groups: block.groups,
        reasons: block.reasons,
        problem: null,
      })),
      base,
    ),
    notice: null,
    past: [],
    dirty: false,
  };
}

/** Le total réellement programmé, blocs allongés ou raccourcis compris. */
export function plannedMinutes(state: SessionEditState): number {
  return state.blocks.reduce((sum, block) => sum + block.durationMin, 0);
}

/** Les blocs qui ne tournent pas avec l'effectif du jour. */
export function blockedByHeadcount(state: SessionEditState): EditableBlock[] {
  return state.blocks.filter((block) => block.problem !== null);
}

/**
 * Ce que la méthodologie reproche à cette suite de blocs.
 *
 * On revalide la séance ENTIÈRE après chaque geste plutôt que de vérifier le
 * geste seul : retirer le dernier bloc de jeu n'est interdit qu'en fonction de
 * ce qui reste, pas de ce qu'on retire.
 */
function violationsFor(state: SessionEditState, blocks: readonly EditableBlock[]): RuleViolation[] {
  return validateSession({
    ageGroup: state.ageGroup,
    durationMin: blocks.reduce((sum, b) => sum + b.durationMin, 0),
    blocks: blocks.map((b) => ({ phase: b.phase, durationMin: b.durationMin })),
  });
}

const refuse = (state: SessionEditState, notice: string): SessionEditState => ({
  ...state,
  notice,
});

/** Applique des blocs, sauf s'ils rompent une règle dure. */
function commit(state: SessionEditState, blocks: EditableBlock[]): SessionEditState {
  const blocking = violationsFor(state, blocks).filter((v) => v.severity === 'BLOCKING');
  if (blocking.length > 0) return refuse(state, blocking[0]!.messageFr);

  return {
    ...state,
    blocks: withContext(blocks, state),
    notice: null,
    past: [...state.past, snapshot(state)].slice(-20),
    dirty: true,
  };
}

/** L'état auquel « Annuler » doit ramener. */
const snapshot = (state: SessionEditState): EditSnapshot => ({
  blocks: state.blocks,
  playersPresent: state.playersPresent,
  goalkeepersPresent: state.goalkeepersPresent,
});

export function sessionEditReducer(
  state: SessionEditState,
  action: SessionEditAction,
): SessionEditState {
  switch (action.type) {
    case 'MOVE': {
      const { from, to } = action;
      if (from === to) return state;
      if (from < 0 || from >= state.blocks.length || to < 0 || to >= state.blocks.length) {
        return state;
      }
      const blocks = [...state.blocks];
      const [moved] = blocks.splice(from, 1);
      blocks.splice(to, 0, moved!);
      return commit(state, blocks);
    }

    case 'REMOVE': {
      if (state.blocks.length <= 1) {
        return refuse(state, 'Une séance garde au moins un bloc.');
      }
      const blocks = state.blocks.filter((_, index) => index !== action.index);
      if (blocks.length === state.blocks.length) return state;
      return commit(state, blocks);
    }

    case 'SET_DURATION': {
      const { minutes } = action;
      if (!Number.isFinite(minutes) || minutes < MIN_BLOCK_MIN) {
        return refuse(state, `Un bloc dure au moins ${MIN_BLOCK_MIN} minutes.`);
      }
      if (minutes > MAX_BLOCK_MIN) {
        return refuse(state, `Au-delà de ${MAX_BLOCK_MIN} minutes, ce n’est plus une phase.`);
      }
      const blocks = state.blocks.map((block, index) =>
        index === action.index ? { ...block, durationMin: Math.round(minutes) } : block,
      );
      return commit(state, blocks);
    }

    case 'REPLACE': {
      const target = state.blocks[action.index];
      if (!target) return state;

      if (action.exercise) {
        // Un exercice d'une autre phase dans ce bloc, et la séance ne suit
        // plus la méthodologie sans que rien ne l'ait signalé.
        if (action.exercise.defaultPhase !== target.phase) {
          return refuse(
            state,
            `« ${action.exercise.name} » est un exercice de ${
              action.exercise.defaultPhase ?? 'phase inconnue'
            }, pas de ${target.labelFr.toLowerCase()}.`,
          );
        }
        const problem = blockProblem(action.exercise, state);
        if (problem) return refuse(state, `« ${action.exercise.name} » — ${problem}`);
        // Aucune garde anti-doublon : une séance n'a qu'UN bloc par phase, et
        // un exercice n'appartient qu'à UNE phase — un doublon est impossible
        // par construction. Un tel garde-fou serait du code qu'aucun test ne
        // peut atteindre. Le jour où l'on pourra AJOUTER un bloc, le test
        // « un exercice n'apparaît qu'une fois » tombera, et il faudra
        // l'écrire pour de bon.
      }

      const blocks = state.blocks.map((block, index) =>
        index === action.index ? { ...block, exercise: action.exercise, reasons: [] } : block,
      );
      return commit(state, blocks);
    }

    case 'SET_PLAYERS': {
      const players = action.playersPresent;
      if (!Number.isFinite(players) || players < 1) {
        return refuse(state, 'Indiquez au moins un joueur présent.');
      }
      if (players > 60) return refuse(state, 'Soixante joueurs au maximum sur une séance.');
      const keepers = action.goalkeepersPresent ?? state.goalkeepersPresent;
      if (keepers < 0 || keepers > players) {
        return refuse(state, 'Il ne peut pas y avoir plus de gardiens que de joueurs.');
      }

      // On ne RETIRE pas les exercices devenus impossibles : on les signale.
      // Les effacer ferait disparaître le travail du coach au moment où il
      // corrige un chiffre, et il ne saurait même pas ce qu'il a perdu.
      const next = { ...state, playersPresent: players, goalkeepersPresent: keepers };
      return {
        ...next,
        blocks: withContext(state.blocks, next),
        notice: null,
        past: [...state.past, snapshot(state)].slice(-20),
        dirty: true,
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return refuse(state, 'Il n’y a rien à annuler.');
      const previous = state.past[state.past.length - 1]!;
      const restored = {
        ...state,
        playersPresent: previous.playersPresent,
        goalkeepersPresent: previous.goalkeepersPresent,
      };
      return {
        ...restored,
        blocks: withContext(previous.blocks, restored),
        past: state.past.slice(0, -1),
        notice: null,
        dirty: true,
      };
    }

    case 'DISMISS_NOTICE':
      return { ...state, notice: null };

    case 'SAVED':
      return { ...state, dirty: false, notice: null };

    default:
      return state;
  }
}

/**
 * TOUT ce que la méthodologie reproche à la séance en cours.
 *
 * Exposée à part des avertissements, et c'est délibéré : un test qui ne
 * regarderait que les avertissements ne pourrait JAMAIS voir une règle
 * bloquante, et passerait au vert sans rien vérifier. C'est exactement le
 * piège dans lequel la première version de ces tests est tombée.
 */
export function editViolations(state: SessionEditState): RuleViolation[] {
  return violationsFor(state, state.blocks);
}

/** Les avertissements — ce qui n'interdit pas, mais mérite un coup d'œil. */
export function editWarnings(state: SessionEditState): RuleViolation[] {
  return editViolations(state).filter((v) => v.severity === 'WARNING');
}

/** Au-delà, ce n'est plus une séance, c'est une liste de courses. */
export const MAX_BLOCKS = 12;

export interface SubmittedBlock {
  phase: SessionPhase;
  durationMin: number;
  exerciseId: string | null;
}

export type SubmissionResult =
  { ok: true; blocks: EditableBlock[] } | { ok: false; problem: string };

/**
 * Relit une séance ajustée par le navigateur, avant de l'écrire.
 *
 * L'écran d'ajustement laisse le coach déplacer, retirer, remplacer. Ce qui
 * revient au serveur est donc SA séance, et non plus celle que le moteur avait
 * proposée : on ne peut plus la recalculer pour l'ignorer, il faut la
 * VÉRIFIER.
 *
 * Et la vérifier ici, dans le paquet, et non dans l'action serveur : les mêmes
 * règles doivent valoir à l'écran et à l'écriture. Écrites deux fois, elles
 * finiraient par se contredire, et c'est la version permissive qui gagnerait.
 *
 * Ce que cette fonction NE vérifie pas, parce que d'autres le font mieux :
 * l'appartenance des exercices à l'académie — la bibliothèque qu'on lui passe
 * est déjà filtrée par RLS, et c'est RLS qui a le dernier mot en base.
 */
export function checkSubmission(
  submitted: readonly SubmittedBlock[],
  library: readonly PlannableExercise[],
  context: {
    ageGroup: AgeGroupCode;
    playersPresent: number;
    goalkeepersPresent: number;
  },
): SubmissionResult {
  if (submitted.length === 0) return { ok: false, problem: 'Une séance vide ne s’enregistre pas.' };
  if (submitted.length > MAX_BLOCKS) {
    return { ok: false, problem: `Une séance compte au plus ${MAX_BLOCKS} blocs.` };
  }

  const byId = new Map(library.map((exercise) => [exercise.id, exercise]));
  const blocks: EditableBlock[] = [];
  const seen = new Set<string>();

  for (const [index, raw] of submitted.entries()) {
    const definition = SESSION_PHASES.find((p) => p.phase === raw.phase);
    if (!definition) {
      return { ok: false, problem: `Bloc ${index + 1} : phase inconnue.` };
    }
    if (
      !Number.isFinite(raw.durationMin) ||
      raw.durationMin < MIN_BLOCK_MIN ||
      raw.durationMin > MAX_BLOCK_MIN
    ) {
      return {
        ok: false,
        problem: `Bloc ${index + 1} : une phase dure entre ${MIN_BLOCK_MIN} et ${MAX_BLOCK_MIN} minutes.`,
      };
    }

    let exercise: PlannableExercise | null = null;
    if (raw.exerciseId) {
      exercise = byId.get(raw.exerciseId) ?? null;
      if (!exercise) {
        return { ok: false, problem: `Bloc ${index + 1} : exercice introuvable.` };
      }
      if (exercise.defaultPhase !== raw.phase) {
        return {
          ok: false,
          problem: `« ${exercise.name} » n’est pas un exercice de ${definition.labelFr.toLowerCase()}.`,
        };
      }
      const problem = blockProblem(exercise, context);
      if (problem) return { ok: false, problem: `« ${exercise.name} » — ${problem}` };
      if (seen.has(exercise.id)) {
        return { ok: false, problem: `« ${exercise.name} » apparaît deux fois.` };
      }
      seen.add(exercise.id);
    }

    blocks.push({
      id: null,
      phase: raw.phase,
      labelFr: definition.labelFr,
      durationMin: Math.round(raw.durationMin),
      exercise,
      groups: exercise ? groupsNeeded(context.playersPresent, exercise.playersMax) : 1,
      reasons: [],
      problem: null,
    });
  }

  const blocking = validateSession({
    ageGroup: context.ageGroup,
    durationMin: blocks.reduce((sum, b) => sum + b.durationMin, 0),
    blocks: blocks.map((b) => ({ phase: b.phase, durationMin: b.durationMin })),
  }).filter((v) => v.severity === 'BLOCKING');

  if (blocking.length > 0) return { ok: false, problem: blocking[0]!.messageFr };

  return { ok: true, blocks };
}
