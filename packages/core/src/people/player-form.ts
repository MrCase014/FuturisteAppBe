import { computeAge } from '../utils/age';
import { AGE_GROUPS } from '../methodology/age-groups';

/**
 * Règles de saisie d'un joueur.
 *
 * Elles vivent ici, et non dans le formulaire : la même vérification doit
 * valoir pour le web, le mobile et toute reprise de données. Un contrôle qui
 * n'existe que dans un écran est un contrôle qu'on contourne en appelant l'API.
 */

/** Âges acceptés par l'académie (docs/11 : U7 → U18). */
export const MIN_PLAYER_AGE = Math.min(...AGE_GROUPS.map((g) => g.minAge));
export const MAX_PLAYER_AGE = Math.max(...AGE_GROUPS.map((g) => g.maxAge));

export const MAX_NAME_LENGTH = 80;
export const MIN_JERSEY = 1;
export const MAX_JERSEY = 99;

export interface PlayerInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  jerseyNumber?: string;
  dominantFoot?: string;
  status?: string;
}

export interface FieldError {
  field: keyof PlayerInput;
  message: string;
}

const GENDERS = ['F', 'M'];
const FEET = ['LEFT', 'RIGHT', 'BOTH'];
const STATUSES = ['ACTIVE', 'INJURED', 'ON_LOAN', 'LEFT', 'TRIAL'];

/** Date ISO stricte : `2015-03-08`. `new Date()` accepte beaucoup trop. */
function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Rejette le 31 février, que `Date` convertirait silencieusement en 3 mars.
  if (date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export function validatePlayer(input: PlayerInput, now: Date = new Date()): FieldError[] {
  const errors: FieldError[] = [];

  const first = input.firstName.trim();
  const last = input.lastName.trim();

  if (first.length < 2) errors.push({ field: 'firstName', message: 'Le prénom est trop court.' });
  else if (first.length > MAX_NAME_LENGTH)
    errors.push({
      field: 'firstName',
      message: `Le prénom dépasse ${MAX_NAME_LENGTH} caractères.`,
    });

  if (last.length < 2) errors.push({ field: 'lastName', message: 'Le nom est trop court.' });
  else if (last.length > MAX_NAME_LENGTH)
    errors.push({ field: 'lastName', message: `Le nom dépasse ${MAX_NAME_LENGTH} caractères.` });

  const birth = parseIsoDate(input.birthDate);
  if (!birth) {
    errors.push({ field: 'birthDate', message: 'Renseignez une date de naissance valide.' });
  } else if (birth.getTime() > now.getTime()) {
    errors.push({ field: 'birthDate', message: 'La date de naissance est dans le futur.' });
  } else {
    const age = computeAge(birth, now);
    if (age < MIN_PLAYER_AGE || age > MAX_PLAYER_AGE) {
      errors.push({
        field: 'birthDate',
        // On dit l'âge calculé : « hors limites » sans le chiffre laisse
        // chercher l'erreur de saisie.
        message: `L'académie accueille les ${MIN_PLAYER_AGE} à ${MAX_PLAYER_AGE} ans. Cette date donne ${age} ans.`,
      });
    }
  }

  if (!GENDERS.includes(input.gender)) {
    errors.push({ field: 'gender', message: 'Renseignez le genre du joueur.' });
  }

  const jersey = (input.jerseyNumber ?? '').trim();
  if (jersey) {
    const value = Number(jersey);
    if (!Number.isInteger(value) || value < MIN_JERSEY || value > MAX_JERSEY) {
      errors.push({
        field: 'jerseyNumber',
        message: `Le numéro de maillot va de ${MIN_JERSEY} à ${MAX_JERSEY}.`,
      });
    }
  }

  const foot = (input.dominantFoot ?? '').trim();
  if (foot && !FEET.includes(foot)) {
    errors.push({ field: 'dominantFoot', message: 'Pied fort inconnu.' });
  }

  const status = (input.status ?? '').trim();
  if (status && !STATUSES.includes(status)) {
    errors.push({ field: 'status', message: 'Statut inconnu.' });
  }

  return errors;
}

/** Libellés français — une seule source, pour les listes comme les fiches. */
export const GENDER_LABEL: Record<string, string> = { F: 'Fille', M: 'Garçon', MIXED: 'Mixte' };

export const FOOT_LABEL: Record<string, string> = {
  LEFT: 'Gauche',
  RIGHT: 'Droit',
  BOTH: 'Les deux',
};

export const PLAYER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif',
  INJURED: 'Blessé',
  ON_LOAN: 'En prêt',
  LEFT: 'Parti',
  TRIAL: 'À l’essai',
};
