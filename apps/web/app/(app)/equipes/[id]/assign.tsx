'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert } from '@/components/kit';
import { addPlayerToTeam, assignCoach, type TeamActionState } from '../actions';

const control =
  'min-h-touch flex-1 rounded-md border border-surface-border bg-surface-app px-3 text-body ' +
  'text-content-primary focus:border-futuriste-violet focus:outline-none';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch shrink-0 rounded-md bg-futuriste-violet px-4 text-body font-medium
                 text-white hover:bg-futuriste-violet-deep disabled:opacity-60"
    >
      {pending ? '…' : label}
    </button>
  );
}

/** Rattacher un joueur à l'équipe (4.6). */
export function AddPlayer({
  teamId,
  season,
  candidates,
}: {
  teamId: string;
  season: string;
  candidates: { id: string; label: string }[];
}) {
  const [state, action] = useActionState<TeamActionState, FormData>(addPlayerToTeam, {});

  if (candidates.length === 0) {
    return (
      <p className="text-small text-content-secondary">
        Tous les joueurs de l&apos;académie sont déjà dans cette équipe.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-2">
      {state.error && <Alert tone="serious">{state.error}</Alert>}
      {state.notice && <Alert tone="good">{state.notice}</Alert>}
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="season" value={season} />
      <div className="flex gap-2">
        <label htmlFor="playerId" className="sr-only">
          Joueur à rattacher
        </label>
        <select id="playerId" name="playerId" className={control} defaultValue="">
          <option value="">Choisir un joueur…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <Submit label="Rattacher" />
      </div>
    </form>
  );
}

/** Affecter un coach à l'équipe (4.2). */
export function AssignCoach({
  teamId,
  candidates,
}: {
  teamId: string;
  candidates: { id: string; label: string }[];
}) {
  const [state, action] = useActionState<TeamActionState, FormData>(assignCoach, {});

  if (candidates.length === 0) {
    return (
      <p className="text-small text-content-secondary">
        Tous les coachs de l&apos;académie sont déjà affectés à cette équipe.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-2">
      {state.error && <Alert tone="serious">{state.error}</Alert>}
      {state.notice && <Alert tone="good">{state.notice}</Alert>}
      <input type="hidden" name="teamId" value={teamId} />
      <div className="flex gap-2">
        <label htmlFor="coachId" className="sr-only">
          Coach à affecter
        </label>
        <select id="coachId" name="coachId" className={control} defaultValue="">
          <option value="">Choisir un coach…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <Submit label="Affecter" />
      </div>
    </form>
  );
}
