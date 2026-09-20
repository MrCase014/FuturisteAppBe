'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { authErrorMessage, safeRedirectPath } from '@futuriste/core';

export interface FormState {
  error?: string;
  notice?: string;
}

/**
 * Les messages viennent de `authErrorMessage` (packages/core), qui porte le
 * compromis : discret sur tout ce qui dépend du compte, explicite sur ce qui
 * n'en dépend pas — une extinction du service, un quota, une panne.
 *
 * Avant, TOUTE erreur devenait « mot de passe incorrect ». Le jour où la
 * connexion par mot de passe a été éteinte au niveau du projet, l'écran a
 * donc accusé le mot de passe, et personne ne pouvait le deviner.
 */

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
  if (error) {
    return { error: authErrorMessage(error, 'SIGN_IN') ?? undefined };
  }

  redirect(suite);
}

export async function sendMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Renseignez votre adresse e-mail.' };

  const origin = (await headers()).get('origin') ?? '';
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Aucune inscription libre : un lien n'est envoyé qu'à un compte créé
      // par la direction (docs/05 §6).
      shouldCreateUser: false,
    },
  });

  // Une panne d'envoi ou un quota atteint ne dépendent d'aucune adresse : les
  // taire enverrait attendre un courriel qui n'est jamais parti.
  const failure = authErrorMessage(error, 'EMAIL_LINK');
  if (failure) return { error: failure };

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
