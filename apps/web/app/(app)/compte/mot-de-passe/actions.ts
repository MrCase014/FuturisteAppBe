'use server';

import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { applyNewPassword, type PasswordFormState } from '@/lib/supabase/password';

/**
 * Changement volontaire de mot de passe, par une personne déjà connectée.
 *
 * Le mot de passe actuel est exigé : sans lui, une session laissée ouverte sur
 * un téléphone prêté suffirait à prendre le compte. C'est la différence avec la
 * page de réinitialisation, où la personne ne peut par définition pas le
 * fournir — et qui exige en échange une session de moins de 15 minutes.
 */
export async function changePassword(
  _prev: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const current = String(formData.get('current') ?? '');
  if (!current) return { error: 'Saisissez votre mot de passe actuel.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.email) {
    return { error: 'Votre session a expiré. Reconnectez-vous.' };
  }

  // Vérification du mot de passe actuel auprès du fournisseur.
  const { error: wrongCurrent } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: current,
  });
  if (wrongCurrent) {
    return { error: 'Le mot de passe actuel est incorrect.' };
  }

  return applyNewPassword(
    String(formData.get('password') ?? ''),
    String(formData.get('confirmation') ?? ''),
  );
}
