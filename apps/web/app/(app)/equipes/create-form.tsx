'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { GENDER_LABEL } from '@futuriste/core';
import { Alert } from '@/components/kit';
import { createTeam, type TeamActionState } from './actions';

const field =
  'mt-1 w-full rounded-md border border-surface-border bg-surface-app px-3 py-2 text-body ' +
  'text-content-primary focus:border-futuriste-violet focus:outline-none';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch rounded-md bg-futuriste-violet px-5 text-body font-medium
                 text-white hover:bg-futuriste-violet-deep disabled:opacity-60"
    >
      {pending ? 'Création…' : 'Créer l’équipe'}
    </button>
  );
}

/** 4.2 — Créer une équipe et la rattacher à une catégorie. */
export function CreateTeamForm({ ageGroups }: { ageGroups: { id: string; label: string }[] }) {
  const [state, action] = useActionState<TeamActionState, FormData>(createTeam, {});
  const currentSeason = String(new Date().getFullYear());

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="serious">{state.error}</Alert>}
      {state.notice && <Alert tone="good">{state.notice}</Alert>}

      <div>
        <label htmlFor="name" className="text-small font-medium text-content-primary">
          Nom de l’équipe
        </label>
        <input id="name" name="name" required placeholder="U11 Filles A" className={field} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ageGroupId" className="text-small font-medium text-content-primary">
            Catégorie
          </label>
          <select id="ageGroupId" name="ageGroupId" defaultValue="" className={field}>
            <option value="">À choisir</option>
            {ageGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="season" className="text-small font-medium text-content-primary">
            Saison
          </label>
          <input id="season" name="season" defaultValue={currentSeason} className={field} />
        </div>
        <div>
          <label htmlFor="gender" className="text-small font-medium text-content-primary">
            Genre
          </label>
          <select id="gender" name="gender" defaultValue="MIXED" className={field}>
            {Object.entries(GENDER_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Submit />
    </form>
  );
}
