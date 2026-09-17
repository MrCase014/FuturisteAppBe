'use client';

import { useActionState } from 'react';
import { sendMagicLink, signInWithPassword, type FormState } from './actions';
import { Alert } from '@/components/kit';

const EMPTY: FormState = {};

export function LoginForm({ suite, disabled }: { suite: string; disabled: boolean }) {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPassword,
    EMPTY,
  );
  const [linkState, linkAction, linkPending] = useActionState(sendMagicLink, EMPTY);

  const inputClass =
    'min-h-touch w-full rounded-md border border-surface-border bg-surface-app px-3 text-body ' +
    'text-content-primary outline-none focus:border-futuriste-violet ' +
    'focus:ring-2 focus:ring-futuriste-violet/30 disabled:opacity-60';

  return (
    <div className="space-y-5">
      <form action={passwordAction} className="space-y-3">
        <input type="hidden" name="suite" value={suite} />

        <div>
          <label htmlFor="email" className="mb-1 block text-small text-content-secondary">
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={disabled}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-small text-content-secondary">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={disabled}
            className={inputClass}
          />
        </div>

        {passwordState.error && <Alert tone="critical">{passwordState.error}</Alert>}

        <button
          type="submit"
          disabled={disabled || passwordPending}
          className="min-h-touch w-full rounded-md bg-futuriste-violet px-4 font-medium text-white
                     hover:bg-futuriste-violet-deep disabled:opacity-60"
        >
          {passwordPending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="flex items-center gap-3 text-caption text-content-muted">
        <span className="h-px flex-1 bg-surface-border" />
        ou
        <span className="h-px flex-1 bg-surface-border" />
      </div>

      <form action={linkAction} className="space-y-3">
        <div>
          <label htmlFor="magic-email" className="mb-1 block text-small text-content-secondary">
            Recevoir un lien par e-mail
          </label>
          <input
            id="magic-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={disabled}
            className={inputClass}
          />
        </div>

        {linkState.error && <Alert tone="critical">{linkState.error}</Alert>}
        {linkState.notice && <Alert tone="good">{linkState.notice}</Alert>}

        <button
          type="submit"
          disabled={disabled || linkPending}
          className="min-h-touch w-full rounded-md bg-surface-raised px-4 font-medium
                     text-content-primary hover:bg-surface-border disabled:opacity-60"
        >
          {linkPending ? 'Envoi…' : 'M’envoyer un lien'}
        </button>
        <p className="text-caption text-content-muted">
          Pratique si vous avez oublié votre mot de passe : vous cliquez sur le lien reçu et vous
          êtes connecté.
        </p>
      </form>
    </div>
  );
}
