import { describe, expect, it } from 'vitest';
import {
  MAX_ELEMENTS,
  MAX_KEYFRAMES,
  MIN_ZONE_SIZE,
  createEditorState,
  editorPositions,
  editorReducer,
  emptyDiagram,
  frameCount,
  nextId,
  selectedElement,
} from '../src/editor';
import type { EditorAction, EditorState } from '../src/editor';
import { parseDiagram } from '../src/parse';

const start = (): EditorState => createEditorState(emptyDiagram());

/** Rejoue une suite d'actions, comme un coach enchaînerait des gestes. */
const play = (state: EditorState, ...actions: EditorAction[]): EditorState =>
  actions.reduce(editorReducer, state);

/** Poser un élément : choisir l'outil, toucher le terrain. */
const place = (state: EditorState, tool: EditorState['tool'], x: number, y: number): EditorState =>
  play(state, { type: 'TOOL', tool }, { type: 'POINTER_DOWN', at: { x, y } });

/** Saisir un élément, le traîner, le lâcher. */
const drag = (state: EditorState, from: { x: number; y: number }, to: { x: number; y: number }) =>
  play(
    state,
    { type: 'TOOL', tool: 'SELECT' },
    { type: 'POINTER_DOWN', at: from },
    { type: 'POINTER_MOVE', at: to },
    { type: 'POINTER_UP', at: to },
  );

const valid = (state: EditorState) => parseDiagram(state.diagram);

describe('poser des éléments', () => {
  it('pose un joueur là où le doigt a touché', () => {
    const state = place(start(), 'PLAYER_A', 30, 40);
    const element = selectedElement(state);
    expect(element).toMatchObject({ kind: 'PLAYER', team: 'A', x: 30, y: 40 });
  });

  it('sélectionne ce qu’on vient de poser, pour le régler aussitôt', () => {
    const state = place(start(), 'PLAYER_B', 10, 10);
    expect(state.selectedId).toBe(selectedElement(state)?.id);
  });

  it('garde l’outil armé : on pose rarement une seule coupelle', () => {
    let state = place(start(), 'CONE', 10, 10);
    state = editorReducer(state, { type: 'POINTER_DOWN', at: { x: 20, y: 20 } });
    expect(state.diagram.elements.filter((e) => e.kind === 'CONE')).toHaveLength(2);
  });

  it('numérote les identifiants par famille, sans hasard', () => {
    let state = place(start(), 'PLAYER_A', 10, 10);
    state = editorReducer(state, { type: 'POINTER_DOWN', at: { x: 20, y: 20 } });
    expect(state.diagram.elements.map((e) => e.id)).toEqual(['ball1', 'a1', 'a2']);
  });

  it('réutilise un identifiant libéré par une suppression', () => {
    let state = place(start(), 'PLAYER_A', 10, 10);
    state = place(state, 'PLAYER_A', 20, 20);
    state = play(state, { type: 'SELECT', id: 'a1' }, { type: 'DELETE_SELECTED' });
    expect(nextId(state.diagram, 'PLAYER_A')).toBe('a1');
  });

  it('refuse au-delà de la limite de lisibilité, et le dit', () => {
    let state = start();
    for (let i = 0; i < MAX_ELEMENTS + 5; i += 1) {
      state = place(state, 'CONE', (i % 10) * 10, Math.floor(i / 10) * 10);
    }
    expect(state.diagram.elements).toHaveLength(MAX_ELEMENTS);
    expect(state.notice).toContain(String(MAX_ELEMENTS));
  });
});

