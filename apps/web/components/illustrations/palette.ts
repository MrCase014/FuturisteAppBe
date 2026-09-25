import tokens from '@futuriste/ui/tokens/colors.json';

/**
 * La palette des illustrations, lue depuis les jetons du design system.
 *
 * Une seule valeur par couleur, identique en thème clair et en thème sombre.
 * Une illustration est une image : elle ne change pas de couleur quand
 * l'interface s'assombrit — même règle que pour les schémas tactiques.
 *
 * Les teintes viennent du contexte réel du club : terre battue ocre, mur de
 * parpaings, ciel de saison sèche, maillots violets. Pas d'une banque
 * d'images générique où tous les terrains sont verts et tous les ciels
 * européens.
 */
export const ILLU = tokens.illustration;
