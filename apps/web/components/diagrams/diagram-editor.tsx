'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type {
  DiagramCanvas,
  EditorState,
  GamePhase,
  Motion,
  ZonePurpose,
} from '@futuriste/diagrams';
import {
  FIELD_LABELS,
  MAX_KEYFRAMES,
  MOTION_STYLES,
  PHASE_SHORT,
  TOOLS,
  ZONE_STYLES,
  createEditorState,
  describeDiagram,
  editorPositions,
  editorReducer,
  emptyDiagram,
  fieldGeometry,
  frameCount,
  frameLabel,
  pointerToDiagram,
  selectedElement,
  toViewPoint,
} from '@futuriste/diagrams';
import { DiagramField } from './field';
import { DiagramPlayer } from './diagram-player';
import { ActionButton, Chip, FieldRow, NumberInput, TextInput } from './editor-controls';

/**
 * L'éditeur de schémas (phase 5.7).
 *
 * Ce composant ne DÉCIDE de rien : il traduit un doigt en action, et redessine
 * ce que le moteur (`@futuriste/diagrams/editor`) lui rend. Toute la logique —
 * et donc tout ce qui peut se tromper — est dans le paquet, où elle est
 * vérifiée par des tests, dont un qui joue douze mille gestes au hasard.
 *
 * Trois choix dictés par l'usage réel, un pouce au bord d'un terrain :
 *
 *  1. `touch-action: none` sur le dessin. Sans cela, traîner un joueur fait
 *     défiler la page, et l'éditeur est inutilisable sur téléphone.
 *  2. La capture du pointeur. Un doigt qui sort du cadre continue de déplacer
 *     son joueur au lieu de le lâcher à mi-chemin.
 *  3. Une flèche se trace en TOUCHANT ses points, pas en glissant. Un
 *     glissement de trois segments se rate une fois sur deux sur un écran
 *     tactile ; une suite de touchers, jamais.
 */

const PHASES: GamePhase[] = ['POSSESSION', 'PERTE', 'RECUPERATION', 'TRANSITION'];
const PURPOSES: ZonePurpose[] = ['OCCUPER', 'PROTEGER', 'INTERDITE', 'CIBLE', 'NEUTRE'];
const MOTIONS: Motion[] = ['PASSE', 'COURSE', 'CONDUITE', 'TIR', 'PRESSING'];

