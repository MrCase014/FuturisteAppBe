'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/kit';
import type { FormState } from '../connexion/actions';
import { requestPasswordReset } from './actions';

const EMPTY: FormState = {};

export function ResetForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(requestPasswordReset, EMPTY);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="reset-email" className="mb-1 block text-small text-content-secondary">
          Adresse e-mail
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={disabled}
          className="min-h-touch w-full rounded-md border border-surface-border bg-surface-app px-3
                     text-body text-content-primary outline-none focus:border-futuriste-violet
                     focus:ring-2 focus:ring-futuriste-violet/30 disabled:opacity-60"
        />
      </div>

      {state.error && <Alert tone="critical">{state.error}</Alert>}
      {state.notice && <Alert tone="good">{state.notice}</Alert>}

      <button
        type="submit"
        disabled={disabled || pending}
        className="min-h-touch w-full rounded-md bg-futuriste-violet px-4 font-medium text-white
                   hover:bg-futuriste-violet-deep disabled:opacity-60"
      >
        {pending ? 'Envoi…' : 'Envoyer le lien'}
      </button>
    </form>
  );
}
