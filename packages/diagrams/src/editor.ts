/**
 * Le moteur de l'éditeur de schémas (phase 5.7, docs/14 §5).
 *
 * TOUT ce qui décide vit ici : poser, déplacer, tracer, supprimer, ajouter une
 * image-clé. Le composant React ne fait que traduire un doigt en action et
 * redessiner le résultat. Ce découpage n'est pas une élégance d'architecture,
 * c'est la seule façon de VÉRIFIER un éditeur : un geste se teste en une ligne
 * ici, alors qu'il demanderait un vrai navigateur et un vrai doigt là-bas.
 *
 * L'INVARIANT, celui qui tient tout le reste :
 *
 *   quelle que soit la suite d'actions reçues, `state.diagram` reste un schéma
 *   que `parseDiagram()` accepte.
 *
 * Il est vérifié par un test qui joue des milliers de gestes au hasard. Sans
 * lui, un éditeur produit tôt ou tard un fichier que le lecteur refuse — et le
 * coach perd son travail après l'avoir fait, ce qui est le pire moment.
 *
 * D'où la règle : on BORNE et on REFUSE, jamais on ne « corrige plus tard ».
 * Un refus n'est pas silencieux : il remplit `notice`, que l'écran affiche.
 * Un éditeur qui ignore un geste sans rien dire passe pour cassé.
 */
import type {
  DiagramCanvas,
  DiagramElement,
  DiagramField,
  FieldKind,
  GamePhase,
  GoalSize,
  Keyframe,
  Motion,
  Orientation,
  Point,
  Team,
  ZonePurpose,
} from './schema';
import { isMovable } from './schema';
import { positionsAt } from './animation';
import { clampCoordinate, clampPoint, fieldGeometry, hitTest } from './geometry';

/** Au-delà, le schéma cesse d'être lisible au bord du terrain. */
export const MAX_ELEMENTS = 40;
/** Décision docs/14 §5 : cinq images-clés suffisent à montrer un principe. */
export const MAX_KEYFRAMES = 5;
export const MAX_ARROW_POINTS = 6;
/** Une zone plus petite que ça est un geste raté, pas une intention. */
export const MIN_ZONE_SIZE = 4;
export const MAX_LABEL = 24;
export const MAX_TEXT = 40;
export const MAX_ALT = 300;

export type EditorTool =
  | 'SELECT'
  | 'PLAYER_A'
  | 'PLAYER_B'
  | 'JOKER'
  | 'GK'
  | 'BALL'
  | 'CONE'
  | 'GOAL'
  | 'TEXT'
  | 'ZONE'
  | 'ARROW';

export interface ToolDefinition {
  tool: EditorTool;
  label: string;
  /** Ce que l'outil fait, en une phrase, pour l'aide de l'écran. */
  hint: string;
}

/** La palette, dans l'ordre où elle s'affiche. */
export const TOOLS: readonly ToolDefinition[] = [
  { tool: 'SELECT', label: 'Sélection', hint: 'Toucher un élément pour le déplacer ou le régler.' },
  { tool: 'PLAYER_A', label: 'Joueur A', hint: 'Toucher le terrain pour poser un joueur violet.' },
  { tool: 'PLAYER_B', label: 'Joueur B', hint: 'Toucher le terrain pour poser un adversaire.' },
  { tool: 'JOKER', label: 'Joker', hint: 'Le joueur qui joue avec les deux équipes.' },
  { tool: 'GK', label: 'Gardien', hint: 'Toucher le terrain pour poser un gardien.' },
  { tool: 'BALL', label: 'Ballon', hint: 'Toucher le terrain pour poser un ballon.' },
  { tool: 'CONE', label: 'Coupelle', hint: 'Délimiter un carré, un couloir, une porte.' },
  { tool: 'GOAL', label: 'But', hint: 'Toucher le terrain pour poser un but.' },
  { tool: 'ZONE', label: 'Zone', hint: 'Glisser pour dessiner une surface.' },
  { tool: 'ARROW', label: 'Flèche', hint: 'Toucher chaque point du trajet, puis « Terminer ».' },
  { tool: 'TEXT', label: 'Texte', hint: 'Poser un mot sur le terrain.' },
];

