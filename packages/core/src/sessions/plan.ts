/**
 * Le moteur du Session Studio (phase 6.1, docs/09).
 *
 * Il répond à UNE question, celle que le coach se pose le jeudi soir :
 * « qu'est-ce que je fais demain, avec les joueurs qui seront là ? »
 *
 * TROIS PRINCIPES, ET ILS SE TIENNENT
 *
 *  1. **Le moteur propose, il ne décide pas.** Il rend un plan que le coach
 *     modifie. C'est pourquoi chaque choix porte SA RAISON : un coach qui ne
 *     comprend pas pourquoi un exercice est là le remplace au hasard, et le
 *     studio ne lui aura rien appris.
 *
 *  2. **Un trou reste un trou.** Quand aucun exercice ne convient à une phase,
 *     le bloc reste vide ET dit quel critère l'a vidé. Remplir avec « le moins
 *     mauvais » ferait courir un exercice inadapté à des enfants — et le coach
 *     ne saurait même pas qu'un compromis a été fait à sa place.
 *
 *  3. **Ce qui ne peut pas être vérifié est ANNONCÉ, pas supposé.** Certaines
 *     règles dures de la méthodologie (docs/11 §4) portent sur des propriétés
 *     que la bibliothèque ne décrit pas encore : la part du temps où chaque
 *     enfant a un ballon, la longueur des files d'attente. Le moteur ne les
 *     invente pas et ne les tait pas : il les liste comme non vérifiées.
 *     Inventer un chiffre pour faire passer un garde-fou pédagogique le
 *     désarmerait tout en donnant l'illusion contraire.
 *
 * Le résultat est DÉTERMINISTE : la même demande rend toujours le même plan.
 * Un coach qui recharge son écran doit retrouver sa séance, pas une autre.
 */
import { getAgeGroup, type AgeGroupCode } from '../methodology/age-groups';
import type { DomainCode } from '../methodology/domains';
import {
  buildTimeline,
  type SessionPhase,
  type TimelineBlock,
} from '../methodology/session-phases';
import { validateSession, type RuleViolation, type SessionDraft } from '../methodology/constraints';
import {
  mostLimitingCriterion,
  searchExercises,
  type MismatchReason,
  type SearchableExercise,
} from '../library/exercise-search';

export type ExerciseLevel = 'DECOUVERTE' | 'INTERMEDIAIRE' | 'AVANCE';

export interface PlannableExercise extends SearchableExercise {
  /** Difficulté déclarée. Absente = convient à tous les niveaux. */
  level?: ExerciseLevel | null;
  /** Gardiens nécessaires. 0 par défaut : la plupart des exercices s'en passent. */
  goalkeepers?: number;
}

export interface SessionPlanRequest {
  ageGroup: AgeGroupCode;
  durationMin: number;
  /**
   * L'effectif RÉELLEMENT présent.
   *
   * Et non l'effectif théorique de l'équipe : c'est toute la différence entre
   * une séance qui tourne et une séance qu'on refait sur le parking. Un jeudi
   * de pluie, un groupe de 16 en compte 9.
   */
  playersPresent: number;
  goalkeepersPresent?: number;
  /**
   * Les domaines que le groupe travaille en ce moment.
   *
   * Ils viennent des objectifs actifs (docs/07 §2) : le directeur change une
   * priorité, et le studio de tous les coachs de la catégorie la remonte dès
   * la semaine suivante, sans que personne ait à le leur dire.
   * À défaut, on retombe sur les priorités de la catégorie (docs/11 §5).
   */
  priorityDomains?: readonly DomainCode[];
  /** Exercices déjà faits récemment : proposés en dernier, jamais interdits. */
  recentExerciseIds?: readonly string[];
}

/** Pourquoi CET exercice a été proposé — affiché sous le bloc. */
export type PlanReason =
  | 'OBJECTIF'
  | 'NIVEAU'
  | 'DUREE'
  | 'UN_SEUL_ATELIER'
  | 'NOUVEAU'
  | 'SEUL_CANDIDAT'
  /** Le coach a choisi un modèle : on lui rend SON déroulé, pas un autre. */
  | 'MODELE';

export const PLAN_REASON_LABEL: Record<PlanReason, string> = {
  OBJECTIF: 'travaille un objectif actif du groupe',
  NIVEAU: 'au niveau de la catégorie',
  DUREE: 'tient dans le temps du bloc',
  UN_SEUL_ATELIER: 'tout le groupe en un seul atelier',
  NOUVEAU: 'pas fait récemment',
  SEUL_CANDIDAT: 'seul exercice disponible pour cette phase',
  MODELE: 'vient du modèle',
};

