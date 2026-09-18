'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@futuriste/supabase';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config';

/**
 * Client Supabase côté navigateur. Clé anonyme uniquement.
 * Renvoie `null` sans configuration, comme son équivalent serveur : une
 * exception ici casserait la page entière dans le navigateur.
 */
export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
