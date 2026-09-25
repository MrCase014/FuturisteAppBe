'use client';

import { useActionState } from 'react';
import { METHODOLOGY_BODY_MAX, METHODOLOGY_TITLE_MAX } from '@futuriste/core';
import { updateMethodologySection, type MethodologyFormState } from './actions';

/**
 * L'édition d'une section, en place.
 *
 * Pas de page « modifier » séparée : la direction corrige une phrase en la
 * relisant, pas en la retrouvant sur un autre écran. Le compteur de
 * caractères est affiché en permanence, et non au moment du refus — on prévient
 * avant, on ne sanctionne pas après.
 */
export function SectionForm({
  id,
  sectionKey,
  code,
  titleFr,
  bodyFr,
}: {
  id: string;
  sectionKey: string;
  code: string;
  titleFr: string;
  bodyFr: string;
}) {
  const [state, action, pending] = useActionState<MethodologyFormState, FormData>(
    updateMethodologySection,
    {},
  );

  const field =
    'w-full rounded-md border border-surface-border bg-surface-card px-3 py-2 ' +
    'text-body text-content-primary focus:border-futuriste-violet focus:outline-none';

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="key" value={sectionKey} />
      <input type="hidden" name="code" value={code} />

      <label htmlFor={`titre-${id}`} className="block text-caption text-content-secondary">
        Intitulé
      </label>
      <input
        id={`titre-${id}`}
        name="titleFr"
        defaultValue={titleFr}
        maxLength={METHODOLOGY_TITLE_MAX}
        className={`min-h-touch ${field}`}
      />

      <label htmlFor={`corps-${id}`} className="block text-caption text-content-secondary">
        Texte · {METHODOLOGY_BODY_MAX} caractères au maximum, pour rester lisible au bord du terrain
      </label>
      <textarea
        id={`corps-${id}`}
        name="bodyFr"
        defaultValue={bodyFr}
        rows={4}
        maxLength={METHODOLOGY_BODY_MAX}
        className={field}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-touch rounded-md bg-futuriste-violet px-4 text-body font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {state.error && <p className="text-small text-status-critical">{state.error}</p>}
        {state.notice && <p className="text-small text-status-good">{state.notice}</p>}
      </div>
    </form>
  );
}