describe('déplacer', () => {
  it('déplace au départ en écrivant la position de l’élément', () => {
    let state = place(start(), 'PLAYER_A', 50, 50);
    state = drag(state, { x: 50, y: 50 }, { x: 80, y: 20 });
    expect(selectedElement(state)).toMatchObject({ x: 80, y: 20 });
  });

  it('ne fait pas sauter l’élément sous le doigt quand on l’attrape de travers', () => {
    // Doigt à 2 unités du centre : l'écart doit être conservé au lâcher.
    let state = place(start(), 'PLAYER_A', 50, 50);
    state = drag(state, { x: 52, y: 50 }, { x: 62, y: 50 });
    expect(selectedElement(state)).toMatchObject({ x: 60, y: 50 });
  });

  it('translate une flèche entière sans la déformer au bord', () => {
    let state = play(
      start(),
      { type: 'TOOL', tool: 'ARROW' },
      { type: 'POINTER_DOWN', at: { x: 10, y: 50 } },
      { type: 'POINTER_DOWN', at: { x: 30, y: 50 } },
      { type: 'ARROW_FINISH' },
    );
    state = drag(state, { x: 20, y: 50 }, { x: 99, y: 50 });
    const arrow = state.diagram.elements.find((e) => e.kind === 'ARROW');
    expect(arrow).toMatchObject({
      points: [
        { x: 80, y: 50 },
        { x: 100, y: 50 },
      ],
    });
  });

  it('ne sort jamais du terrain, même si le doigt glisse dehors', () => {
    let state = place(start(), 'PLAYER_A', 50, 50);
    state = drag(state, { x: 50, y: 50 }, { x: 200, y: -80 });
    expect(selectedElement(state)).toMatchObject({ x: 100, y: 0 });
    expect(valid(state).ok).toBe(true);
  });

  it('garde une zone entièrement dans le terrain quand on la pousse au bord', () => {
    let state = play(
      start(),
      { type: 'TOOL', tool: 'ZONE' },
      { type: 'POINTER_DOWN', at: { x: 10, y: 10 } },
      { type: 'POINTER_MOVE', at: { x: 40, y: 40 } },
      { type: 'POINTER_UP', at: { x: 40, y: 40 } },
    );
    state = drag(state, { x: 25, y: 25 }, { x: 99, y: 99 });
    const zone = selectedElement(state) as { x: number; y: number; w: number; h: number };
    expect(zone.x + zone.w).toBeLessThanOrEqual(100);
    expect(zone.y + zone.h).toBeLessThanOrEqual(100);
  });
});

describe('zones', () => {
  it('normalise un glissement vers le haut à gauche, qui donnerait une taille négative', () => {
    const state = play(
      start(),
      { type: 'TOOL', tool: 'ZONE' },
      { type: 'POINTER_DOWN', at: { x: 60, y: 60 } },
      { type: 'POINTER_MOVE', at: { x: 20, y: 20 } },
      { type: 'POINTER_UP', at: { x: 20, y: 20 } },
    );
    expect(selectedElement(state)).toMatchObject({ x: 20, y: 20, w: 40, h: 40 });
    expect(valid(state).ok).toBe(true);
  });

  it('refuse un geste raté plutôt que de poser une zone invisible', () => {
    const state = play(
      start(),
      { type: 'TOOL', tool: 'ZONE' },
      { type: 'POINTER_DOWN', at: { x: 60, y: 60 } },
      { type: 'POINTER_UP', at: { x: 61, y: 61 } },
    );
    expect(state.diagram.elements.filter((e) => e.kind === 'ZONE')).toHaveLength(0);
    expect(state.notice).toContain(String(MIN_ZONE_SIZE));
  });
});

describe('flèches', () => {
  it('se trace point par point, puis se termine', () => {
    const state = play(
      start(),
      { type: 'TOOL', tool: 'ARROW' },
      { type: 'POINTER_DOWN', at: { x: 10, y: 10 } },
      { type: 'POINTER_DOWN', at: { x: 50, y: 50 } },
      { type: 'POINTER_DOWN', at: { x: 90, y: 10 } },
      { type: 'ARROW_FINISH' },
    );
    expect(selectedElement(state)).toMatchObject({
      kind: 'ARROW',
      motion: 'PASSE',
      points: [
        { x: 10, y: 10 },
        { x: 50, y: 50 },
        { x: 90, y: 10 },
      ],
    });
    expect(state.arrowDraft).toBeNull();
  });

  it('refuse une flèche d’un seul point, que le lecteur ne saurait pas dessiner', () => {
    const state = play(
      start(),
      { type: 'TOOL', tool: 'ARROW' },
      { type: 'POINTER_DOWN', at: { x: 10, y: 10 } },
      { type: 'ARROW_FINISH' },
    );
    expect(state.diagram.elements.filter((e) => e.kind === 'ARROW')).toHaveLength(0);
    expect(state.notice).toContain('deux points');
  });

  it('change le type de déplacement de la flèche sélectionnée', () => {
    let state = play(
      start(),
      { type: 'TOOL', tool: 'ARROW' },
      { type: 'POINTER_DOWN', at: { x: 10, y: 10 } },
      { type: 'POINTER_DOWN', at: { x: 50, y: 50 } },
      { type: 'ARROW_FINISH' },
    );
    state = editorReducer(state, { type: 'MOTION', motion: 'PRESSING' });
    expect(selectedElement(state)).toMatchObject({ motion: 'PRESSING' });
  });
});

