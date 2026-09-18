'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { safeRedirectPath } from '@futuriste/core';

export interface FormState {
  error?: string;
  notice?: string;
}

/**
 * Messages en français, et volontairement peu bavards : on ne révèle jamais
 * si une adresse existe dans la base. Ce serait un moyen de découvrir qui
 * fréquente l'académie.
 */
const GENERIC_ERROR = 'Adresse e-mail ou mot de passe incorrect.';

export async function signInWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const suite = safeRedirectPath(String(formData.get('suite') ?? ''));

  if (!email || !password) {
    return { error: 'Renseignez votre adresse e-mail et votre mot de passe.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: GENERIC_ERROR };

  redirect(suite);
}

export async function sendMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Renseignez votre adresse e-mail.' };

  const origin = (await headers()).get('origin') ?? '';
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Aucune inscription libre : un lien n'est envoyé qu'à un compte créé
      // par la direction (docs/05 §6).
      shouldCreateUser: false,
    },
  });

  // Réponse identique que le compte existe ou non.
  return {
    notice:
      'Si un compte existe pour cette adresse, un lien de connexion vient de vous être envoyé.',
  };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  // Sans client, il n'y a de toute façon aucune session à fermer.
  await supabase?.auth.signOut();
  redirect('/connexion');
}
