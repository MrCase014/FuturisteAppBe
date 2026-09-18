import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@futuriste/supabase';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function build(cookieStore: CookieStore) {
  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : le rafraîchissement de session
          // est alors assuré par le middleware. Rien à faire ici.
        }
      },
    },
  });
}

export type SupabaseServerClient = ReturnType<typeof build>;

/**
 * Client Supabase côté serveur (composants serveur, routes, actions).
 * La session vit dans un cookie ; RLS décide de ce qui remonte.
 *
 * Renvoie `null` quand la configuration manque, AU LIEU de laisser la
 * bibliothèque lever une exception — une exception ici se traduit par une
 * erreur 500 en production, c'est-à-dire une page blanche et aucune
 * explication pour la personne qui essaie de se connecter.
 *
 * Le type de retour `| null` n'est pas une politesse : il oblige chaque
 * appelant à traiter le cas, et le compilateur refuse le code qui l'oublie.
 * C'est la raison d'être de cette forme — la protection ne repose plus sur
 * la mémoire de celui qui ajoute une page.
 */
export async function createSupabaseServerClient(): Promise<SupabaseServerClient | null> {
  if (!isSupabaseConfigured()) return null;
  return build(await cookies());
}
