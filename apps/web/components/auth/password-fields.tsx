'use client';

import { PASSWORD_MIN_LENGTH } from '@futuriste/core';

const inputClass =
  'min-h-touch w-full rounded-md border border-surface-border bg-surface-app px-3 text-body ' +
  'text-content-primary outline-none focus:border-futuriste-violet ' +
  'focus:ring-2 focus:ring-futuriste-violet/30 disabled:opacity-60';

/** Les deux champs du nouveau mot de passe, partagés par les deux parcours. */
export function NewPasswordFields({ disabled = false }: { disabled?: boolean }) {
  return (
    <>
      <div>
        <label htmlFor="password" className="mb-1 block text-small text-content-secondary">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          disabled={disabled}
          className={inputClass}
        />
        <p className="mt-1 text-caption text-content-muted">
          {PASSWORD_MIN_LENGTH} caractères minimum. Une phrase dont vous vous souvenez vaut mieux
          qu&apos;un mot compliqué que vous noterez quelque part.
        </p>
      </div>

      <div>
        <label htmlFor="confirmation" className="mb-1 block text-small text-content-secondary">
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          disabled={disabled}
          className={inputClass}
        />
      </div>
    </>
  );
}

export function CurrentPasswordField({ disabled = false }: { disabled?: boolean }) {
  return (
    <div>
      <label htmlFor="current" className="mb-1 block text-small text-content-secondary">
        Mot de passe actuel
      </label>
      <input
        id="current"
        name="current"
        type="password"
        autoComplete="current-password"
        required
        disabled={disabled}
        className={inputClass}
      />
    </div>
  );
}

export function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch w-full rounded-md bg-futuriste-violet px-4 font-medium text-white
                 hover:bg-futuriste-violet-deep disabled:opacity-60"
    >
      {pending ? 'Enregistrement…' : label}
    </button>
  );
}
