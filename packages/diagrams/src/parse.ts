/**
 * Validation d'un schéma.
 *
 * Le canevas arrive d'une colonne `jsonb` : la base garantit que c'est du
 * JSON, pas que c'est un schéma. Sans cette étape, un fichier abîmé ferait
 * planter la fiche d'exercice entière — au bord du terrain, un dimanche
 * matin, sans personne pour corriger.
 *
 * D'où le choix de rendre des ERREURS et non un booléen : l'écran peut dire
 * ce qui ne va pas, et l'éditeur de la phase 5.7 réutilisera exactement les
 * mêmes messages. Une règle de validation écrite deux fois finit par dire
 * deux choses différentes.
 */
import type { DiagramCanvas, DiagramElement, ElementKind, Keyframe, Point } from './schema';
import { MOVABLE_KINDS } from './schema';

export interface DiagramIssue {
  /** Où, dans le fichier : `elements[2].x`, `keyframes[1].positions.a7`… */
  path: string;
  message: string;
}

export type ParseResult =
  { ok: true; diagram: DiagramCanvas } | { ok: false; issues: DiagramIssue[] };

const ELEMENT_KINDS: readonly ElementKind[] = [
  'PLAYER',
  'GK',
  'BALL',
  'CONE',
  'GOAL',
  'ZONE',
  'ARROW',
  'TEXT',
];

const TEAMS = ['A', 'B', 'JOKER', 'NEUTRE'];
const ZONE_PURPOSES = ['OCCUPER', 'PROTEGER', 'INTERDITE', 'CIBLE', 'NEUTRE'];
const MOTIONS = ['COURSE', 'PASSE', 'CONDUITE', 'TIR', 'PRESSING'];
const PHASES = ['POSSESSION', 'PERTE', 'RECUPERATION', 'TRANSITION'];
const FIELD_KINDS = ['FULL', 'HALF', 'THIRD', 'CUSTOM'];
const ORIENTATIONS = ['HORIZONTAL', 'VERTICAL'];
const GOAL_SIZES = ['MINI', 'SMALL', 'FULL'];

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Une coordonnée est un pourcentage du terrain : hors de 0-100, elle sort du cadre. */
function checkCoordinate(value: unknown, path: string, issues: DiagramIssue[]): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({ path, message: 'coordonnée manquante ou non numérique' });
    return;
  }
  if (value < 0 || value > 100) {
    issues.push({ path, message: `${value} est hors du terrain (0 à 100)` });
  }
}

function checkPoint(value: unknown, path: string, issues: DiagramIssue[]): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'point attendu, sous la forme { x, y }' });
    return;
  }
  checkCoordinate(value.x, `${path}.x`, issues);
  checkCoordinate(value.y, `${path}.y`, issues);
}

function checkEnum(
  value: unknown,
  allowed: readonly string[],
  path: string,
  issues: DiagramIssue[],
): void {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    issues.push({ path, message: `valeur attendue parmi : ${allowed.join(', ')}` });
  }
}

function checkElement(raw: unknown, path: string, issues: DiagramIssue[]): string | null {
  if (!isObject(raw)) {
    issues.push({ path, message: 'élément attendu' });
    return null;
  }
  const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : null;
  if (!id) issues.push({ path: `${path}.id`, message: 'identifiant manquant' });

  if (typeof raw.kind !== 'string' || !ELEMENT_KINDS.includes(raw.kind as ElementKind)) {
    issues.push({ path: `${path}.kind`, message: `type inconnu : ${String(raw.kind)}` });
    return id;
  }

  const kind = raw.kind as ElementKind;

  // ARROW porte une ligne brisée, ZONE une surface : ni l'une ni l'autre n'a
  // de position ponctuelle au même sens que les autres.
  if (kind === 'ARROW') {
    if (!Array.isArray(raw.points) || raw.points.length < 2) {
      issues.push({ path: `${path}.points`, message: 'une flèche demande au moins 2 points' });
    } else {
      raw.points.forEach((p, i) => checkPoint(p, `${path}.points[${i}]`, issues));
    }
    checkEnum(raw.motion, MOTIONS, `${path}.motion`, issues);
    return id;
  }

  checkCoordinate(raw.x, `${path}.x`, issues);
  checkCoordinate(raw.y, `${path}.y`, issues);

  switch (kind) {
    case 'PLAYER':
      checkEnum(raw.team, TEAMS, `${path}.team`, issues);
      break;
    case 'GK':
      checkEnum(raw.team, ['A', 'B'], `${path}.team`, issues);
      break;
    case 'ZONE':
      checkEnum(raw.shape, ['RECT', 'CIRCLE'], `${path}.shape`, issues);
      checkEnum(raw.purpose, ZONE_PURPOSES, `${path}.purpose`, issues);
      if (typeof raw.w !== 'number' || raw.w <= 0) {
        issues.push({ path: `${path}.w`, message: 'largeur attendue, strictement positive' });
      }
      if (typeof raw.h !== 'number' || raw.h <= 0) {
        issues.push({ path: `${path}.h`, message: 'hauteur attendue, strictement positive' });
      }
      break;
    case 'GOAL':
      checkEnum(raw.size, GOAL_SIZES, `${path}.size`, issues);
      if (typeof raw.rotation !== 'number') {
        issues.push({ path: `${path}.rotation`, message: 'rotation attendue, en degrés' });
      }
      break;
    case 'TEXT':
      if (typeof raw.text !== 'string' || raw.text.trim() === '') {
        issues.push({ path: `${path}.text`, message: 'texte vide' });
      }
      break;
    default:
      break;
  }
  return id;
}

