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

/**
 * La référence du projet Supabase : le sous-domaine de son URL.
 *
 * C'est la chaîne courte qui apparaît aussi dans l'adresse du tableau de
 * bord (`/project/<ref>`). La comparer à l'œil sur un téléphone est
 * autrement plus simple que de comparer deux URL complètes — et c'est
 * exactement la vérification qui sépare « la configuration est mauvaise » de
 * « l'application parle à un autre projet ».
 */
export function supabaseProjectRef(): string {
  const url = supabaseUrl();
  const match = /^https?:\/\/([^.]+)\./.exec(url);
  return match?.[1] ?? '';
}

/**
 * De quelle FAMILLE est la clé publique posée — jamais sa valeur.
 *
 * Supabase migre ses clés : l'ancienne `anon` est un jeton JWT (« eyJ… »,
 * plusieurs centaines de caractères), la nouvelle est une clé publiable
 * (« sb_publishable_… », une cinquantaine). Les deux fonctionnent, et une
 * longueur seule ne permet pas de les distinguer d'un copier-coller tronqué.
 *
 * Nommer la famille lève ce doute sans rien exposer : cette clé part déjà
 * dans chaque page servie au navigateur.
 *
 * Le cas « secrète » n'est pas théorique. Une clé `sb_secret_…` posée dans
 * une variable `NEXT_PUBLIC_…` serait livrée à tous les visiteurs, et
 * donnerait à n'importe qui les droits d'administration de la base — RLS
 * comprise. La page doit le crier, pas le mentionner.
 */
export type SupabaseKeyKind = 'absente' | 'jeton-jwt' | 'publiable' | 'SECRÈTE' | 'inconnue';

export function supabaseKeyKind(): SupabaseKeyKind {
  const key = supabaseAnonKey();
  if (key.length === 0) return 'absente';
  if (key.startsWith('sb_secret_')) return 'SECRÈTE';
  if (key.startsWith('sb_publishable_')) return 'publiable';
  if (key.startsWith('eyJ')) return 'jeton-jwt';
  return 'inconnue';
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

/**
 * Message unique affiché quand la configuration manque.
 *
 * Il dit ce qui se passe sans nommer la variable en cause : un message
 * d'erreur public n'a pas à décrire la plomberie du serveur.
 */
export const SUPABASE_UNAVAILABLE_MESSAGE =
  "Le service n'est pas disponible pour le moment. Réessayez dans quelques minutes, " +
  "et prévenez l'académie si cela persiste.";
