'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/kit';
import { NewPasswordFields, SubmitButton } from '@/components/auth/password-fields';
import { setPasswordAfterReset } from './actions';
import type { PasswordFormState } from '@/lib/supabase/password';

const EMPTY: PasswordFormState = {};

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(setPasswordAfterReset, EMPTY);

  return (
    <form action={action} className="space-y-4">
      <NewPasswordFields disabled={pending} />
      {state.error && <Alert tone="critical">{state.error}</Alert>}
      <SubmitButton pending={pending} label="Enregistrer le nouveau mot de passe" />
    </form>
  );
}
