/**
 * La navigation de chaque rôle — définie UNE seule fois.
 *
 * Le web en fait une barre latérale et une barre basse, le mobile en fait des
 * onglets. Si cette liste vivait en double, une entrée ajoutée d'un côté
 * manquerait de l'autre, et personne ne s'en apercevrait avant un utilisateur.
 *
 * Source : docs/06-ECRANS.md § « Navigation mobile selon le rôle ».
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ACADEMY_DIRECTOR'
  | 'COACH'
  | 'PLAYER'
  | 'PARENT'
  | 'CLUB_DOCTOR'
  | 'PHYSIOTHERAPIST';

export interface NavigationEntry {
  /** Identifiant stable, indépendant du libellé et de l'URL. */
  key: string;
  labelFr: string;
  /** Chemin web. Le mobile s'en sert aussi comme route expo-router. */
  href: string;
  /** Pictogramme : pas de bibliothèque d'icônes, donc rien à charger. */
  icon: string;
  /**
   * Phase de la feuille de route qui livre cet écran (docs/10).
   * Une entrée dont la phase n'est pas atteinte s'affiche, mais désactivée :
   * elle montre la forme du produit sans mener à une page vide.
   */
  phase: number;
}

/**
 * Nombre maximum d'entrées. Au-delà, on ne lit plus les libellés, on tape au
 * hasard (docs/06). La contrainte est vérifiée par un test.
 */
export const MAX_NAVIGATION_ENTRIES = 5;

/** Phase actuellement livrée. Les entrées au-delà sont désactivées. */
export const DELIVERED_PHASE = 6;

const ACCUEIL: NavigationEntry = {
  key: 'accueil',
  labelFr: 'Accueil',
  href: '/tableau-de-bord',
  icon: '🏠',
  phase: 3,
};

const STAFF_NAVIGATION: readonly NavigationEntry[] = [
  ACCUEIL,
  { key: 'joueurs', labelFr: 'Joueurs', href: '/joueurs', icon: '👥', phase: 4 },
  { key: 'seances', labelFr: 'Séances', href: '/seances', icon: '📋', phase: 6 },
  { key: 'stats', labelFr: 'Stats', href: '/statistiques', icon: '📊', phase: 10 },
  { key: 'gerer', labelFr: 'Gérer', href: '/parametres', icon: '⚙️', phase: 3 },
];

/**
 * Navigation du personnel soignant.
 *
 * Volontairement courte, et volontairement SANS « Séances », « Stats » ni
 * « Progression » : un soignant n'a pas d'usage clinique des performances
 * d'un enfant. Ce que la base lui refuse, l'interface ne le lui propose pas —
 * sans quoi il verrait des menus menant à des pages vides, et croirait à une
 * panne plutôt qu'à une règle.
 */
const MEDICAL_NAVIGATION: readonly NavigationEntry[] = [
  ACCUEIL,
  { key: 'infirmerie', labelFr: 'Infirmerie', href: '/infirmerie', icon: '🩺', phase: 4 },
  { key: 'joueurs', labelFr: 'Joueurs', href: '/joueurs', icon: '👥', phase: 4 },
  { key: 'profil', labelFr: 'Profil', href: '/compte', icon: '👤', phase: 3 },
];

const NAVIGATION_BY_ROLE: Record<UserRole, readonly NavigationEntry[]> = {
  SUPER_ADMIN: STAFF_NAVIGATION,
  ACADEMY_DIRECTOR: STAFF_NAVIGATION,
  CLUB_DOCTOR: MEDICAL_NAVIGATION,
  PHYSIOTHERAPIST: MEDICAL_NAVIGATION,
  COACH: [
    ACCUEIL,
    { key: 'seances', labelFr: 'Séances', href: '/seances', icon: '📋', phase: 6 },
    { key: 'joueurs', labelFr: 'Joueurs', href: '/joueurs', icon: '👥', phase: 4 },
    { key: 'progression', labelFr: 'Progression', href: '/progression', icon: '📊', phase: 8 },
    { key: 'profil', labelFr: 'Profil', href: '/compte', icon: '👤', phase: 3 },
  ],
  PLAYER: [
    ACCUEIL,
    { key: 'objectifs', labelFr: 'Objectifs', href: '/objectifs', icon: '🎯', phase: 8 },
    { key: 'badges', labelFr: 'Badges', href: '/badges', icon: '🏅', phase: 8 },
    { key: 'calendrier', labelFr: 'Calendrier', href: '/calendrier', icon: '📅', phase: 9 },
    { key: 'profil', labelFr: 'Profil', href: '/compte', icon: '👤', phase: 3 },
  ],
  PARENT: [
    ACCUEIL,
    { key: 'enfant', labelFr: 'Mon enfant', href: '/mon-enfant', icon: '👦', phase: 8 },
    { key: 'calendrier', labelFr: 'Calendrier', href: '/calendrier', icon: '📅', phase: 9 },
    { key: 'annonces', labelFr: 'Annonces', href: '/annonces', icon: '💬', phase: 9 },
    { key: 'profil', labelFr: 'Profil', href: '/compte', icon: '👤', phase: 3 },
  ],
};

/** Les entrées de navigation d'un rôle, dans l'ordre d'affichage. */
export function navigationForRole(role: UserRole): readonly NavigationEntry[] {
  return NAVIGATION_BY_ROLE[role];
}

/** Une entrée est-elle déjà livrée, ou seulement annoncée ? */
export function isEntryAvailable(entry: NavigationEntry): boolean {
  return entry.phase <= DELIVERED_PHASE;
}

/**
 * L'entrée correspondant au chemin courant.
 *
 * On compare par préfixe de segment : `/joueurs/12` doit allumer « Joueurs »,
 * mais `/joueurs-archives` ne doit pas — d'où la comparaison sur la barre
 * oblique, et non sur la simple chaîne.
 */
export function activeEntryKey(role: UserRole, pathname: string): string | null {
  const match = navigationForRole(role).find(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`),
  );
  return match ? match.key : null;
}

/**
 * Qui peut quoi — écrit UNE fois.
 *
 * Ces fonctions ne protègent rien : la protection est dans PostgreSQL. Elles
 * évitent qu'un écran propose une action que la base refusera, et surtout
 * qu'une comparaison de chaînes se retrouve recopiée dans dix pages, où la
 * onzième oubliera un rôle.
 */

/** Direction : super administrateur et directeur d'académie. */
export function isStaffRole(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'ACADEMY_DIRECTOR';
}

/** Personnel soignant : médecin du club et kinésithérapeutes. */
export function isMedicalRole(role: UserRole): boolean {
  return role === 'CLUB_DOCTOR' || role === 'PHYSIOTHERAPIST';
}

/**
 * Le dossier CLINIQUE n'est ouvert qu'aux soignants — direction comprise dans
 * l'exclusion. Voir la migration 20260919000004 pour le raisonnement.
 */
export function canReadClinicalRecord(role: UserRole): boolean {
  return isMedicalRole(role);
}

/** L'aptitude circule : direction, coach de l'enfant, parent, soignant. */
export function canReadClearance(role: UserRole): boolean {
  return isStaffRole(role) || isMedicalRole(role) || role === 'COACH' || role === 'PARENT';
}