export interface PlannedBlock extends TimelineBlock {
  exercise: PlannableExercise | null;
  reasons: PlanReason[];
  /** Le critère qui a écarté le plus de candidats, quand le bloc reste vide. */
  blockedBy: MismatchReason | null;
  /**
   * Nombre d'ateliers à faire tourner en parallèle pour cet effectif.
   *
   * Un rondo prévu pour 10 joueurs avec 20 présents, ce sont DEUX carrés — et
   * donc deux fois le matériel. Le dire évite l'erreur classique : arriver au
   * terrain avec de quoi en monter un seul.
   */
  groups: number;
  /** Écart entre la durée de l'exercice et celle du bloc, en minutes. */
  durationGapMin: number;
}

export interface UnverifiedRule {
  rule: string;
  messageFr: string;
}

export interface SessionPlan {
  ageGroup: AgeGroupCode;
  durationMin: number;
  blocks: PlannedBlock[];
  /** Violations des règles dures que la bibliothèque permet de trancher. */
  violations: RuleViolation[];
  /** Règles dures que ces données ne permettent PAS de trancher. */
  unverified: UnverifiedRule[];
  /** Domaines prioritaires effectivement couverts par le plan. */
  coveredDomains: DomainCode[];
  missingDomains: DomainCode[];
  /** Phases restées sans exercice. */
  gaps: number;
  /** Total réel des exercices proposés, écarts compris. */
  plannedMin: number;
}

/**
 * Les règles dures tranchables avec les seules données de la bibliothèque.
 *
 * Les autres portent sur des propriétés qu'aucun exercice ne décrit
 * aujourd'hui — part de temps avec un ballon par enfant, longueur des files
 * d'attente, caractère analytique d'un bloc. Elles ne disparaissent pas : le
 * plan les rend dans `unverified`, et l'assistant les posera au coach.
 */
const CHECKABLE_RULES = new Set([
  'YOUNG_MAX_DURATION',
  'AT_LEAST_ONE_GAME_BLOCK',
  'COOLDOWN_REQUIRED',
  'POSITIONAL_GAME_FROM_U13',
  'SPEED_WHEN_FRESH',
]);

const UNVERIFIABLE: Record<string, string> = {
  YOUNG_MIN_BALL_CONTACT:
    'La bibliothèque ne dit pas encore si chaque enfant a son ballon : vérifiez vous-même que la majorité du temps se fait à un ballon par enfant.',
  U7_ANALYTIC_MAX_10MIN:
    'La bibliothèque ne dit pas si un exercice est analytique : vérifiez qu’aucune répétition sans opposition ne dépasse 10 minutes.',
  NO_PHYSICAL_WITHOUT_BALL_BEFORE_U13:
    'La bibliothèque ne dit pas si un exercice est un travail physique sans ballon : à cet âge, il ne doit pas y en avoir.',
  MAX_QUEUE_LENGTH:
    'La bibliothèque ne dit pas la longueur des files d’attente : organisez les ateliers pour qu’aucune ne dépasse 4 joueurs.',
};

/** Le niveau attendu d'une catégorie, déduit de sa complexité (docs/11 §5). */
export function expectedLevel(ageGroup: AgeGroupCode): ExerciseLevel {
  const complexity = getAgeGroup(ageGroup).complexityLevel;
  if (complexity <= 2) return 'DECOUVERTE';
  if (complexity === 3) return 'INTERMEDIAIRE';
  return 'AVANCE';
}

/** Combien d'ateliers en parallèle, pour ne pas laisser d'enfants regarder. */
export function groupsNeeded(playersPresent: number, playersMax: number): number {
  if (playersMax <= 0) return 1;
  return Math.max(1, Math.ceil(playersPresent / playersMax));
}

interface Scored {
  exercise: PlannableExercise;
  score: number;
  reasons: PlanReason[];
}

/**
 * Note un exercice pour un bloc donné.
 *
 * Les poids ne sont pas cosmétiques : l'objectif du groupe pèse plus que tout
 * le reste, parce que c'est la promesse du produit (docs/09, recette n° 5). La
 * durée vient ensuite, puis le confort d'organisation.
 */
function scoreFor(
  exercise: PlannableExercise,
  block: TimelineBlock,
  request: SessionPlanRequest,
  priorities: readonly DomainCode[],
): Scored {
  const reasons: PlanReason[] = [];
  let score = 0;

  if (exercise.domainCode && priorities.includes(exercise.domainCode)) {
    score += 40;
    reasons.push('OBJECTIF');
  }

  if (exercise.level && exercise.level === expectedLevel(request.ageGroup)) {
    score += 10;
    reasons.push('NIVEAU');
  }

  // Proximité de durée : un exercice qui tient pile dans le bloc vaut mieux
  // qu'un qui déborde de dix minutes, même s'il est plus joli.
  const gap = Math.abs(exercise.durationMin - block.durationMin);
  score += Math.max(0, 15 - gap * 2);
  if (gap <= 3) reasons.push('DUREE');

  if (groupsNeeded(request.playersPresent, exercise.playersMax) === 1) {
    score += 5;
    reasons.push('UN_SEUL_ATELIER');
  }

  if ((request.recentExerciseIds ?? []).includes(exercise.id)) {
    // Pénalité, jamais exclusion : un exercice refait vaut mieux qu'un trou.
    score -= 25;
  } else {
    reasons.push('NOUVEAU');
  }

  return { exercise, score, reasons };
}

