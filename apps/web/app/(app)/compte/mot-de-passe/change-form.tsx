'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/kit';
import {
  CurrentPasswordField,
  NewPasswordFields,
  SubmitButton,
} from '@/components/auth/password-fields';
import { changePassword } from './actions';
import type { PasswordFormState } from '@/lib/supabase/password';

const EMPTY: PasswordFormState = {};

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, EMPTY);

  if (state.success) {
    return (
      <Alert tone="good">Mot de passe modifié. Vos autres appareils ont été déconnectés.</Alert>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <CurrentPasswordField disabled={pending} />
      <hr className="border-surface-border" />
      <NewPasswordFields disabled={pending} />
      {state.error && <Alert tone="critical">{state.error}</Alert>}
      <SubmitButton pending={pending} label="Changer mon mot de passe" />
    </form>
  );
}
