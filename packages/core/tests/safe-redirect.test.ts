import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '../src';

/**
 * Ces cas ne sont pas théoriques : « commence par / » était la vérification
 * en place, et `//exemple.fr` la franchit tout en emmenant l'utilisateur hors
 * du site. C'est le point de départ classique d'un hameçonnage — un parent
 * cliquant un lien de connexion FUTURISTE et atterrissant ailleurs.
 */
describe('safeRedirectPath', () => {
  it('accepte un chemin interne', () => {
    expect(safeRedirectPath('/tableau-de-bord')).toBe('/tableau-de-bord');
    expect(safeRedirectPath('/joueurs/42')).toBe('/joueurs/42');
    expect(safeRedirectPath('/seances?date=2026-09-18')).toBe('/seances?date=2026-09-18');
  });

  it('refuse une URL protocole-relative, qui mène hors du site', () => {
    expect(safeRedirectPath('//exemple-malveillant.fr')).toBe('/tableau-de-bord');
    expect(safeRedirectPath('///exemple-malveillant.fr')).toBe('/tableau-de-bord');
  });

  it('refuse la variante à antislash, que les navigateurs normalisent', () => {
    expect(safeRedirectPath('/\\exemple-malveillant.fr')).toBe('/tableau-de-bord');
  });

  it('refuse une URL absolue', () => {
    expect(safeRedirectPath('https://exemple-malveillant.fr')).toBe('/tableau-de-bord');
    expect(safeRedirectPath('http://exemple-malveillant.fr')).toBe('/tableau-de-bord');
  });

  it('refuse un pseudo-protocole, y compris précédé de barres', () => {
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/tableau-de-bord');
    // Rejeté aussi : un chemin ne ressemble jamais à un protocole, et refuser
    // large coûte moins cher ici que laisser passer une forme non anticipée.
    expect(safeRedirectPath('/javascript:alert(1)')).toBe('/tableau-de-bord');
    expect(safeRedirectPath('//data:text/html,<script>')).toBe('/tableau-de-bord');
  });

  it("refuse un retour à la ligne (injection d'en-tête)", () => {
    expect(safeRedirectPath('/ok\r\nSet-Cookie: session=vole')).toBe('/tableau-de-bord');
    expect(safeRedirectPath('/ok\nLocation: https://ailleurs.fr')).toBe('/tableau-de-bord');
  });

  it('retombe sur la valeur par défaut quand rien n’est fourni', () => {
    expect(safeRedirectPath('')).toBe('/tableau-de-bord');
    expect(safeRedirectPath(null)).toBe('/tableau-de-bord');
    expect(safeRedirectPath(undefined)).toBe('/tableau-de-bord');
  });
});