export interface ElementPatch {
  team?: Team;
  number?: number | null;
  label?: string | null;
  hasBall?: boolean;
  purpose?: ZonePurpose;
  shape?: 'RECT' | 'CIRCLE';
  motion?: Motion;
  size?: GoalSize;
  rotation?: number;
  text?: string;
}

export interface FramePatch {
  phase?: GamePhase | null;
  caption?: string | null;
}

export type EditorAction =
  | { type: 'TOOL'; tool: EditorTool }
  | { type: 'ZONE_PURPOSE'; purpose: ZonePurpose }
  | { type: 'MOTION'; motion: Motion }
  | { type: 'POINTER_DOWN'; at: Point }
  | { type: 'POINTER_MOVE'; at: Point }
  | { type: 'POINTER_UP'; at: Point }
  | { type: 'ARROW_FINISH' }
  | { type: 'CANCEL_DRAFT' }
  | { type: 'SELECT'; id: string | null }
  | { type: 'DELETE_SELECTED' }
  | { type: 'PATCH_SELECTED'; patch: ElementPatch }
  | { type: 'FRAME'; index: number }
  | { type: 'ADD_FRAME' }
  | { type: 'REMOVE_FRAME' }
  | { type: 'PATCH_FRAME'; patch: FramePatch }
  | { type: 'FIELD'; patch: Partial<DiagramField> }
  | { type: 'ALT'; text: string }
  | { type: 'UNDO' }
  | { type: 'DISMISS_NOTICE' }
  | { type: 'SAVED' };

export interface DragState {
  id: string;
  /** Décalage entre le doigt et le point de référence : l'élément ne saute pas sous le doigt. */
  grab: Point;
  /** Position du doigt à la saisie — sert à translater une flèche entière. */
  from: Point;
  /** Les points de la flèche à la saisie, `null` pour tout le reste. */
  points: readonly Point[] | null;
  /** Le geste a-t-il réellement déplacé quelque chose ? */
  moved: boolean;
  /**
   * Le schéma AVANT la saisie.
   *
   * Un déplacement produit des dizaines d'états intermédiaires ; les empiler
   * tous obligerait à appuyer trente fois sur « Annuler » pour défaire un seul
   * geste. On garde donc l'état d'avant, et on ne l'empile qu'au lâcher.
   */
  before: DiagramCanvas;
}

export interface EditorState {
  diagram: DiagramCanvas;
  tool: EditorTool;
  /**
   * La variante du prochain élément posé vit dans l'état, et non dans l'outil :
   * une palette de 20 boutons ne tient pas sur un téléphone.
   */
  zonePurpose: ZonePurpose;
  motion: Motion;
  selectedId: string | null;
  /** 0 = position de départ. 1 et au-delà = image-clé n° 1, 2… */
  frameIndex: number;
  arrowDraft: readonly Point[] | null;
  zoneDraft: { from: Point; to: Point } | null;
  drag: DragState | null;
  /** Ce que l'éditeur a refusé de faire, et pourquoi. */
  notice: string | null;
  past: readonly DiagramCanvas[];
  /** Y a-t-il quelque chose à enregistrer ? */
  dirty: boolean;
}

/** Les dimensions réelles des terrains proposés, en mètres. */
export const FIELD_PRESETS: Record<
  Exclude<FieldKind, 'CUSTOM'>,
  { lengthM: number; widthM: number }
> = {
  FULL: { lengthM: 100, widthM: 64 },
  HALF: { lengthM: 50, widthM: 64 },
  THIRD: { lengthM: 33, widthM: 64 },
};

