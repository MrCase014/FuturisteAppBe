/**
 * Validation des destinations de redirection après connexion.
 *
 * Le paramètre `suite` vient de l'URL, donc d'un tiers potentiellement
 * malveillant : n'importe qui peut envoyer à un parent un lien
 * /connexion?suite=… . Vérifier « commence par / » NE SUFFIT PAS —
 * `//exemple-malveillant.fr` commence par « / » et le navigateur le lit comme
 * une URL absolue vers un autre domaine. L'utilisateur se connecterait
 * légitimement puis serait éjecté vers un site tiers, avec l'air d'y avoir été
 * conduit par l'académie : le point de départ classique d'un hameçonnage.
 *
 * On n'accepte donc qu'un chemin interne, strictement.
 */
const DEFAULT_DESTINATION = '/tableau-de-bord';

export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_DESTINATION;

  const value = raw.trim();

  // Un seul « / » au début, et rien qui puisse être relu comme un domaine.
  if (!value.startsWith('/')) return DEFAULT_DESTINATION;
  if (value.startsWith('//')) return DEFAULT_DESTINATION;
  if (value.startsWith('/\\')) return DEFAULT_DESTINATION;

  // Ni protocole déguisé, ni retour à la ligne (injection d'en-tête).
  if (/[\r\n]/.test(value)) return DEFAULT_DESTINATION;
  if (/^\/+[a-z][a-z0-9+.-]*:/i.test(value)) return DEFAULT_DESTINATION;

  return value;
}
