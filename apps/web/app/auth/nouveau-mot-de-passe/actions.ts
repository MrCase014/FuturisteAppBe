'use server';

import { redirect } from 'next/navigation';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { applyNewPassword, isSessionFresh, type PasswordFormState } from '@/lib/supabase/password';

/**
 * Définit un nouveau mot de passe après un lien de réinitialisation.
 *
 * L'ancien mot de passe n'est pas demandé : la personne ne le connaît plus.
 * En contrepartie, la session doit être fraîche (voir isSessionFresh).
 */
export async function setPasswordAfterReset(
  _prev: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return { error: 'Votre lien a expiré. Demandez-en un nouveau depuis la page de connexion.' };
  }

  if (!isSessionFresh(auth.user.last_sign_in_at)) {
    return {
      error:
        'Ce lien est trop ancien pour changer un mot de passe. ' +
        'Demandez-en un nouveau depuis la page de connexion.',
    };
  }

  const result = await applyNewPassword(
    String(formData.get('password') ?? ''),
    String(formData.get('confirmation') ?? ''),
  );
  if (result.error) return result;

  redirect('/tableau-de-bord?motdepasse=change');
}