export const FIELD_LABELS: Record<FieldKind, string> = {
  FULL: 'Terrain entier',
  HALF: 'Demi-terrain',
  THIRD: 'Un tiers',
  CUSTOM: 'Sur mesure',
};

/** Un schéma vide : un carré de 20 × 20 m, la forme la plus courante à l'entraînement. */
export function emptyDiagram(): DiagramCanvas {
  return {
    version: 1,
    field: { kind: 'CUSTOM', lengthM: 20, widthM: 20, orientation: 'HORIZONTAL' },
    elements: [{ id: 'ball1', kind: 'BALL', x: 50, y: 50 }],
    keyframes: [],
  };
}

export function createEditorState(diagram: DiagramCanvas): EditorState {
  return {
    diagram,
    tool: 'SELECT',
    zonePurpose: 'OCCUPER',
    motion: 'PASSE',
    selectedId: null,
    frameIndex: 0,
    arrowDraft: null,
    zoneDraft: null,
    drag: null,
    notice: null,
    past: [],
    dirty: false,
  };
}

/** Nombre d'images de la bande : au moins une, celle du départ. */
export function frameCount(diagram: DiagramCanvas): number {
  return Math.max(1, diagram.keyframes.length);
}

/** L'instant d'une image, dans l'intervalle 0-1 du format. */
export function frameTime(diagram: DiagramCanvas, index: number): number {
  return diagram.keyframes[index]?.t ?? 0;
}

/** Le nom d'une image, tel que le coach le lit. */
export function frameLabel(index: number): string {
  return index === 0 ? 'Départ' : `Image ${index}`;
}

/**
 * Où se trouve chaque élément déplaçable sur l'image affichée.
 *
 * C'est la MÊME fonction que le lecteur : ce que l'éditeur montre est
 * exactement ce que le coach verra à la lecture, sans second calcul.
 */
export function editorPositions(state: EditorState): Map<string, Point> {
  return positionsAt(state.diagram, frameTime(state.diagram, state.frameIndex));
}

export function selectedElement(state: EditorState): DiagramElement | null {
  if (!state.selectedId) return null;
  return state.diagram.elements.find((e) => e.id === state.selectedId) ?? null;
}

const ID_PREFIXES: Record<string, string> = {
  PLAYER_A: 'a',
  PLAYER_B: 'b',
  JOKER: 'j',
  NEUTRE: 'n',
  GK: 'g',
  BALL: 'ball',
  CONE: 'c',
  GOAL: 'but',
  ZONE: 'z',
  ARROW: 'ar',
  TEXT: 't',
};

/**
 * Le prochain identifiant libre, sans hasard.
 *
 * Pas d'UUID : `a1`, `a2`, `z1` se lisent dans le JSON et dans un message
 * d'erreur, et un identifiant tiré au hasard rendrait les tests illisibles.
 */
