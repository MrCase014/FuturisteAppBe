import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js 16 remplace la convention « middleware » par « proxy ».
 * Le rôle est inchangé : rafraîchir la session à chaque requête et renvoyer
 * vers la connexion les visiteurs non authentifiés sur une page privée.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques et les images.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