function checkKeyframe(
  raw: unknown,
  path: string,
  movableIds: Set<string>,
  issues: DiagramIssue[],
): number | null {
  if (!isObject(raw)) {
    issues.push({ path, message: 'image-clé attendue' });
    return null;
  }
  let t: number | null = null;
  if (typeof raw.t !== 'number' || !Number.isFinite(raw.t)) {
    issues.push({ path: `${path}.t`, message: 'instant manquant ou non numérique' });
  } else if (raw.t < 0 || raw.t > 1) {
    issues.push({ path: `${path}.t`, message: `${raw.t} est hors de l'intervalle 0 à 1` });
  } else {
    t = raw.t;
  }

  if (raw.phase !== undefined) checkEnum(raw.phase, PHASES, `${path}.phase`, issues);

  if (!isObject(raw.positions)) {
    issues.push({ path: `${path}.positions`, message: 'positions attendues' });
    return t;
  }

  for (const [elementId, point] of Object.entries(raw.positions)) {
    const where = `${path}.positions.${elementId}`;
    // Le cas le plus coûteux à diagnostiquer sur le terrain : une image-clé
    // qui déplace un élément inexistant ne fait RIEN, en silence. On refuse.
    if (!movableIds.has(elementId)) {
      issues.push({
        path: where,
        message: `aucun élément déplaçable ne porte l'identifiant « ${elementId} »`,
      });
    }
    checkPoint(point, where, issues);
  }
  return t;
}

/**
 * Lit un canevas venu de la base ou d'un fichier.
 *
 * Ne lève jamais : rend soit le schéma, soit la liste de ce qui cloche.
 */
export function parseDiagram(raw: unknown): ParseResult {
  const issues: DiagramIssue[] = [];

  if (!isObject(raw)) {
    return { ok: false, issues: [{ path: '', message: 'schéma attendu (objet JSON)' }] };
  }

  if (raw.version !== 1) {
    issues.push({
      path: 'version',
      message: `version ${String(raw.version)} inconnue — cette application lit la version 1`,
    });
  }

  if (!isObject(raw.field)) {
    issues.push({ path: 'field', message: 'terrain manquant' });
  } else {
    checkEnum(raw.field.kind, FIELD_KINDS, 'field.kind', issues);
    checkEnum(raw.field.orientation, ORIENTATIONS, 'field.orientation', issues);
    for (const dim of ['lengthM', 'widthM'] as const) {
      const value = raw.field[dim];
      if (typeof value !== 'number' || value <= 0) {
        issues.push({ path: `field.${dim}`, message: 'dimension attendue, en mètres' });
      }
    }
  }

  const movableIds = new Set<string>();
  const seenIds = new Set<string>();

  if (!Array.isArray(raw.elements)) {
    issues.push({ path: 'elements', message: 'liste d’éléments attendue' });
  } else {
    if (raw.elements.length === 0) {
      issues.push({ path: 'elements', message: 'un schéma sans aucun élément ne montre rien' });
    }
    raw.elements.forEach((element, i) => {
      const id = checkElement(element, `elements[${i}]`, issues);
      if (!id) return;
      if (seenIds.has(id)) {
        issues.push({ path: `elements[${i}].id`, message: `identifiant en double : « ${id} »` });
      }
      seenIds.add(id);
      if (
        isObject(element) &&
        typeof element.kind === 'string' &&
        MOVABLE_KINDS.includes(element.kind as ElementKind)
      ) {
        movableIds.add(id);
      }
    });
  }

  if (!Array.isArray(raw.keyframes)) {
    issues.push({ path: 'keyframes', message: 'liste d’images-clés attendue ([] si schéma fixe)' });
  } else {
    const times: number[] = [];
    raw.keyframes.forEach((frame, i) => {
      const t = checkKeyframe(frame, `keyframes[${i}]`, movableIds, issues);
      if (t !== null) times.push(t);
    });
    // Une animation qui revient en arrière n'est pas une animation : on
    // exige l'ordre chronologique plutôt que de trier en silence, pour que
    // l'auteur voie son erreur plutôt qu'un résultat inattendu.
    for (let i = 1; i < times.length; i += 1) {
      if (times[i]! <= times[i - 1]!) {
        issues.push({
          path: `keyframes[${i}].t`,
          message: 'les images-clés doivent être en ordre chronologique strict',
        });
      }
    }
    if (raw.keyframes.length === 1) {
      issues.push({
        path: 'keyframes',
        message: 'une seule image-clé n’anime rien : mettre [] ou au moins 2',
      });
    }
  }

  if (raw.legend !== undefined) {
    if (!Array.isArray(raw.legend)) {
      issues.push({ path: 'legend', message: 'légende attendue sous forme de liste' });
    } else {
      raw.legend.forEach((entry, i) => {
        if (
          !isObject(entry) ||
          typeof entry.label !== 'string' ||
          typeof entry.color !== 'string'
        ) {
          issues.push({ path: `legend[${i}]`, message: 'entrée { label, color } attendue' });
        }
      });
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, diagram: raw as unknown as DiagramCanvas };
}

/** Les éléments effectivement déplacés par au moins une image-clé. */
export function animatedElementIds(diagram: DiagramCanvas): Set<string> {
  const ids = new Set<string>();
  for (const frame of diagram.keyframes) {
    for (const id of Object.keys(frame.positions)) ids.add(id);
  }
  return ids;
}

export type { DiagramCanvas, DiagramElement, Keyframe, Point };
