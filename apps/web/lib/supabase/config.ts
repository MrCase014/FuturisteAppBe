/**
 * Configuration Supabase.
 *
 * Priorité : les variables d'environnement. Elles restent la bonne méthode —
 * c'est ce qui permettra un jour d'avoir un projet de recette distinct de la
 * production sans toucher au code.
 *
 * ⚠️ `SUPABASE_SERVICE_ROLE_KEY` contourne toute la sécurité RLS. Elle n'est
 * lue nulle part dans cette application (docs/12 §9).
 */

/**
 * Repli sur l'URL du projet FUTURISTE.
 *
 * Pourquoi coder une URL en dur, ce qui est normalement une mauvaise idée :
 * cette adresse n'est PAS un secret — elle part dans chaque requête du
 * navigateur de chaque utilisateur, et figure dans le bundle public. Le seul
 * secret du couple est la clé, qui elle reste une variable.
 *
 * Ce repli existe parce que l'interface d'hébergement refusait d'enregistrer
 * la variable, et qu'un blocage d'interface ne doit pas immobiliser le projet.
 * Dès que `NEXT_PUBLIC_SUPABASE_URL` est correctement posée, elle reprend la
 * main automatiquement, et la page /diagnostic indique laquelle des deux
 * sources est utilisée.
 *
 * À retirer une fois la variable en place sur les trois environnements.
 */
const FALLBACK_SUPABASE_URL = 'https://eaibpxznqfqzcxsjvykg.supabase.co';

/** Nettoie une URL de projet : pas de barre finale, pas de suffixe /rest/v1. */
function normalize(raw: string): string {
  return raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/, '');
}

export function supabaseUrl(): string {
  const fromEnv = normalize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '');
  return fromEnv || FALLBACK_SUPABASE_URL;
}

/** D'où vient l'URL réellement utilisée — affiché par /diagnostic. */
export function supabaseUrlSource(): 'variable' | 'repli' {
  const fromEnv = normalize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '');
  return fromEnv ? 'variable' : 'repli';
}

export function supabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    ''
  ).trim();
}

/**
 * La clé n'a pas de repli : c'est le seul secret du couple, et une clé
 * codée en dur dans le dépôt serait une faute.
 */
export function isSupabaseConfigured(): boolean {
  return supabaseUrl().length > 0 && supabaseAnonKey().length > 0;
}
