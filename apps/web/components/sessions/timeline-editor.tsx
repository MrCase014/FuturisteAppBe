'use client';

import type {
  PlannableExercise,
  SessionEditAction,
  SessionEditState,
  SessionPhase,
} from '@futuriste/core';
import {
  PLAN_REASON_LABEL,
  blockedByHeadcount,
  editWarnings,
  plannedMinutes,
} from '@futuriste/core';
import { Alert, Card, SectionTitle } from '@/components/kit';
import { Chip } from '@/components/diagrams/editor-controls';

/**
 * La timeline modifiable d'une séance (phases 6.4 à 6.6).
 *
 * UN seul composant, utilisé par l'assistant ET par la maquette publique. Deux
 * copies finiraient par diverger, et c'est toujours celle que personne ne
 * regarde qui garderait le défaut.
 *
 * Il ne décide de rien : il envoie des gestes au moteur de `packages/core` et
 * redessine ce qu'il rend. Les refus viennent du moteur avec leur motif —
 * c'est pour cela qu'on peut vérifier « retirer le retour au calme est
 * refusé » sans ouvrir un navigateur.
 */

/** Les raisons qui DISTINGUENT un choix ; les autres sont vraies partout. */
const DISTINGUISHING = ['OBJECTIF', 'NIVEAU', 'SEUL_CANDIDAT', 'DUREE'] as const;

/** Les effectifs proposés d'un toucher. Un coach corrige, il ne saisit pas. */
const HEADCOUNTS = [6, 8, 10, 12, 14, 16, 20, 24];

export function TimelineEditor({
  edit,
  alternatives,
  dispatch,
}: {
  edit: SessionEditState;
  alternatives: Partial<Record<SessionPhase, PlannableExercise[]>>;
  dispatch: (action: SessionEditAction) => void;
}) {
  const blocked = blockedByHeadcount(edit);

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <SectionTitle>Votre séance</SectionTitle>
          <span className="text-small tabular-nums text-content-secondary">
            {plannedMinutes(edit)} min / {edit.targetMin} min · {edit.playersPresent} joueurs
          </span>
        </div>
        <p className="mb-3 text-caption text-content-secondary">
          Déplacez, remplacez, raccourcissez. Ce qui romprait une règle de la méthodologie est
          refusé sur-le-champ, avec la raison — plutôt qu’au moment d’enregistrer.
        </p>

        <ol className="space-y-2">
          {edit.blocks.map((block, index) => (
            <li
              key={`${block.phase}-${index}`}
              className={`rounded-md border p-3 ${
                block.problem
                  ? 'border-status-critical'
                  : block.exercise
                    ? 'border-surface-border'
                    : 'border-dashed border-status-warning'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    aria-label={`Monter ${block.labelFr}`}
                    disabled={index === 0}
                    onClick={() => dispatch({ type: 'MOVE', from: index, to: index - 1 })}
                    className="min-h-touch w-9 rounded-md bg-surface-raised text-body disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Descendre ${block.labelFr}`}
                    disabled={index === edit.blocks.length - 1}
                    onClick={() => dispatch({ type: 'MOVE', from: index, to: index + 1 })}
                    className="min-h-touch w-9 rounded-md bg-surface-raised text-body disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-caption uppercase tracking-wide text-content-muted">
                    {block.labelFr}
                  </p>

                  <select
                    value={block.exercise?.id ?? ''}
                    aria-label={`Exercice de ${block.labelFr}`}
                    onChange={(event) =>
                      dispatch({
                        type: 'REPLACE',
                        index,
                        exercise:
                          (alternatives[block.phase] ?? []).find(
                            (candidate) => candidate.id === event.target.value,
                          ) ?? null,
                      })
                    }
                    className="mt-1 min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-2 text-body text-content-primary"
                  >
                    <option value="">— aucun exercice —</option>
                    {(alternatives[block.phase] ?? []).map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>

                  {block.exercise && (
                    <p className="mt-1 text-caption text-content-secondary">
                      {block.exercise.objective}
                    </p>
                  )}
                  {/* La raison DISPARAÎT si le coach a choisi lui-même : elle
                      justifierait un raisonnement qui n'a pas produit ce choix. */}
                  {block.reasons.length > 0 && (
                    <p className="text-caption text-content-muted">
                      {DISTINGUISHING.filter((reason) => block.reasons.includes(reason))
                        .map((reason) => PLAN_REASON_LABEL[reason])
                        .join(' · ')}
                    </p>
                  )}
                  {block.groups > 1 && (
                    <p className="text-caption text-content-muted">
                      {block.groups} ateliers en parallèle — prévoyez le matériel.
                    </p>
                  )}
                  {block.problem && (
                    <p className="text-caption text-status-critical">{block.problem}</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Raccourcir ${block.labelFr}`}
                      onClick={() =>
                        dispatch({ type: 'SET_DURATION', index, minutes: block.durationMin - 5 })
                      }
                      className="min-h-touch w-9 rounded-md bg-surface-raised text-body"
                    >
                      −
                    </button>
                    <span className="min-w-[4.5rem] text-center text-small tabular-nums text-content-secondary">
                      {block.durationMin} min
                    </span>
                    <button
                      type="button"
                      aria-label={`Allonger ${block.labelFr}`}
                      onClick={() =>
                        dispatch({ type: 'SET_DURATION', index, minutes: block.durationMin + 5 })
                      }
                      className="min-h-touch w-9 rounded-md bg-surface-raised text-body"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'REMOVE', index })}
                      className="min-h-touch rounded-md px-3 text-small text-status-critical"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {edit.notice && <Alert tone="warning">{edit.notice}</Alert>}

      {blocked.length > 0 && (
        <Alert tone="serious">
          {blocked.length} exercice(s) ne tournent plus avec {edit.playersPresent} joueurs.
          Remplacez-les, ou corrigez l’effectif.
        </Alert>
      )}

      {editWarnings(edit).map((warning) => (
        <Alert key={warning.rule} tone="warning">
          {warning.messageFr}
        </Alert>
      ))}

      <Card className="space-y-2">
        <SectionTitle>L’effectif a changé ?</SectionTitle>
        <p className="text-caption text-content-secondary">
          Corrigez ici : le studio recalcule les ateliers et signale ce qui ne tourne plus. Rien
          n’est effacé — c’est à vous de décider quoi remplacer.
        </p>
        <div className="flex flex-wrap gap-2">
          {HEADCOUNTS.map((count) => (
            <Chip
              key={count}
              active={edit.playersPresent === count}
              onClick={() => dispatch({ type: 'SET_PLAYERS', playersPresent: count })}
            >
              {count}
            </Chip>
          ))}
        </div>
      </Card>
    </div>
  );
}
