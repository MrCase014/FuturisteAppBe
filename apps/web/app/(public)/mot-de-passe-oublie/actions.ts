'use server';

import { headers } from 'next/headers';
import { authErrorMessage } from '@futuriste/core';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import type { FormState } from '../connexion/actions';

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Renseignez votre adresse e-mail.' };

  const origin = (await headers()).get('origin') ?? '';
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?suite=/auth/nouveau-mot-de-passe`,
  });

  // Le résultat était jeté : l'écran annonçait un envoi même quand le service
  // de courriel avait échoué, et l'on attendait un message qui n'existait pas.
  // Ces erreurs-là ne dépendent d'aucune adresse : les dire ne révèle rien.
  const failure = authErrorMessage(error, 'EMAIL_LINK');
  if (failure) return { error: failure };

  // Réponse identique que le compte existe ou non : on ne révèle jamais
  // qui fréquente l'académie.
  return {
    notice: 'Si un compte existe pour cette adresse, un lien vient de vous être envoyé.',
  };
}
