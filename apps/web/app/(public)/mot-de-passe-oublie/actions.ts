'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { FormState } from '../connexion/actions';

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured()) {
    return { error: "Cette fonction n'est pas encore configurée sur ce serveur." };
  }

  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Renseignez votre adresse e-mail.' };

  const origin = (await headers()).get('origin') ?? '';
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?suite=/compte/mot-de-passe`,
  });

  // Réponse identique que le compte existe ou non : on ne révèle jamais
  // qui fréquente l'académie.
  return {
    notice: 'Si un compte existe pour cette adresse, un lien vient de vous être envoyé.',
  };
}
