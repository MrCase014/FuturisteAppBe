import { checkPassword } from '@futuriste/core';
import { SUPABASE_UNAVAILABLE_MESSAGE } from './config';
import { createSupabaseServerClient } from './server';

export { isSessionFresh, FRESH_SESSION_MINUTES } from '@futuriste/core';

export interface PasswordFormState {
  error?: string;
  success?: boolean;
}

/**
 * Applique le nouveau mot de passe, puis ferme les AUTRES sessions.
 *
 * Fermer les autres sessions n'est pas un détail : si le compte avait été
 * compromis, changer le mot de passe sans évincer l'intrus le laisserait
 * connecté avec son jeton en cours.
 */
export async function applyNewPassword(
  password: string,
  confirmation: string,
): Promise<PasswordFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: 'Votre session a expiré. Recommencez depuis la connexion.' };

  const verdict = checkPassword(password, confirmation, { email: auth.user.email });
  if (!verdict.valid) return { error: verdict.message };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Message générique : le détail renvoyé par le fournisseur peut révéler
    // des informations sur le compte.
    return { error: "Le mot de passe n'a pas pu être modifié. Réessayez." };
  }

  await supabase.auth.signOut({ scope: 'others' });
  return { success: true };
}
