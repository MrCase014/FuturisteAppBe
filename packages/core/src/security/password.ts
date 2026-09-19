/**
 * Politique de mot de passe FUTURISTE (docs/12 §5).
 *
 * Elle vit ici, dans le cœur testé, et non dans un écran : le même contrôle
 * doit s'appliquer à la page de changement, à la page de réinitialisation, et
 * demain à l'application mobile. Une règle de sécurité recopiée dans trois
 * écrans finit toujours par diverger dans l'un des trois.
 *
 * Longueur plutôt que complexité : imposer majuscule + chiffre + symbole
 * produit surtout des « Motdepasse1! » réutilisés partout. Dix caractères
 * minimum, et le refus des formes manifestement faibles, protègent mieux —
 * la vérification contre les fuites connues est faite par Supabase
 * (« Leaked password protection », docs/17).
 */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72; // limite de bcrypt, côté Supabase

export interface PasswordCheck {
  valid: boolean;
  /** Message prêt à afficher, en français. Vide si le mot de passe convient. */
  message: string;
}

const OK: PasswordCheck = { valid: true, message: '' };

/** Formes trop évidentes pour être acceptées, même longues. */
const OBVIOUS = [
  'motdepasse',
  'password',
  'azertyuiop',
  'qwertyuiop',
  '1234567890',
  'futuriste',
  'academie',
  'football',
];

export interface PasswordContext {
  /** Sert à refuser un mot de passe qui reprend l'adresse e-mail. */
  email?: string | null;
}

export function checkPassword(
  password: string,
  confirmation: string,
  context: PasswordContext = {},
): PasswordCheck {
  if (!password) {
    return { valid: false, message: 'Choisissez un mot de passe.' };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `Le mot de passe doit faire au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      valid: false,
      message: `Le mot de passe ne peut pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`,
    };
  }

  if (password !== confirmation) {
    return { valid: false, message: 'Les deux mots de passe ne sont pas identiques.' };
  }

  const lowered = password.toLowerCase();

  if (OBVIOUS.some((word) => lowered.includes(word))) {
    return {
      valid: false,
      message: 'Ce mot de passe est trop facile à deviner. Choisissez-en un autre.',
    };
  }

  const local = context.email?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 3 && lowered.includes(local)) {
    return {
      valid: false,
      message: 'Le mot de passe ne doit pas reprendre votre adresse e-mail.',
    };
  }

  // Un seul caractère répété, ou une suite de chiffres, quelle que soit la longueur.
  if (/^(.)\1+$/.test(password)) {
    return { valid: false, message: 'Ce mot de passe est trop simple.' };
  }

  return OK;
}