export function DiagramEditor({
  initial,
  title: initialTitle = '',
  onSave,
  saving = false,
  savedNotice = null,
  savedAt = null,
}: {
  initial?: DiagramCanvas;
  title?: string;
  /** Absent = démonstration : on édite, on lit le résultat, on n'enregistre rien. */
  onSave?: (title: string, canvas: DiagramCanvas) => void;
  saving?: boolean;
  savedNotice?: string | null;
  /**
   * L'instant du dernier enregistrement réussi.
   *
   * L'éditeur tient son propre état ; seul le parent sait si le serveur a
   * accepté. Ce jeton est le signal qui éteint « à enregistrer » — l'éteindre
   * dès l'envoi mentirait, puisque l'écriture peut être refusée.
   */
  savedAt?: number | null;
}) {
  const [state, dispatch] = useReducer(editorReducer, initial ?? emptyDiagram(), createEditorState);
  const [title, setTitle] = useState(initialTitle);
  const [preview, setPreview] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (savedAt) dispatch({ type: 'SAVED' });
  }, [savedAt]);

  const geometry = useMemo(() => fieldGeometry(state.diagram.field), [state.diagram.field]);
  const positions = useMemo(() => editorPositions(state), [state]);
  const selected = selectedElement(state);
  const frames = frameCount(state.diagram);
  const description = useMemo(() => describeDiagram(state.diagram), [state.diagram]);

  const pointOf = (event: ReactPointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return pointerToDiagram({ x: event.clientX, y: event.clientY }, rect, geometry);
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    svgRef.current?.setPointerCapture?.(event.pointerId);
    dispatch({ type: 'POINTER_DOWN', at: pointOf(event) });
  };
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!state.drag && !state.zoneDraft) return;
    dispatch({ type: 'POINTER_MOVE', at: pointOf(event) });
  };
  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    dispatch({ type: 'POINTER_UP', at: pointOf(event) });
  };

  const view = (point: { x: number; y: number }) => toViewPoint(point, geometry);

  /** Ce que l'éditeur ajoute au dessin : la sélection, et les tracés en cours. */
  const overlay = (
    <g pointerEvents="none">
      {selected &&
        'x' in selected &&
        (() => {
          const at = view(positions.get(selected.id) ?? { x: selected.x, y: selected.y });
          return (
            <circle
              cx={at.x}
              cy={at.y}
              r={5}
              fill="none"
              className="stroke-futuriste-violet"
              strokeWidth={0.8}
              strokeDasharray="2 1.5"
            />
          );
        })()}
      {state.zoneDraft &&
        (() => {
          const from = view(state.zoneDraft.from);
          const to = view(state.zoneDraft.to);
          return (
            <rect
              x={Math.min(from.x, to.x)}
              y={Math.min(from.y, to.y)}
              width={Math.abs(to.x - from.x)}
              height={Math.abs(to.y - from.y)}
              fill="none"
              className="stroke-futuriste-violet"
              strokeWidth={0.7}
              strokeDasharray="2 1.5"
            />
          );
        })()}
      {state.arrowDraft && state.arrowDraft.length > 0 && (
        <>
          <polyline
            points={state.arrowDraft
              .map((p) => {
                const v = view(p);
                return `${v.x},${v.y}`;
              })
              .join(' ')}
            fill="none"
            className="stroke-futuriste-violet"
            strokeWidth={0.8}
            strokeDasharray="2 1.5"
          />
          {state.arrowDraft.map((p, index) => {
            const v = view(p);
            return (
              <circle key={index} cx={v.x} cy={v.y} r={1.4} className="fill-futuriste-violet" />
            );
          })}
        </>
      )}
    </g>
  );

  const toolHint = TOOLS.find((t) => t.tool === state.tool)?.hint ?? '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Titre du schéma"
          maxLength={80}
          className="min-h-touch min-w-0 flex-1 rounded-md border border-surface-border bg-surface-card px-3 text-body font-medium text-content-primary"
        />
        <ActionButton onClick={() => setPreview((value) => !value)}>
          {preview ? '✎ Modifier' : '▶ Aperçu'}
        </ActionButton>
        {onSave && (
          <ActionButton
            variant="primary"
            disabled={saving || !state.dirty}
            onClick={() => onSave(title, state.diagram)}
          >
            {saving ? 'Enregistrement…' : state.dirty ? 'Enregistrer' : 'Enregistré'}
          </ActionButton>
        )}
      </div>

      {savedNotice && (
        <p className="rounded-md bg-surface-raised px-3 py-2 text-small text-content-secondary">
          {savedNotice}
        </p>
      )}

      {preview ? (
        <div className="rounded-md bg-surface-card p-3">
          <DiagramPlayer diagram={state.diagram} title={title || undefined} />
          <p className="mt-2 text-caption text-content-muted">
            C’est exactement ce que verra le coach : même lecteur, même fichier.
          </p>
        </div>
      ) : (
        <div className="rounded-md bg-surface-card p-2">
          <div style={{ touchAction: 'none' }}>
            <DiagramField
              diagram={state.diagram}
              positions={positions}
              altText={state.diagram.alt ?? description.alt}
              svgRef={svgRef}
              overlay={overlay}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              className="w-full touch-none select-none rounded-md"
            />
          </div>
          <p className="px-1 pt-2 text-caption text-content-muted">{toolHint}</p>
        </div>
      )}

      {state.notice && (
        <p
          role="status"
          className="rounded-md border border-status-warning bg-surface-card px-3 py-2 text-small text-content-primary"
        >
          {state.notice}
        </p>
      )}

      {/* La bande des images : c'est elle qui transforme un dessin en animation. */}
      <div className="space-y-2 rounded-md bg-surface-card p-3">
        <p className="text-caption text-content-secondary">
          Images du schéma — le coach voit le trajet entre elles.
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: frames }, (_, index) => (
            <Chip
              key={index}
              active={state.frameIndex === index}
              onClick={() => dispatch({ type: 'FRAME', index })}
            >
              {frameLabel(index)}
            </Chip>
          ))}
          <Chip
            onClick={() => dispatch({ type: 'ADD_FRAME' })}
            title={`${MAX_KEYFRAMES} images au maximum`}
          >
            + Image
          </Chip>
          {state.frameIndex > 0 && (
            <Chip tone="danger" onClick={() => dispatch({ type: 'REMOVE_FRAME' })}>
              Retirer l’image
            </Chip>
          )}
        </div>
        {state.diagram.keyframes.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap gap-2">
              {PHASES.map((phase) => (
                <Chip
                  key={phase}
                  active={state.diagram.keyframes[state.frameIndex]?.phase === phase}
                  onClick={() =>
                    dispatch({
                      type: 'PATCH_FRAME',
                      patch: {
                        phase:
                          state.diagram.keyframes[state.frameIndex]?.phase === phase ? null : phase,
                      },
                    })
                  }
                >
                  {PHASE_SHORT[phase]}
                </Chip>
              ))}
            </div>
            <TextInput
              value={state.diagram.keyframes[state.frameIndex]?.caption ?? ''}
              onChange={(value) => dispatch({ type: 'PATCH_FRAME', patch: { caption: value } })}
              placeholder="Ce qui se passe à cet instant (facultatif)"
              maxLength={120}
            />
          </div>
        )}
      </div>

      {/* La palette. Sur une image-clé, on ne pose rien : on déplace. */}
      <div className="space-y-2 rounded-md bg-surface-card p-3">
        <div className="flex flex-wrap gap-2">
          {TOOLS.map((tool) => (
            <Chip
              key={tool.tool}
              active={state.tool === tool.tool}
              title={tool.hint}
              onClick={() => dispatch({ type: 'TOOL', tool: tool.tool })}
            >
              {tool.label}
            </Chip>
          ))}
        </div>

        {state.tool === 'ZONE' && (
          <div className="flex flex-wrap gap-2 pt-1">
            {PURPOSES.map((purpose) => (
              <Chip
                key={purpose}
                active={state.zonePurpose === purpose}
                onClick={() => dispatch({ type: 'ZONE_PURPOSE', purpose })}
              >
                {ZONE_STYLES[purpose].label}
              </Chip>
            ))}
          </div>
        )}

        {state.tool === 'ARROW' && (
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap gap-2">
              {MOTIONS.map((motion) => (
                <Chip
                  key={motion}
                  active={state.motion === motion}
                  onClick={() => dispatch({ type: 'MOTION', motion })}
                >
                  {MOTION_STYLES[motion].label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={() => dispatch({ type: 'ARROW_FINISH' })}>
                Terminer la flèche
              </ActionButton>
              {state.arrowDraft && (
                <ActionButton onClick={() => dispatch({ type: 'CANCEL_DRAFT' })}>
                  Annuler le tracé
                </ActionButton>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <ActionButton
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={state.past.length === 0}
          >
            ↶ Annuler
          </ActionButton>
          {selected && state.frameIndex === 0 && (
            <ActionButton variant="danger" onClick={() => dispatch({ type: 'DELETE_SELECTED' })}>
              Supprimer la sélection
            </ActionButton>
          )}
        </div>
      </div>

      {selected && (
        <div className="space-y-3 rounded-md bg-surface-card p-3">
          <p className="text-caption text-content-secondary">
            Élément sélectionné — <code>{selected.id}</code>
          </p>

          {selected.kind === 'PLAYER' && (
            <>
              <div className="flex flex-wrap gap-2">
                {(['A', 'B', 'JOKER', 'NEUTRE'] as const).map((team) => (
                  <Chip
                    key={team}
                    active={selected.team === team}
                    onClick={() => dispatch({ type: 'PATCH_SELECTED', patch: { team } })}
                  >
                    {team === 'A'
                      ? 'Équipe A'
                      : team === 'B'
                        ? 'Équipe B'
                        : team === 'JOKER'
                          ? 'Joker'
                          : 'Neutre'}
                  </Chip>
                ))}
              </div>
              <FieldRow label="Numéro de maillot">
                <NumberInput
                  value={selected.number ?? ''}
                  min={1}
                  max={99}
                  onChange={(value) =>
                    dispatch({
                      type: 'PATCH_SELECTED',
                      patch: { number: value === '' ? null : value },
                    })
                  }
                />
              </FieldRow>
              <Chip
                active={selected.hasBall === true}
                onClick={() =>
                  dispatch({ type: 'PATCH_SELECTED', patch: { hasBall: !selected.hasBall } })
                }
              >
                Porte le ballon
              </Chip>
            </>
          )}

          {selected.kind === 'GK' && (
            <div className="flex flex-wrap gap-2">
              {(['A', 'B'] as const).map((team) => (
                <Chip
                  key={team}
                  active={selected.team === team}
                  onClick={() => dispatch({ type: 'PATCH_SELECTED', patch: { team } })}
                >
                  Gardien {team}
                </Chip>
              ))}
            </div>
          )}

          {selected.kind === 'ZONE' && (
            <>
              <div className="flex flex-wrap gap-2">
                {PURPOSES.map((purpose) => (
                  <Chip
                    key={purpose}
                    active={selected.purpose === purpose}
                    onClick={() => dispatch({ type: 'PATCH_SELECTED', patch: { purpose } })}
                  >
                    {ZONE_STYLES[purpose].label}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(['RECT', 'CIRCLE'] as const).map((shape) => (
                  <Chip
                    key={shape}
                    active={selected.shape === shape}
                    onClick={() => dispatch({ type: 'PATCH_SELECTED', patch: { shape } })}
                  >
                    {shape === 'RECT' ? 'Rectangle' : 'Cercle'}
                  </Chip>
                ))}
              </div>
              <FieldRow label="Étiquette (facultative)">
                <TextInput
                  value={selected.label ?? ''}
                  maxLength={24}
                  onChange={(value) =>
                    dispatch({ type: 'PATCH_SELECTED', patch: { label: value } })
                  }
                />
              </FieldRow>
            </>
          )}

          {selected.kind === 'ARROW' && (
            <div className="flex flex-wrap gap-2">
              {MOTIONS.map((motion) => (
                <Chip
                  key={motion}
                  active={selected.motion === motion}
                  onClick={() => dispatch({ type: 'PATCH_SELECTED', patch: { motion } })}
                >
                  {MOTION_STYLES[motion].label}
                </Chip>
              ))}
            </div>
          )}

          {selected.kind === 'GOAL' && (
            <>
              <div className="flex flex-wrap gap-2">
                {(['MINI', 'SMALL', 'FULL'] as const).map((size) => (
                  <Chip
                    key={size}
                    active={selected.size === size}
                    onClick={() => dispatch({ type: 'PATCH_SELECTED', patch: { size } })}
                  >
                    {size === 'MINI' ? 'Mini-but' : size === 'SMALL' ? 'But réduit' : 'But entier'}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 90, 180, 270].map((rotation) => (
                  <Chip
                    key={rotation}
                    active={selected.rotation === rotation}
                    onClick={() => dispatch({ type: 'PATCH_SELECTED', patch: { rotation } })}
                  >
                    {rotation}°
                  </Chip>
                ))}
              </div>
            </>
          )}

          {(selected.kind === 'BALL' || selected.kind === 'CONE') && (
            <p className="text-small text-content-secondary">
              {selected.kind === 'BALL'
                ? 'Un ballon n’a pas de réglage : déplacez-le au doigt, ou supprimez-le.'
                : 'Une coupelle n’a pas de réglage : déplacez-la au doigt, ou supprimez-la.'}
            </p>
          )}

          {selected.kind === 'TEXT' && (
            <FieldRow label="Texte affiché">
              <TextInput
                value={selected.text}
                maxLength={40}
                onChange={(value) => dispatch({ type: 'PATCH_SELECTED', patch: { text: value } })}
              />
            </FieldRow>
          )}
        </div>
      )}

      <details className="rounded-md bg-surface-card p-3">
        <summary className="min-h-touch cursor-pointer text-small font-medium text-content-primary">
          Terrain, description, et fichier
        </summary>
        <div className="space-y-3 pt-3">
          <div className="flex flex-wrap gap-2">
            {(['FULL', 'HALF', 'THIRD', 'CUSTOM'] as const).map((kind) => (
              <Chip
                key={kind}
                active={state.diagram.field.kind === kind}
                onClick={() => dispatch({ type: 'FIELD', patch: { kind } })}
              >
                {FIELD_LABELS[kind]}
              </Chip>
            ))}
          </div>
          <div className="flex gap-3">
            <FieldRow label="Longueur (m)">
              <NumberInput
                value={state.diagram.field.lengthM}
                min={5}
                max={120}
                onChange={(value) =>
                  value !== '' &&
                  dispatch({ type: 'FIELD', patch: { kind: 'CUSTOM', lengthM: value } })
                }
              />
            </FieldRow>
            <FieldRow label="Largeur (m)">
              <NumberInput
                value={state.diagram.field.widthM}
                min={5}
                max={120}
                onChange={(value) =>
                  value !== '' &&
                  dispatch({ type: 'FIELD', patch: { kind: 'CUSTOM', widthM: value } })
                }
              />
            </FieldRow>
          </div>
          <FieldRow label="Description pour qui ne voit pas l’animation">
            <TextInput
              value={state.diagram.alt ?? ''}
              maxLength={300}
              placeholder={description.alt}
              onChange={(value) => dispatch({ type: 'ALT', text: value })}
            />
          </FieldRow>
          <div>
            <p className="text-caption text-content-secondary">
              Le fichier du schéma — {JSON.stringify(state.diagram).length} caractères, soit le
              centième d’une photographie.
            </p>
            <textarea
              readOnly
              value={JSON.stringify(state.diagram, null, 2)}
              rows={8}
              className="mt-1 w-full rounded-md border border-surface-border bg-surface-app p-2 font-mono text-caption text-content-secondary"
            />
          </div>
        </div>
      </details>

      {!onSave && (
        <p className="rounded-md bg-surface-raised px-3 py-2 text-small text-content-secondary">
          Démonstration : rien n’est enregistré ici. Dans l’application, le schéma est attaché à un
          exercice et n’est visible que par votre académie.
        </p>
      )}
    </div>
  );
}

export type { EditorState };
