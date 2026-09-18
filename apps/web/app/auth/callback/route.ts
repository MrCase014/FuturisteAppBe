import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@futuriste/core';

/**
 * Retour du lien magique et de la réinitialisation de mot de passe.
 * Supabase renvoie ici avec un code à échanger contre une session.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const suite = safeRedirectPath(searchParams.get('suite'));

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien_invalide`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien_expire`);
  }
  return NextResponse.redirect(`${origin}${suite}`);
}
