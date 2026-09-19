import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAnonKey, supabaseUrl } from './config';

/** Pages accessibles sans être connecté. */
const PUBLIC_PATHS = [
  '/',
  '/connexion',
  '/mot-de-passe-oublie',
  '/maquettes',
  '/auth',
  '/diagnostic',
];

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Rafraîchit la session à chaque requête et protège les pages privées.
 *
 * Ce n'est PAS la sécurité du produit : masquer une page ne protège pas une
 * donnée. La sécurité réelle est dans PostgreSQL (docs/05). Ce middleware
 * évite seulement d'afficher une coquille vide à quelqu'un de déconnecté.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = supabaseUrl();
  const key = supabaseAnonKey();
  // Sans configuration, on laisse passer : le site public doit rester lisible
  // même si les variables d'environnement manquent.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = '/connexion';
    target.searchParams.set('suite', pathname);
    return NextResponse.redirect(target);
  }

  if (user && pathname === '/connexion') {
    const target = request.nextUrl.clone();
    target.pathname = '/tableau-de-bord';
    target.search = '';
    return NextResponse.redirect(target);
  }

  return response;
}