describe('images-clés', () => {
  it('passe d’un schéma fixe à une animation en une seule action', () => {
    const state = editorReducer(place(start(), 'PLAYER_A', 20, 50), { type: 'ADD_FRAME' });
    expect(state.diagram.keyframes.map((f) => f.t)).toEqual([0, 1]);
    expect(state.frameIndex).toBe(1);
    expect(valid(state).ok).toBe(true);
  });

  it('laisse le départ sans positions : rien n’a encore bougé', () => {
    const state = editorReducer(place(start(), 'PLAYER_A', 20, 50), { type: 'ADD_FRAME' });
    expect(state.diagram.keyframes[0]!.positions).toEqual({});
  });

  it('écrit le déplacement dans l’image-clé, et non dans l’élément', () => {
    let state = place(start(), 'PLAYER_A', 20, 50);
    const id = state.selectedId!;
    state = editorReducer(state, { type: 'ADD_FRAME' });
    state = drag(state, { x: 20, y: 50 }, { x: 80, y: 50 });
    expect(state.diagram.elements.find((e) => e.id === id)).toMatchObject({ x: 20, y: 50 });
    expect(state.diagram.keyframes[1]!.positions[id]).toEqual({ x: 80, y: 50 });
  });

  it('répartit les instants régulièrement : l’ordre chronologique ne peut plus être rompu', () => {
    let state = start();
    for (let i = 0; i < MAX_KEYFRAMES; i += 1) state = editorReducer(state, { type: 'ADD_FRAME' });
    expect(state.diagram.keyframes.map((f) => f.t)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(state.notice).toContain('Cinq images');
  });

  it('repasse en schéma fixe plutôt que de laisser une seule image-clé', () => {
    let state = editorReducer(start(), { type: 'ADD_FRAME' });
    state = editorReducer(state, { type: 'REMOVE_FRAME' });
    expect(state.diagram.keyframes).toEqual([]);
    expect(state.frameIndex).toBe(0);
    expect(valid(state).ok).toBe(true);
  });

  it('refuse de supprimer le départ : c’est le schéma lui-même', () => {
    const state = play(
      start(),
      { type: 'ADD_FRAME' },
      { type: 'FRAME', index: 0 },
      {
        type: 'REMOVE_FRAME',
      },
    );
    expect(state.notice).toContain('départ');
    expect(state.diagram.keyframes).toHaveLength(2);
  });

  it('refuse d’ajouter un élément sur une image-clé, et explique pourquoi', () => {
    let state = editorReducer(start(), { type: 'ADD_FRAME' });
    const avant = state.diagram.elements.length;
    state = place(state, 'PLAYER_A', 50, 50);
    expect(state.diagram.elements).toHaveLength(avant);
    expect(state.notice).toContain('Départ');
  });

  it('refuse de déplacer une flèche sur une image-clé, que le format ne sait pas animer', () => {
    let state = play(
      start(),
      { type: 'TOOL', tool: 'ARROW' },
      { type: 'POINTER_DOWN', at: { x: 10, y: 10 } },
      { type: 'POINTER_DOWN', at: { x: 50, y: 50 } },
      { type: 'ARROW_FINISH' },
      { type: 'ADD_FRAME' },
    );
    const avant = JSON.stringify(state.diagram);
    state = drag(state, { x: 30, y: 30 }, { x: 60, y: 60 });
    expect(JSON.stringify(state.diagram)).toBe(avant);
    expect(state.notice).toContain('une fois pour tout le schéma');
  });

  it('montre l’élément là où il est sur l’image affichée', () => {
    let state = place(start(), 'PLAYER_A', 20, 50);
    const id = state.selectedId!;
    state = editorReducer(state, { type: 'ADD_FRAME' });
    state = drag(state, { x: 20, y: 50 }, { x: 80, y: 50 });
    expect(editorPositions(state).get(id)).toEqual({ x: 80, y: 50 });
    state = editorReducer(state, { type: 'FRAME', index: 0 });
    expect(editorPositions(state).get(id)).toEqual({ x: 20, y: 50 });
  });

  it('refuse une phase de jeu sur un schéma fixe, faute d’image pour la porter', () => {
    const state = editorReducer(start(), { type: 'PATCH_FRAME', patch: { phase: 'PERTE' } });
    expect(state.notice).toContain('fixe');
  });
});

describe('supprimer', () => {
  it('efface aussi les positions d’images-clés, qui rendraient le fichier illisible', () => {
    let state = place(start(), 'PLAYER_A', 20, 50);
    const id = state.selectedId!;
    state = editorReducer(state, { type: 'ADD_FRAME' });
    state = drag(state, { x: 20, y: 50 }, { x: 80, y: 50 });
    expect(state.diagram.keyframes[1]!.positions[id]).toBeDefined();

    state = play(
      state,
      { type: 'FRAME', index: 0 },
      { type: 'SELECT', id },
      {
        type: 'DELETE_SELECTED',
      },
    );
    expect(state.diagram.keyframes.some((f) => id in f.positions)).toBe(false);
    expect(valid(state).ok).toBe(true);
  });

  it('laisse toujours un élément : un schéma vide ne montre rien', () => {
    const state = play(start(), { type: 'SELECT', id: 'ball1' }, { type: 'DELETE_SELECTED' });
    expect(state.diagram.elements).toHaveLength(1);
    expect(state.notice).toContain('ne montre rien');
  });
});

describe('réglages d’un élément', () => {
  it('accepte un numéro de maillot, refuse un numéro impossible', () => {
    let state = place(start(), 'PLAYER_A', 10, 10);
    state = editorReducer(state, { type: 'PATCH_SELECTED', patch: { number: 10 } });
    expect(selectedElement(state)).toMatchObject({ number: 10 });
    state = editorReducer(state, { type: 'PATCH_SELECTED', patch: { number: 220 } });
    expect(state.notice).toContain('1 à 99');
    expect(selectedElement(state)).toMatchObject({ number: 10 });
  });

  it('refuse un texte vide, qui deviendrait un élément insaisissable', () => {
    let state = place(start(), 'TEXT', 10, 10);
    state = editorReducer(state, { type: 'PATCH_SELECTED', patch: { text: '   ' } });
    expect(state.notice).toContain('vide');
    expect(selectedElement(state)).toMatchObject({ text: 'Texte' });
  });

  it('refuse un gardien d’une équipe qui n’existe pas', () => {
    let state = place(start(), 'GK', 10, 50);
    state = editorReducer(state, { type: 'PATCH_SELECTED', patch: { team: 'JOKER' } });
    expect(state.notice).toContain('équipe A');
    expect(selectedElement(state)).toMatchObject({ team: 'A' });
  });
});

describe('terrain', () => {
  it('applique les dimensions réelles d’un demi-terrain', () => {
    const state = editorReducer(start(), { type: 'FIELD', patch: { kind: 'HALF' } });
    expect(state.diagram.field).toMatchObject({ kind: 'HALF', lengthM: 50, widthM: 64 });
  });

  it('refuse un terrain d’un mètre, et un de deux cents', () => {
    expect(
      editorReducer(start(), { type: 'FIELD', patch: { kind: 'CUSTOM', lengthM: 1 } }).notice,
    ).toContain('5 mètres');
    expect(
      editorReducer(start(), { type: 'FIELD', patch: { kind: 'CUSTOM', lengthM: 200 } }).notice,
    ).toContain('120');
  });
});

describe('annuler', () => {
  it('défait le dernier geste', () => {
    let state = place(start(), 'PLAYER_A', 10, 10);
    expect(state.diagram.elements).toHaveLength(2);
    state = editorReducer(state, { type: 'UNDO' });
    expect(state.diagram.elements).toHaveLength(1);
  });

  it('défait un déplacement d’un seul coup, et non image par image', () => {
    let state = place(start(), 'PLAYER_A', 50, 50);
    state = play(
      state,
      { type: 'TOOL', tool: 'SELECT' },
      { type: 'POINTER_DOWN', at: { x: 50, y: 50 } },
      { type: 'POINTER_MOVE', at: { x: 55, y: 55 } },
      { type: 'POINTER_MOVE', at: { x: 60, y: 60 } },
      { type: 'POINTER_MOVE', at: { x: 70, y: 70 } },
      { type: 'POINTER_UP', at: { x: 70, y: 70 } },
      { type: 'UNDO' },
    );
    expect(state.diagram.elements.find((e) => e.id === 'a1')).toMatchObject({ x: 50, y: 50 });
  });

  it('le dit quand il n’y a rien à annuler, au lieu de ne rien faire', () => {
    expect(editorReducer(start(), { type: 'UNDO' }).notice).toContain('rien à annuler');
  });
});

describe('enregistrement', () => {
  it('signale le travail non enregistré, et l’oublie après enregistrement', () => {
    let state = place(start(), 'PLAYER_A', 10, 10);
    expect(state.dirty).toBe(true);
    state = editorReducer(state, { type: 'SAVED' });
    expect(state.dirty).toBe(false);
  });

  it('ne marque rien à enregistrer pour une simple sélection', () => {
    expect(editorReducer(start(), { type: 'SELECT', id: 'ball1' }).dirty).toBe(false);
  });
});

/**
 * L'INVARIANT.
 *
 * Un éditeur qui produit un fichier que le lecteur refuse fait perdre au coach
 * le travail qu'il vient de faire, et il ne s'en aperçoit qu'à la relecture.
 * Aucun test d'exemple ne couvre l'espace des gestes possibles : on les tire
 * donc au sort, avec un générateur reproductible pour qu'un échec se rejoue.
 */
describe('invariant : le schéma reste toujours lisible', () => {
  const TOOLS: EditorState['tool'][] = [
    'SELECT',
    'PLAYER_A',
    'PLAYER_B',
    'JOKER',
    'GK',
    'BALL',
    'CONE',
    'GOAL',
    'TEXT',
    'ZONE',
    'ARROW',
  ];

  /** Générateur déterministe : la même graine rejoue la même partie. */
  const random = (seed: number) => {
    let value = seed;
    return () => {
      value = (value * 1103515245 + 12345) % 2147483648;
      return value / 2147483648;
    };
  };

  it('tient sur 300 parties de 40 gestes tirés au hasard', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const next = random(seed);
      let state = start();
      const history: EditorAction[] = [];

      for (let step = 0; step < 40; step += 1) {
        const point = { x: next() * 120 - 10, y: next() * 120 - 10 };
        const dice = next();
        const action: EditorAction =
          dice < 0.22
            ? { type: 'TOOL', tool: TOOLS[Math.floor(next() * TOOLS.length)]! }
            : dice < 0.5
              ? { type: 'POINTER_DOWN', at: point }
              : dice < 0.6
                ? { type: 'POINTER_MOVE', at: point }
                : dice < 0.7
                  ? { type: 'POINTER_UP', at: point }
                  : dice < 0.76
                    ? { type: 'ARROW_FINISH' }
                    : dice < 0.82
                      ? { type: 'ADD_FRAME' }
                      : dice < 0.86
                        ? { type: 'REMOVE_FRAME' }
                        : dice < 0.9
                          ? { type: 'FRAME', index: Math.floor(next() * 6) }
                          : dice < 0.93
                            ? { type: 'DELETE_SELECTED' }
                            : dice < 0.96
                              ? { type: 'UNDO' }
                              : dice < 0.98
                                ? { type: 'PATCH_FRAME', patch: { phase: 'PERTE', caption: 'x' } }
                                : { type: 'FIELD', patch: { kind: 'HALF' } };
        history.push(action);
        state = editorReducer(state, action);

        const result = parseDiagram(state.diagram);
        if (!result.ok) {
          throw new Error(
            `graine ${seed}, geste ${step} : ${result.issues
              .map((i) => `${i.path} ${i.message}`)
              .join(' | ')}\n${JSON.stringify(history.slice(-4))}`,
          );
        }
      }
    }
  });

  it('ne produit jamais plus d’images-clés que la limite, ni un compte d’images incohérent', () => {
    const next = random(7);
    let state = start();
    for (let step = 0; step < 400; step += 1) {
      state = editorReducer(state, next() < 0.6 ? { type: 'ADD_FRAME' } : { type: 'REMOVE_FRAME' });
      expect(state.diagram.keyframes.length).toBeLessThanOrEqual(MAX_KEYFRAMES);
      expect(state.diagram.keyframes.length).not.toBe(1);
      expect(state.frameIndex).toBeLessThan(frameCount(state.diagram));
    }
  });
});
