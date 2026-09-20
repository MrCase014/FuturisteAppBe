/**
 * Le langage visuel des schémas (docs/14 §3).
 *
 * Ce vocabulaire n'est pas inventé : c'est celui que les éducateurs utilisent
 * déjà au tableau. Un coach doit le reconnaître au premier schéma, sans
 * apprentissage — d'où l'interdiction de « faire joli » ici.
 *
 * Trois règles tiennent dans les tables ci-dessous :
 *
 *  1. Aucune couleur n'est écrite en dur : toutes viennent de
 *     `tokens/colors.json`, la source unique du design system (règle 4).
 *  2. Aucune information ne repose sur la SEULE couleur — l'équipe A a des
 *     disques pleins, l'équipe B un contour épais, le joker un contour noir.
 *     Un daltonien lit le schéma, et un schéma imprimé en noir et blanc
 *     reste lisible.
 *  3. Le vocabulaire ne change PAS entre thème clair et thème sombre. Un
 *     joueur violet est violet, sur un téléphone, sur un vidéoprojecteur ou
 *     sur papier. C'est le terrain qui s'assombrit légèrement, pas le
 *     langage — sinon il faudrait le réapprendre la nuit.
 *
 * Écrit ici, et non dans un composant : le web dessine du SVG, le mobile du
 * `react-native-svg`, et tous deux doivent montrer exactement le même schéma.
 */
import tokens from '@futuriste/ui/tokens/colors.json';
import type { GamePhase, Motion, Team, ZonePurpose } from './schema';

const domain = (code: string): string => {
  const found = tokens.domains.find((d) => d.code === code);
  if (!found) throw new Error(`domaine inconnu dans les jetons : ${code}`);
  return found.light;
};

const VIOLET = tokens.brand.violet.light;
const SKY = tokens.brand.sky.light;
const SKY_DEEP = tokens.brand.skyDeep.light;
const INK = tokens.brand.ink.light;
const WHITE = tokens.brand.white.light;
const MUTED = tokens.text.muted.light;
const ROUGE = domain('TACTIQUE');
const JAUNE = domain('EDUCATION');
const VERT = domain('VITESSE');

/** Transparence sur une couleur hexadécimale : les zones se superposent au terrain. */
const alpha = (hex: string, ratio: number): string => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${ratio})`;
};

export interface TeamStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  /** Couleur du numéro. */
  text: string;
  /** Nom lisible, pour la légende et le texte alternatif. */
  label: string;
}

export const TEAM_STYLES: Record<Team, TeamStyle> = {
  A: { fill: VIOLET, stroke: WHITE, strokeWidth: 0.4, text: WHITE, label: 'Équipe A' },
  B: { fill: ROUGE, stroke: INK, strokeWidth: 1.2, text: WHITE, label: 'Équipe B' },
  JOKER: { fill: JAUNE, stroke: INK, strokeWidth: 1.2, text: INK, label: 'Joker' },
  NEUTRE: { fill: MUTED, stroke: WHITE, strokeWidth: 0.4, text: WHITE, label: 'Neutre' },
};

export interface ZoneStyle {
  fill: string;
  stroke: string;
  /** Tiret SVG : `null` = trait plein. */
  dash: string | null;
  hatched: boolean;
  label: string;
}

export const ZONE_STYLES: Record<ZonePurpose, ZoneStyle> = {
  OCCUPER: {
    fill: alpha(SKY, 0.22),
    stroke: SKY_DEEP,
    dash: '2 1.5',
    hatched: true,
    label: 'Zone à occuper',
  },
  PROTEGER: {
    fill: alpha(ROUGE, 0.2),
    stroke: ROUGE,
    dash: null,
    hatched: false,
    label: 'Zone à protéger',
  },
  INTERDITE: {
    fill: alpha(MUTED, 0.25),
    stroke: MUTED,
    dash: '1 1',
    hatched: true,
    label: 'Zone interdite',
  },
  CIBLE: { fill: alpha(VERT, 0.16), stroke: VERT, dash: null, hatched: false, label: 'Zone cible' },
  NEUTRE: { fill: alpha(MUTED, 0.12), stroke: MUTED, dash: null, hatched: false, label: 'Zone' },
};

export interface MotionStyle {
  stroke: string;
  width: number;
  dash: string | null;
  /** Trait ondulé : la conduite de balle, et elle seule. */
  wavy: boolean;
  /** Double trait : le pressing. */
  doubled: boolean;
  label: string;
}

export const MOTION_STYLES: Record<Motion, MotionStyle> = {
  COURSE: { stroke: INK, width: 0.7, dash: null, wavy: false, doubled: false, label: 'Course' },
  PASSE: { stroke: INK, width: 0.7, dash: '2.5 1.5', wavy: false, doubled: false, label: 'Passe' },
  CONDUITE: {
    stroke: INK,
    width: 0.7,
    dash: null,
    wavy: true,
    doubled: false,
    label: 'Conduite de balle',
  },
  TIR: { stroke: INK, width: 1.6, dash: null, wavy: false, doubled: false, label: 'Tir' },
  PRESSING: {
    stroke: ROUGE,
    width: 0.6,
    dash: null,
    wavy: false,
    doubled: true,
    label: 'Pressing',
  },
};

/** Couleur d'ambiance du bandeau de phase (docs/14 §4). */
export const PHASE_TINTS: Record<GamePhase, { background: string; border: string }> = {
  POSSESSION: { background: alpha(VIOLET, 0.12), border: VIOLET },
  PERTE: { background: alpha(ROUGE, 0.14), border: ROUGE },
  RECUPERATION: { background: alpha(VERT, 0.14), border: VERT },
  TRANSITION: { background: alpha(JAUNE, 0.16), border: JAUNE },
};

/** Couleurs du ballon, des cônes et du gardien — mêmes jetons, mêmes règles. */
export const FIGURE_COLORS = {
  ball: WHITE,
  ballStroke: INK,
  cone: domain('PHYSIQUE'),
  coneStroke: INK,
  keeperRing: INK,
  keeperText: WHITE,
  text: tokens.text.secondary.light,
  goal: INK,
};

/** Rayon d'un joueur, en unités de terrain (0 à 100). */
export const PLAYER_RADIUS = 3.2;
export const BALL_RADIUS = 1.6;

/** Largeur d'un but, en unités de terrain. */
export const GOAL_WIDTHS: Record<'MINI' | 'SMALL' | 'FULL', number> = {
  MINI: 8,
  SMALL: 14,
  FULL: 22,
};
