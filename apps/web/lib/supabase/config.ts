/**
 * Configuration Supabase lue depuis l'environnement.
 *
 * L'intégration Vercel ↔ Supabase pose ces variables automatiquement. On
 * accepte aussi les noms sans préfixe, au cas où elles seraient saisies à la
 * main côté serveur.
 *
 * ⚠️ `SUPABASE_SERVICE_ROLE_KEY` contourne toute la sécurité RLS. Elle n'est
 * lue nulle part dans cette application (docs/12 §9).
 */
export function supabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  // Une URL de projet se termine par .supabase.co — on retire un éventuel
  // suffixe /rest/v1 collé depuis le tableau de bord Supabase.
  return raw.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
}

export function supabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    ''
  );
}

export function isSupabaseConfigured(): boolean {
  return supabaseUrl().length > 0 && supabaseAnonKey().length > 0;
}