export function nextId(diagram: DiagramCanvas, family: string): string {
  const prefix = ID_PREFIXES[family] ?? 'e';
  const used = new Set(diagram.elements.map((e) => e.id));
  for (let i = 1; i <= MAX_ELEMENTS + 1; i += 1) {
    const candidate = `${prefix}${i}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${prefix}${Date.now()}`;
}

function clampZone(x: number, y: number, w: number, h: number): Point {
  return {
    x: clampCoordinate(Math.min(x, 100 - w)),
    y: clampCoordinate(Math.min(y, 100 - h)),
  };
}

function newElement(state: EditorState, at: Point): DiagramElement | null {
  const { diagram, tool } = state;
  const point = clampPoint(at);
  switch (tool) {
    case 'PLAYER_A':
      return { id: nextId(diagram, 'PLAYER_A'), kind: 'PLAYER', team: 'A', ...point };
    case 'PLAYER_B':
      return { id: nextId(diagram, 'PLAYER_B'), kind: 'PLAYER', team: 'B', ...point };
    case 'JOKER':
      return { id: nextId(diagram, 'JOKER'), kind: 'PLAYER', team: 'JOKER', ...point };
    case 'GK':
      return { id: nextId(diagram, 'GK'), kind: 'GK', team: 'A', ...point };
    case 'BALL':
      return { id: nextId(diagram, 'BALL'), kind: 'BALL', ...point };
    case 'CONE':
      return { id: nextId(diagram, 'CONE'), kind: 'CONE', ...point };
    case 'GOAL':
      return { id: nextId(diagram, 'GOAL'), kind: 'GOAL', size: 'MINI', rotation: 0, ...point };
    case 'TEXT':
      return { id: nextId(diagram, 'TEXT'), kind: 'TEXT', text: 'Texte', ...point };
    default:
      return null;
  }
}

/** Répartit les instants régulièrement : l'ordre chronologique strict ne peut plus être rompu. */
function retime(keyframes: readonly Keyframe[]): Keyframe[] {
  const count = keyframes.length;
  if (count === 0) return [];
  return keyframes.map((frame, index) => ({
    ...frame,
    t: count === 1 ? 0 : Math.round((index / (count - 1)) * 100) / 100,
  }));
}

interface Commit {
  diagram: DiagramCanvas;
  selectedId?: string | null;
  frameIndex?: number;
  notice?: string | null;
}

/** Applique une modification : empile l'annulation, marque le travail à enregistrer. */
function commit(state: EditorState, next: Commit): EditorState {
  return {
    ...state,
    diagram: next.diagram,
    selectedId: next.selectedId === undefined ? state.selectedId : next.selectedId,
    frameIndex: next.frameIndex === undefined ? state.frameIndex : next.frameIndex,
    notice: next.notice ?? null,
    // 20 pas en arrière : l'annulation illimitée est reportée en V2 (docs/14 §5),
    // et une pile sans borne finit par occuper la mémoire d'un téléphone.
    past: [...state.past, state.diagram].slice(-20),
    dirty: true,
  };
}

const refuse = (state: EditorState, notice: string): EditorState => ({ ...state, notice });

/** Écrit la position d'un élément, sur l'image affichée. */
function moveElement(state: EditorState, id: string, to: Point): EditorState | null {
  const element = state.diagram.elements.find((e) => e.id === id);
  if (!element) return null;
  const point = clampPoint(to);

  if (state.frameIndex === 0) {
    if (element.kind === 'ARROW') return null;
    const elements = state.diagram.elements.map((e) => {
      if (e.id !== id || !('x' in e)) return e;
      if (e.kind === 'ZONE') {
        const inside = clampZone(point.x, point.y, e.w, e.h);
        return { ...e, ...inside };
      }
      return { ...e, ...point };
    });
    return { ...state, diagram: { ...state.diagram, elements }, dirty: true };
  }

  // Sur une image-clé, seul ce que le FORMAT sait déplacer peut bouger : une
  // position écrite pour une flèche ou une zone serait refusée à la relecture.
  if (!isMovable(element)) return null;
  const keyframes = state.diagram.keyframes.map((frame, index) =>
    index === state.frameIndex
      ? { ...frame, positions: { ...frame.positions, [id]: point } }
      : frame,
  );
  return { ...state, diagram: { ...state.diagram, keyframes }, dirty: true };
}

function applyPatch(element: DiagramElement, patch: ElementPatch): DiagramElement | string {
  const next = { ...element } as Record<string, unknown>;

  if (patch.team !== undefined) {
    if (element.kind === 'PLAYER') next.team = patch.team;
    else if (element.kind === 'GK') {
      if (patch.team !== 'A' && patch.team !== 'B') {
        return 'Un gardien appartient à l’équipe A ou à l’équipe B.';
      }
      next.team = patch.team;
    }
  }
  if (patch.number !== undefined && element.kind === 'PLAYER') {
    if (patch.number === null) delete next.number;
    else if (!Number.isInteger(patch.number) || patch.number < 1 || patch.number > 99) {
      return 'Un numéro va de 1 à 99.';
    } else next.number = patch.number;
  }
  if (patch.label !== undefined) {
    const trimmed = (patch.label ?? '').trim();
    if (trimmed.length > MAX_LABEL) return `Une étiquette tient en ${MAX_LABEL} caractères.`;
    if (trimmed === '') delete next.label;
    else next.label = trimmed;
  }
  if (patch.hasBall !== undefined && element.kind === 'PLAYER') {
    if (patch.hasBall) next.hasBall = true;
    else delete next.hasBall;
  }
  if (patch.purpose !== undefined && element.kind === 'ZONE') next.purpose = patch.purpose;
  if (patch.shape !== undefined && element.kind === 'ZONE') next.shape = patch.shape;
  if (patch.motion !== undefined && element.kind === 'ARROW') next.motion = patch.motion;
  if (patch.size !== undefined && element.kind === 'GOAL') next.size = patch.size;
  if (patch.rotation !== undefined && element.kind === 'GOAL') {
    next.rotation = Math.round(patch.rotation) % 360;
  }
  if (patch.text !== undefined && element.kind === 'TEXT') {
    const trimmed = patch.text.trim();
    // Un texte vide dessinerait un élément invisible, que personne ne peut
    // plus sélectionner pour le supprimer.
    if (trimmed === '') return 'Un texte vide ne s’affiche pas : écrivez un mot, ou supprimez-le.';
    if (trimmed.length > MAX_TEXT) return `Un texte tient en ${MAX_TEXT} caractères.`;
    next.text = trimmed;
  }
  return next as unknown as DiagramElement;
}

/**
 * Supprime un élément ET toutes ses positions d'images-clés.
 *
 * Le second point est le piège : une image-clé qui nomme un élément disparu ne
 * fait RIEN, en silence, et `parseDiagram()` refuse le fichier entier. Oublier
 * ce nettoyage rendrait le schéma illisible longtemps après la suppression.
 */
function removeElement(diagram: DiagramCanvas, id: string): DiagramCanvas {
  const keyframes = diagram.keyframes.map((frame) => {
    if (!(id in frame.positions)) return frame;
    const positions = { ...frame.positions };
    delete positions[id];
    return { ...frame, positions };
  });
  return { ...diagram, elements: diagram.elements.filter((e) => e.id !== id), keyframes };
}

const ADD_ON_FRAME =
  'Sur une image-clé, on déplace ce qui existe déjà. Revenez au « Départ » pour ajouter ou retirer un élément.';

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'TOOL':
      return {
        ...state,
        tool: action.tool,
        arrowDraft: null,
        zoneDraft: null,
        notice:
          action.tool !== 'SELECT' && state.frameIndex > 0
            ? ADD_ON_FRAME
            : action.tool === 'ARROW'
              ? 'Touchez chaque point du trajet, puis « Terminer la flèche ».'
              : null,
      };

    case 'ZONE_PURPOSE':
      return { ...state, zonePurpose: action.purpose, notice: null };

    case 'MOTION': {
      const element = selectedElement(state);
      if (element?.kind === 'ARROW') {
        const elements = state.diagram.elements.map((e) =>
          e.id === element.id ? { ...e, motion: action.motion } : e,
        );
        return commit(
          { ...state, motion: action.motion },
          {
            diagram: { ...state.diagram, elements },
          },
        );
      }
      return { ...state, motion: action.motion, notice: null };
    }

    case 'POINTER_DOWN': {
      const at = clampPoint(action.at);
      const geometry = fieldGeometry(state.diagram.field);

      if (state.tool === 'ARROW') {
        if (state.frameIndex > 0) return refuse(state, ADD_ON_FRAME);
        const draft = [...(state.arrowDraft ?? []), at];
        if (draft.length > MAX_ARROW_POINTS) {
          return refuse(state, `Une flèche compte au plus ${MAX_ARROW_POINTS} points.`);
        }
        return { ...state, arrowDraft: draft, notice: null };
      }

      if (state.tool === 'ZONE') {
        if (state.frameIndex > 0) return refuse(state, ADD_ON_FRAME);
        return { ...state, zoneDraft: { from: at, to: at }, notice: null };
      }

      if (state.tool !== 'SELECT') {
        if (state.frameIndex > 0) return refuse(state, ADD_ON_FRAME);
        if (state.diagram.elements.length >= MAX_ELEMENTS) {
          return refuse(
            state,
            `Ce schéma compte déjà ${MAX_ELEMENTS} éléments : au-delà, plus personne ne le lit.`,
          );
        }
        const element = newElement(state, at);
        if (!element) return state;
        return commit(state, {
          diagram: { ...state.diagram, elements: [...state.diagram.elements, element] },
          selectedId: element.id,
        });
      }

      const positions = editorPositions(state);
      const hit = hitTest(state.diagram, positions, at, geometry);
      if (!hit) return { ...state, selectedId: null, drag: null, notice: null };

      const element = state.diagram.elements.find((e) => e.id === hit)!;
      if (state.frameIndex > 0 && !isMovable(element)) {
        return {
          ...state,
          selectedId: hit,
          drag: null,
          notice:
            'Une flèche, une zone, un but et un texte sont dessinés une fois pour tout le schéma : ils ne se déplacent pas d’une image à l’autre.',
        };
      }

      let grab: Point = { x: 0, y: 0 };
      let points: readonly Point[] | null = null;
      if (element.kind === 'ARROW') {
        points = element.points;
      } else if ('x' in element) {
        const current = positions.get(element.id) ?? { x: element.x, y: element.y };
        grab = { x: current.x - at.x, y: current.y - at.y };
      }
      return {
        ...state,
        selectedId: hit,
        drag: { id: hit, grab, from: at, points, moved: false, before: state.diagram },
        notice: null,
      };
    }

    case 'POINTER_MOVE': {
      const at = clampPoint(action.at);
      if (state.zoneDraft) return { ...state, zoneDraft: { ...state.zoneDraft, to: at } };
      if (!state.drag) return state;

      const { drag } = state;
      if (drag.points) {
        // Une flèche se translate d'un bloc : on borne le DÉPLACEMENT, pas
        // chaque point, sinon la flèche se déforme en arrivant au bord.
        let dx = at.x - drag.from.x;
        let dy = at.y - drag.from.y;
        for (const point of drag.points) {
          dx = Math.min(dx, 100 - point.x);
          dx = Math.max(dx, -point.x);
          dy = Math.min(dy, 100 - point.y);
          dy = Math.max(dy, -point.y);
        }
        const elements = state.diagram.elements.map((e) =>
          e.id === drag.id && e.kind === 'ARROW'
            ? {
                ...e,
                points: drag.points!.map((p) => clampPoint({ x: p.x + dx, y: p.y + dy })),
              }
            : e,
        );
        return {
          ...state,
          diagram: { ...state.diagram, elements },
          drag: { ...drag, moved: true },
          dirty: true,
        };
      }

      const moved = moveElement(state, drag.id, {
        x: at.x + drag.grab.x,
        y: at.y + drag.grab.y,
      });
      if (!moved) return state;
      return { ...moved, drag: { ...drag, moved: true } };
    }

    case 'POINTER_UP': {
      if (state.zoneDraft) {
        const { from, to } = state.zoneDraft;
        const w = Math.abs(to.x - from.x);
        const h = Math.abs(to.y - from.y);
        if (w < MIN_ZONE_SIZE || h < MIN_ZONE_SIZE) {
          return {
            ...state,
            zoneDraft: null,
            notice: `Zone trop petite : glissez sur au moins ${MIN_ZONE_SIZE} unités dans chaque sens.`,
          };
        }
        if (state.diagram.elements.length >= MAX_ELEMENTS) {
          return {
            ...state,
            zoneDraft: null,
            notice: `Ce schéma compte déjà ${MAX_ELEMENTS} éléments.`,
          };
        }
        // Un glissement vers la gauche donnerait une largeur négative, que le
        // format refuse : on normalise au lieu de laisser passer.
        const inside = clampZone(Math.min(from.x, to.x), Math.min(from.y, to.y), w, h);
        const zone: DiagramElement = {
          id: nextId(state.diagram, 'ZONE'),
          kind: 'ZONE',
          shape: 'RECT',
          purpose: state.zonePurpose,
          x: inside.x,
          y: inside.y,
          w: clampCoordinate(w),
          h: clampCoordinate(h),
        };
        return commit(
          { ...state, zoneDraft: null },
          {
            diagram: { ...state.diagram, elements: [...state.diagram.elements, zone] },
            selectedId: zone.id,
          },
        );
      }

      if (!state.drag) return state;
      const { moved, before } = state.drag;
      // Un déplacement s'annule d'un seul coup, et non image par image : on
      // n'empile l'annulation qu'au lâcher, avec l'état d'AVANT la saisie.
      if (!moved) return { ...state, drag: null };
      return {
        ...state,
        drag: null,
        past: [...state.past, before].slice(-20),
        dirty: true,
      };
    }

    case 'ARROW_FINISH': {
      const draft = state.arrowDraft;
      if (!draft || draft.length < 2) {
        return refuse(state, 'Une flèche demande au moins deux points : le départ et l’arrivée.');
      }
      if (state.diagram.elements.length >= MAX_ELEMENTS) {
        return {
          ...state,
          arrowDraft: null,
          notice: `Ce schéma compte déjà ${MAX_ELEMENTS} éléments.`,
        };
      }
      const arrow: DiagramElement = {
        id: nextId(state.diagram, 'ARROW'),
        kind: 'ARROW',
        motion: state.motion,
        points: draft.map(clampPoint),
      };
      return commit(
        { ...state, arrowDraft: null },
        {
          diagram: { ...state.diagram, elements: [...state.diagram.elements, arrow] },
          selectedId: arrow.id,
        },
      );
    }

    case 'CANCEL_DRAFT':
      return { ...state, arrowDraft: null, zoneDraft: null, notice: null };

    case 'SELECT':
      return { ...state, selectedId: action.id, notice: null };

    case 'DELETE_SELECTED': {
      if (!state.selectedId) return refuse(state, 'Sélectionnez d’abord un élément.');
      if (state.frameIndex > 0) return refuse(state, ADD_ON_FRAME);
      if (state.diagram.elements.length <= 1) {
        return refuse(
          state,
          'Un schéma sans aucun élément ne montre rien : il en reste toujours un.',
        );
      }
      return commit(state, {
        diagram: removeElement(state.diagram, state.selectedId),
        selectedId: null,
      });
    }

    case 'PATCH_SELECTED': {
      const element = selectedElement(state);
      if (!element) return refuse(state, 'Sélectionnez d’abord un élément.');
      const result = applyPatch(element, action.patch);
      if (typeof result === 'string') return refuse(state, result);
      const elements = state.diagram.elements.map((e) => (e.id === element.id ? result : e));
      return commit(state, { diagram: { ...state.diagram, elements } });
    }

    case 'FRAME': {
      const count = frameCount(state.diagram);
      if (action.index < 0 || action.index >= count) return state;
      return {
        ...state,
        frameIndex: action.index,
        arrowDraft: null,
        zoneDraft: null,
        notice: null,
      };
    }

    case 'ADD_FRAME': {
      const existing = state.diagram.keyframes;
      if (existing.length >= MAX_KEYFRAMES) {
        return refuse(
          state,
          `Cinq images suffisent à montrer un principe. Au-delà, on filme une séance plutôt que de la dessiner.`,
        );
      }
      // Le départ n'a pas de positions : rien n'a encore bougé. C'est
      // exactement ce que dit le format — `positions` ne nomme que ce qui bouge.
      const base: Keyframe[] =
        existing.length === 0
          ? [
              { t: 0, positions: {} },
              { t: 1, positions: {} },
            ]
          : [...existing, { t: 1, positions: {} }];
      const keyframes = retime(base);
      return commit(
        { ...state, tool: 'SELECT' },
        {
          diagram: { ...state.diagram, keyframes },
          frameIndex: keyframes.length - 1,
          notice: 'Déplacez les joueurs : l’application dessine le trajet entre les images.',
        },
      );
    }

    case 'REMOVE_FRAME': {
      if (state.frameIndex === 0) {
        return refuse(
          state,
          'La position de départ ne se supprime pas : c’est le schéma lui-même.',
        );
      }
      const remaining = state.diagram.keyframes.filter((_, i) => i !== state.frameIndex);
      // Une seule image-clé n'anime rien, et le format la refuse : on
      // repasse alors en schéma fixe plutôt que d'écrire un fichier invalide.
      const keyframes = remaining.length <= 1 ? [] : retime(remaining);
      return commit(state, {
        diagram: { ...state.diagram, keyframes },
        frameIndex: Math.min(
          state.frameIndex,
          Math.max(0, frameCount({ ...state.diagram, keyframes }) - 1),
        ),
      });
    }

    case 'PATCH_FRAME': {
      if (state.diagram.keyframes.length === 0) {
        return refuse(
          state,
          'Ce schéma est fixe. Ajoutez une image pour décrire une phase de jeu.',
        );
      }
      const keyframes = state.diagram.keyframes.map((frame, index) => {
        if (index !== state.frameIndex) return frame;
        const next: Keyframe = { ...frame };
        if (action.patch.phase !== undefined) {
          if (action.patch.phase === null) delete next.phase;
          else next.phase = action.patch.phase;
        }
        if (action.patch.caption !== undefined) {
          const trimmed = (action.patch.caption ?? '').trim();
          if (trimmed === '') delete next.caption;
          else next.caption = trimmed.slice(0, 120);
        }
        return next;
      });
      return commit(state, { diagram: { ...state.diagram, keyframes } });
    }

    case 'FIELD': {
      const current = state.diagram.field;
      const kind = action.patch.kind ?? current.kind;
      const preset = kind === 'CUSTOM' ? null : FIELD_PRESETS[kind];
      const lengthM = action.patch.lengthM ?? preset?.lengthM ?? current.lengthM;
      const widthM = action.patch.widthM ?? preset?.widthM ?? current.widthM;
      if (!Number.isFinite(lengthM) || !Number.isFinite(widthM) || lengthM < 5 || widthM < 5) {
        return refuse(state, 'Un terrain mesure au moins 5 mètres dans chaque sens.');
      }
      if (lengthM > 120 || widthM > 120) {
        return refuse(state, 'Un terrain de football ne dépasse pas 120 mètres.');
      }
      const orientation: Orientation = action.patch.orientation ?? current.orientation;
      return commit(state, {
        diagram: {
          ...state.diagram,
          field: { kind, lengthM: Math.round(lengthM), widthM: Math.round(widthM), orientation },
        },
      });
    }

    case 'ALT': {
      const trimmed = action.text.trim().slice(0, MAX_ALT);
      const diagram = { ...state.diagram };
      if (trimmed === '') delete diagram.alt;
      else diagram.alt = trimmed;
      return commit(state, { diagram });
    }

    case 'UNDO': {
      if (state.past.length === 0) return refuse(state, 'Il n’y a rien à annuler.');
      const past = state.past.slice(0, -1);
      return {
        ...state,
        diagram: state.past[state.past.length - 1]!,
        past,
        selectedId: null,
        drag: null,
        arrowDraft: null,
        zoneDraft: null,
        frameIndex: 0,
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
