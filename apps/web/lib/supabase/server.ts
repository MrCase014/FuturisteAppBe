import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@futuriste/supabase';
import { supabaseAnonKey, supabaseUrl } from './config';

/**
 * Client Supabase côté serveur (composants serveur, routes, actions).
 * La session vit dans un cookie ; RLS décide de ce qui remonte.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

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