/**
 * Construit une proposition de séance.
 *
 * Ne lève jamais, sauf sur une durée absurde : un écran qui plante le jeudi
 * soir vaut moins qu'un plan troué qui dit ce qui lui manque.
 */
export function planSession(
  exercises: readonly PlannableExercise[],
  request: SessionPlanRequest,
): SessionPlan {
  const timeline = buildTimeline(request.ageGroup, request.durationMin);
  const group = getAgeGroup(request.ageGroup);
  const priorities: readonly DomainCode[] =
    request.priorityDomains && request.priorityDomains.length > 0
      ? request.priorityDomains
      : (group.priorityDomains as readonly DomainCode[]);

  const blocks: PlannedBlock[] = [];

  for (const block of timeline) {
    const outcome = searchExercises(exercises, {
      ageGroup: request.ageGroup,
      playersPresent: request.playersPresent,
      phase: block.phase,
      // Le studio sait monter plusieurs ateliers, et le dit : voir `groups`.
      allowMultipleGroups: true,
    });

    // Un exercice qui demande un gardien et n'en a pas ne tourne pas : on
    // l'écarte plutôt que de laisser le coach le découvrir sur le terrain.
    //
    // Aucune garde contre les doublons ici : le format ne donne qu'UNE phase
    // par exercice, et deux blocs ne partagent jamais une phase. Un tel
    // garde-fou serait du code qu'aucun test ne peut atteindre — et c'est ce
    // genre de code qui pourrit. Si un exercice portait un jour plusieurs
    // phases, le test « jamais deux fois le même exercice » le dirait.
    const candidates = outcome.matches.filter((exercise) => {
      const needed = exercise.goalkeepers ?? 0;
      return needed === 0 || needed <= (request.goalkeepersPresent ?? 0);
    });

    if (candidates.length === 0) {
      blocks.push({
        ...block,
        exercise: null,
        reasons: [],
        blockedBy: mostLimitingCriterion(outcome),
        groups: 1,
        durationGapMin: 0,
      });
      continue;
    }

    const scored = candidates
      .map((exercise) => scoreFor(exercise, block, request, priorities))
      // Départage par identifiant : sans lui, deux exercices à égalité
      // s'échangeraient d'un chargement à l'autre, et le coach croirait à un
      // bug. Un plan doit être reproductible.
      .sort((a, b) => b.score - a.score || a.exercise.id.localeCompare(b.exercise.id));

    const best = scored[0]!;
    const reasons =
      candidates.length === 1 && best.reasons.length === 0
        ? ['SEUL_CANDIDAT' as const]
        : best.reasons;

    blocks.push({
      ...block,
      exercise: best.exercise,
      reasons,
      blockedBy: null,
      groups: groupsNeeded(request.playersPresent, best.exercise.playersMax),
      durationGapMin: best.exercise.durationMin - block.durationMin,
    });
  }

  const draft: SessionDraft = {
    ageGroup: request.ageGroup,
    durationMin: request.durationMin,
    blocks: blocks.map((b) => ({ phase: b.phase, durationMin: b.durationMin })),
  };
  const all = validateSession(draft);

  const covered = new Set<DomainCode>();
  for (const block of blocks) {
    if (block.exercise?.domainCode && priorities.includes(block.exercise.domainCode)) {
      covered.add(block.exercise.domainCode);
    }
  }

  return {
    ageGroup: request.ageGroup,
    durationMin: request.durationMin,
    blocks,
    violations: all.filter((v) => CHECKABLE_RULES.has(v.rule)),
    unverified: all
      .filter((v) => !CHECKABLE_RULES.has(v.rule) && UNVERIFIABLE[v.rule])
      .map((v) => ({ rule: v.rule, messageFr: UNVERIFIABLE[v.rule]! })),
    coveredDomains: [...covered],
    missingDomains: priorities.filter((d) => !covered.has(d)),
    gaps: blocks.filter((b) => b.exercise === null).length,
    plannedMin: blocks.reduce((sum, b) => sum + (b.exercise?.durationMin ?? b.durationMin), 0),
  };
}

/** Le plan est-il utilisable tel quel ? */
export function isPlanUsable(plan: SessionPlan): boolean {
  return plan.gaps === 0 && !plan.violations.some((v) => v.severity === 'BLOCKING');
}

/** Les phases restées vides, pour que l'écran les nomme plutôt que de les taire. */
export function planGaps(
  plan: SessionPlan,
): { phase: SessionPhase; blockedBy: MismatchReason | null }[] {
  return plan.blocks
    .filter((b) => b.exercise === null)
    .map((b) => ({ phase: b.phase, blockedBy: b.blockedBy }));
}
