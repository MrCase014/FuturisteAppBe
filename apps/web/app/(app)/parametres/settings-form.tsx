'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert } from '@/components/kit';
import { updateAcademySettings, type SettingsFormState } from './actions';

const field =
  'mt-1 w-full rounded-md border border-surface-border bg-surface-app px-3 py-2 text-body ' +
  'text-content-primary focus:border-futuriste-violet focus:outline-none';

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch rounded-md bg-futuriste-violet px-5 text-body font-medium
                 text-white hover:bg-futuriste-violet-deep disabled:opacity-60"
    >
      {pending ? 'Enregistrement…' : 'Enregistrer'}
    </button>
  );
}

export function AcademySettingsForm({
  name,
  city,
  country,
  locale,
}: {
  name: string;
  city: string;
  country: string;
  locale: string;
}) {
  const [state, action] = useActionState<SettingsFormState, FormData>(updateAcademySettings, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="serious">{state.error}</Alert>}
      {state.notice && <Alert tone="good">{state.notice}</Alert>}

      <div>
        <label htmlFor="name" className="text-small font-medium text-content-primary">
          Nom de l&apos;académie
        </label>
        <input
          id="name"
          name="name"
          defaultValue={name}
          required
          maxLength={120}
          className={field}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="text-small font-medium text-content-primary">
            Ville
          </label>
          <input id="city" name="city" defaultValue={city} className={field} />
        </div>
        <div>
          <label htmlFor="country" className="text-small font-medium text-content-primary">
            Pays
          </label>
          <input id="country" name="country" defaultValue={country} className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="locale" className="text-small font-medium text-content-primary">
          Langue par défaut
        </label>
        <select id="locale" name="locale" defaultValue={locale} className={field}>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <Save />
    </form>
  );
}
