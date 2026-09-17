import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type FuturisteClient = SupabaseClient<Database>;

export interface ClientConfig {
  url: string;
  anonKey: string;
}

/**
 * Client Supabase typé.
 *
 * Il n'utilise QUE la clé anonyme : c'est RLS qui décide de ce qui remonte,
 * pas l'application. La clé `service_role` contourne RLS — elle ne doit jamais
 * quitter le serveur, et jamais approcher un bundle client (docs/12 §9).
 */
export function createFuturisteClient({ url, anonKey }: ClientConfig): FuturisteClient {
  if (!url || !anonKey) {
    throw new Error(
      'Configuration Supabase manquante. Copiez .env.example en .env.local et renseignez ' +
        'NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
