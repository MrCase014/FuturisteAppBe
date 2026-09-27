/**
 * Les modèles de séance (phase 6.7).
 *
 * Un coach qui a trouvé SA séance de rentrée veut la rejouer en janvier, et
 * la donner à son collègue. Un modèle est cela : le déroulé, sans la date ni
 * l'équipe — ce qui se répète, débarrassé de ce qui ne se répète pas.
 *
 * Il est rangé en `jsonb`, donc la base garantit du JSON et RIEN de plus.
 * `parseTemplateBlocks()` rend des ERREURS plutôt qu'un booléen, comme le
 * lecteur de schémas : un modèle abîmé doit dire ce qui cloche, pas
 * disparaître de la liste sans un mot.
 */
import type { AgeGroupCode } from '../methodology/age-groups';
import { SESSION_PHASES, type SessionPhase } from '../methodology/session-phases';
import { MAX_BLOCK_MIN, MIN_BLOCK_MIN, type SubmittedBlock } from './edit';
import {
  groupsNeeded,
  type PlanReason,
  type PlannableExercise,
  type PlannedBlock,
  type SessionPlan,
} from './plan';

export interface TemplateIssue {
  path: string;
  message: string;
}

export type TemplateParseResult =
  { ok: true; blocks: SubmittedBlock[] } | { ok: false; issues: TemplateIssue[] };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Relit le déroulé d'un modèle.
 *
 * Volontairement TOLÉRANT sur l'exercice, STRICT sur la structure : un
 * exercice retiré de la bibliothèque depuis l'enregistrement du modèle ne doit
 * pas rendre le modèle entier illisible — le bloc devient simplement vide, et
 * le coach le remplit. Une phase inconnue, elle, casse le déroulé : on refuse.
 */
export function parseTemplateBlocks(raw: unknown): TemplateParseResult {
  const issues: TemplateIssue[] = [];

  if (!Array.isArray(raw)) {
    return { ok: false, issues: [{ path: '', message: 'déroulé attendu (liste de blocs)' }] };
  }
  if (raw.length === 0) {
    return { ok: false, issues: [{ path: '', message: 'un modèle vide ne sert à rien' }] };
  }

  const blocks: SubmittedBlock[] = [];

  raw.forEach((entry, index) => {
    const where = `blocs[${index}]`;
    if (!isObject(entry)) {
      issues.push({ path: where, message: 'bloc attendu' });
      return;
    }
    const phase = entry.phase;
    if (typeof phase !== 'string' || !SESSION_PHASES.some((p) => p.phase === phase)) {
      issues.push({ path: `${where}.phase`, message: `phase inconnue : ${String(phase)}` });
      return;
    }
    const duration = entry.durationMin;
    if (typeof duration !== 'number' || !Number.isFinite(duration)) {
      issues.push({ path: `${where}.durationMin`, message: 'durée manquante ou non numérique' });
      return;
    }
    if (duration < MIN_BLOCK_MIN || duration > MAX_BLOCK_MIN) {
      issues.push({
        path: `${where}.durationMin`,
        message: `${duration} min est hors des bornes (${MIN_BLOCK_MIN} à ${MAX_BLOCK_MIN})`,
      });
      return;
    }
    blocks.push({
      phase: phase as SessionPhase,
      durationMin: Math.round(duration),
      // Un identifiant qui n'est plus dans la bibliothèque sera résolu à null
      // au moment de bâtir la séance : le bloc reste, vide, et le coach voit
      // qu'il y avait quelque chose là.
      exerciseId: typeof entry.exerciseId === 'string' ? entry.exerciseId : null,
    });
  });

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, blocks };
}

/** Ce qu'on range dans le modèle : le déroulé, et rien de nominatif. */
export function templateBlocksFrom(
  blocks: readonly { phase: SessionPhase; durationMin: number; exerciseId: string | null }[],
): SubmittedBlock[] {
  return blocks.map((block) => ({
    phase: block.phase,
    durationMin: block.durationMin,
    exerciseId: block.exerciseId,
  }));
}

export const MAX_TEMPLATE_NAME = 60;

/** Ce qui cloche dans le nom d'un modèle, ou `null`. */
export function templateNameProblem(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 3) return 'Donnez un nom d’au moins trois caractères.';
  if (trimmed.length > MAX_TEMPLATE_NAME) {
    return `Un nom de modèle tient en ${MAX_TEMPLATE_NAME} caractères.`;
  }
  return null;
}

/**
 * Bâtit une séance à partir d'un modèle, pour l'ouvrir à l'ajustement.
 *
 * Le moteur de sélection n'intervient PAS : le coach a choisi ce modèle, on
 * lui rend son déroulé, pas un autre. C'est aussi pourquoi chaque bloc porte
 * la raison « vient du modèle » — et non un raisonnement qui ne l'a pas
 * produit.
 *
 * Un exercice disparu de la bibliothèque laisse son bloc VIDE, avec sa phase
 * et sa durée. Le coach voit qu'il y avait quelque chose là, et le remplit.
 */
export function planFromTemplate(
  blocks: readonly SubmittedBlock[],
  library: readonly PlannableExercise[],
  request: { ageGroup: AgeGroupCode; playersPresent: number; name?: string },
): SessionPlan {
  const byId = new Map(library.map((exercise) => [exercise.id, exercise]));
  const labels = new Map(SESSION_PHASES.map((p) => [p.phase, p.labelFr]));
  const orders = new Map(SESSION_PHASES.map((p) => [p.phase, p.orderIndex]));

  const planned: PlannedBlock[] = blocks.map((block) => {
    const exercise = block.exerciseId ? (byId.get(block.exerciseId) ?? null) : null;
    return {
      phase: block.phase,
      orderIndex: orders.get(block.phase) ?? 0,
      labelFr: labels.get(block.phase) ?? block.phase,
      durationMin: block.durationMin,
      exercise,
      reasons: exercise ? (['MODELE'] as PlanReason[]) : [],
      // Un bloc vide vient d'un exercice disparu, pas d'une recherche
      // infructueuse : aucun critère n'est en cause.
      blockedBy: null,
      groups: exercise ? groupsNeeded(request.playersPresent, exercise.playersMax) : 1,
      durationGapMin: exercise ? exercise.durationMin - block.durationMin : 0,
    };
  });

  return {
    ageGroup: request.ageGroup,
    durationMin: planned.reduce((sum, block) => sum + block.durationMin, 0),
    blocks: planned,
    violations: [],
    unverified: [],
    coveredDomains: [],
    missingDomains: [],
    gaps: planned.filter((block) => block.exercise === null).length,
    plannedMin: planned.reduce((sum, block) => sum + block.durationMin, 0),
  };
}
