/**
 * Fraîcheur d'une session.
 *
 * La page de réinitialisation ne peut pas demander l'ancien mot de passe : par
 * construction, la personne ne le connaît plus. Elle doit donc être réservée à
 * une session ouverte à l'instant par un lien reçu par e-mail. Sans ce
 * garde-fou, une session laissée ouverte sur un téléphone prêté ou volé
 * suffirait à changer le mot de passe et à évincer le propriétaire du compte.
 *
 * Quinze minutes : assez pour lire un e-mail et cliquer, trop court pour
 * qu'une session oubliée serve de porte d'entrée.
 */
export const FRESH_SESSION_MINUTES = 15;

export function isSessionFresh(
  lastSignInAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!lastSignInAt) return false;
  const signedIn = new Date(lastSignInAt).getTime();
  if (Number.isNaN(signedIn)) return false;
  const elapsed = now.getTime() - signedIn;
  // Une date dans le futur n'est pas une preuve de fraîcheur : elle trahit une
  // horloge décalée ou une valeur forgée. On refuse.
  if (elapsed < 0) return false;
  return elapsed <= FRESH_SESSION_MINUTES * 60_000;
}
