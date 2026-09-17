'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@futuriste/supabase';
import { supabaseAnonKey, supabaseUrl } from './config';

/** Client Supabase côté navigateur. Clé anonyme uniquement. */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
