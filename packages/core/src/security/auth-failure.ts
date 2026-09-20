/**
 * Traduire une erreur d'authentification en message — sans trop en dire.
 *
 * LE COMPROMIS, ÉCRIT NOIR SUR BLANC
 *
 * Un écran de connexion honnête et un écran de connexion discret tirent en
 * sens contraire. Dire « ce compte n'est pas confirmé » révèle que l'adresse
 * existe — donc, dans une académie de mineurs, que cette famille fréquente le
 * club. C'est une information que personne n'a à obtenir en tapant des
 * adresses au hasard (docs/12).
 *
 * Mais tout écraser dans « identifiants incorrects » a un coût réel, mesuré
 * le jour où la présidence n'a pas pu se connecter : la connexion par mot de
 * passe était éteinte au niveau du projet, et l'écran répondait
 * « mot de passe incorrect ». Une personne seule, un dimanche, ne sort pas de
 * cette boucle.
 *
 * D'où la règle, et elle tient en une phrase :
 *
 *   On distingue ce qui ne dépend PAS du compte — une panne, une extinction,
 *   un quota — et on garde le message générique pour tout ce qui dépend du
 *   compte, mot de passe faux et compte non confirmé compris.
 *
 * Ces cas-là sont vrais quelle que soit l'adresse saisie : les nommer ne
 * révèle donc rien de personne.
 */

export type AuthContext = 'SIGN_IN' | 'EMAIL_LINK';

export type AuthFailure =
  /** Identifiants refusés, compte non confirmé, compte inexistant : indistincts. */
  | 'CREDENTIALS'
  /** La connexion par mot de passe est éteinte sur le projet. */
  | 'PROVIDER_DISABLED'
  /** Trop de tentatives, ou quota d'envoi atteint. */
  | 'RATE_LIMITED'
  /** L'envoi du courriel a échoué côté serveur : rien n'est parti. */
  | 'MAIL_UNAVAILABLE'
  /** Panne inattendue du service d'authentification. */
  | 'UNAVAILABLE';

/** La forme minimale d'une erreur Supabase, sans dépendre de la bibliothèque. */
export interface AuthErrorLike {
  code?: string | null;
  status?: number | null;
  message?: string | null;
}

const DISABLED_CODES = new Set(['email_provider_disabled', 'signup_disabled', 'user_banned']);
const RATE_CODES = new Set([
  'over_request_rate_limit',
  'over_email_send_rate_limit',
  'over_sms_send_rate_limit',
]);

/** Repli sur le texte anglais quand le code manque (anciennes versions). */
const says = (message: string | null | undefined, ...needles: string[]): boolean => {
  const haystack = (message ?? '').toLowerCase();
  return needles.some((n) => haystack.includes(n));
};

export function classifyAuthFailure(
  error: AuthErrorLike | null | undefined,
  context: AuthContext,
): AuthFailure | null {
  if (!error) return null;

  const code = error.code ?? '';

  if (
    DISABLED_CODES.has(code) ||
    says(error.message, 'logins are disabled', 'provider is not enabled')
  ) {
    return 'PROVIDER_DISABLED';
  }

  if (RATE_CODES.has(code) || error.status === 429 || says(error.message, 'rate limit')) {
    return 'RATE_LIMITED';
  }

  // 5xx : le service a échoué, ce n'est pas la faute de qui tape son mot de
  // passe. Sur un envoi de courriel, cela veut dire qu'AUCUN message n'est
  // parti — et c'est précisément ce qu'il faut dire plutôt que « vérifiez
  // votre boîte », qui envoie attendre un message qui n'existe pas.
  if ((error.status ?? 0) >= 500 || code === 'unexpected_failure') {
    return context === 'EMAIL_LINK' ? 'MAIL_UNAVAILABLE' : 'UNAVAILABLE';
  }

  return 'CREDENTIALS';
}

const MESSAGES: Record<AuthFailure, string> = {
  CREDENTIALS: 'Adresse e-mail ou mot de passe incorrect.',
  PROVIDER_DISABLED:
    'La connexion par mot de passe est désactivée sur le projet. ' +
    'La direction doit la réactiver dans la configuration du service.',
  RATE_LIMITED: 'Trop de tentatives en peu de temps. Attendez quelques minutes avant de réessayer.',
  MAIL_UNAVAILABLE:
    "L'envoi de courriels est indisponible : aucun message n'est parti. " +
    "N'attendez pas de courriel, prévenez la direction.",
  UNAVAILABLE: "Le service d'authentification est momentanément indisponible. Réessayez.",
};

export function authFailureMessage(failure: AuthFailure): string {
  return MESSAGES[failure];
}

/** Raccourci : de l'erreur brute au message affichable. */
export function authErrorMessage(
  error: AuthErrorLike | null | undefined,
  context: AuthContext,
): string | null {
  const failure = classifyAuthFailure(error, context);
  return failure ? MESSAGES[failure] : null;
}
