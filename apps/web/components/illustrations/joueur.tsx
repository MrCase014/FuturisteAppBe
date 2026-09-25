import { ILLU } from './palette';

/**
 * Un jeune joueur, en silhouette.
 *
 * Le repère local place les PIEDS en (0, 0) et la tête vers les y négatifs :
 * poser une figure sur le sol revient à la translater à l'altitude du sol,
 * sans calcul.
 *
 * LES MEMBRES SONT DES TRAITS, PAS DES FORMES
 *
 * Bras et jambes sont tracés au `stroke` arrondi, ancrés sur l'épaule ou la
 * hanche. Dessinés en polygones, ils se détachaient du corps dès qu'une pose
 * changeait — on voyait des rectangles flotter à côté du torse. Un trait qui
 * part d'un point d'attache ne peut pas se détacher de lui.
 *
 * Les visages n'ont pas de traits. Ce n'est pas une économie de dessin : ces
 * illustrations représentent des enfants, et aucun enfant en particulier.
 */

export type Pose = 'debout' | 'course' | 'frappe' | 'garde' | 'marche';

export interface JoueurProps {
  pose: Pose;
  x: number;
  y: number;
  /** 1 ≈ 60 unités de haut, soit un quart de la scène. */
  echelle?: number;
  maillot?: string;
  /** Retourne la figure : par défaut elle regarde vers la droite. */
  miroir?: boolean;
  /**
   * Rotation en degrés, autour des pieds. Un plongeon parfaitement
   * horizontal se lit comme quelqu'un couché par terre ; c'est l'inclinaison
   * qui dit qu'il est en l'air.
   */
  rotation?: number;
}

const PEAU = ILLU.skin;
const SOMBRE = ILLU.figure;
const MEMBRE = { stroke: PEAU, strokeWidth: 5, strokeLinecap: 'round' as const, fill: 'none' };
const JAMBE = { ...MEMBRE, strokeWidth: 6 };

function Tete({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="7.5" fill={PEAU} />
      {/* Les cheveux : une calotte posée sur le crâne, pas un casque. */}
      <path d={`M${x - 7.4} ${y - 1} a 7.4 7.4 0 0 1 14.8 0 q -7.4 -5.5 -14.8 0 Z`} fill={SOMBRE} />
      <path d={`M${x - 7.5} ${y - 0.5} q 7.5 3 15 0`} stroke={SOMBRE} strokeWidth="0" fill="none" />
    </g>
  );
}

/** Une chaussure, perpendiculaire à la jambe qui la porte. */
function Crampon({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  return (
    <rect
      x={x - 1}
      y={y - 2}
      width="9"
      height="4"
      rx="2"
      fill={SOMBRE}
      transform={`rotate(${angle} ${x} ${y})`}
    />
  );
}

export function Joueur({
  pose,
  x,
  y,
  echelle = 1,
  maillot = ILLU.jersey,
  miroir = false,
  rotation = 0,
}: JoueurProps) {
  const transform =
    `translate(${x} ${y}) rotate(${miroir ? -rotation : rotation}) ` +
    `scale(${miroir ? -echelle : echelle} ${echelle})`;

  // Un switch plutôt qu'une table de poses : on ne construit que celle qui
  // sera dessinée, et TypeScript vérifie qu'aucune pose n'a été oubliée.
  switch (pose) {
    case 'debout':
      return (
        <g transform={transform}>
          <path d="M-7 -13 L-5 -3" {...JAMBE} />
          <path d="M7 -13 L5 -3" {...JAMBE} />
          <Crampon x={-9} y={-2} />
          <Crampon x={1} y={-2} />
          <path d="M-9 -25 L9 -25 L8 -12 L-8 -12 Z" fill={SOMBRE} />
          <path d="M-10 -45 q10 -3.5 20 0 L9 -25 L-9 -25 Z" fill={maillot} />
          <path d="M-10 -44 L-13 -28" {...MEMBRE} />
          <path d="M10 -44 L13 -28" {...MEMBRE} />
          <path d="M-10 -44 L-11.5 -38" stroke={maillot} strokeWidth="6.5" strokeLinecap="round" />
          <path d="M10 -44 L11.5 -38" stroke={maillot} strokeWidth="6.5" strokeLinecap="round" />
          <Tete x={0} y={-53} />
        </g>
      );

    case 'course':
      return (
        <g transform={transform}>
          {/* Jambe arrière repliée, jambe avant tendue : l'appui et la foulée. */}
          <path d="M-3 -14 Q -13 -10 -16 -3" {...JAMBE} />
          <path d="M3 -14 Q 12 -11 15 -4" {...JAMBE} />
          <Crampon x={-22} y={-2} angle={-14} />
          <Crampon x={13} y={-3} angle={16} />
          <path d="M-8 -26 L9 -27 L10 -13 L-4 -12 Z" fill={SOMBRE} />
          <path d="M-10 -47 q11 -4 21 -1 L10 -26 L-8 -25 Z" fill={maillot} />
          <path d="M-10 -45 Q -20 -40 -22 -32" {...MEMBRE} />
          <path d="M11 -46 Q 20 -42 21 -35" {...MEMBRE} />
          <path d="M-10 -45 L-14 -42" stroke={maillot} strokeWidth="6.5" strokeLinecap="round" />
          <path d="M11 -46 L15 -43" stroke={maillot} strokeWidth="6.5" strokeLinecap="round" />
          <Tete x={2} y={-54} />
        </g>
      );

    case 'frappe':
      return (
        <g transform={transform}>
          <path d="M-4 -14 L-7 -3" {...JAMBE} />
          <Crampon x={-11} y={-2} />
          {/* La jambe de frappe part de la hanche et finit dans le ballon. */}
          <path d="M4 -15 Q 15 -14 24 -10" {...JAMBE} />
          <Crampon x={24} y={-10} angle={22} />
          <path d="M-8 -26 L9 -26 L10 -13 L-5 -13 Z" fill={SOMBRE} />
          <path d="M-10 -46 q11 -4 21 0 L9 -26 L-9 -26 Z" fill={maillot} />
          <path d="M-10 -44 Q -19 -38 -20 -31" {...MEMBRE} />
          <path d="M11 -45 Q 19 -39 18 -32" {...MEMBRE} />
          <path d="M-10 -44 L-14 -41" stroke={maillot} strokeWidth="6.5" strokeLinecap="round" />
          <path d="M11 -45 L15 -42" stroke={maillot} strokeWidth="6.5" strokeLinecap="round" />
          <Tete x={1} y={-53} />
        </g>
      );

    case 'garde':
      return (
        <g transform={transform}>
          {/* Le corps cambré, les deux bras tendus vers le ballon. Un tronc
              droit et des bras courts donnaient quelqu'un allongé par terre. */}
          <path d="M-22 -14 Q 0 -24 24 -18 L22 -8 Q 0 -13 -20 -5 Z" fill={maillot} />
          <path d="M24 -20 Q 38 -26 50 -33" {...MEMBRE} />
          <path d="M23 -11 Q 37 -16 48 -24" {...MEMBRE} />
          <path d="M-21 -10 Q -34 -5 -42 3" {...JAMBE} />
          <path d="M-22 -15 Q -36 -17 -45 -11" {...JAMBE} />
          <Crampon x={-49} y={-10} angle={-28} />
          <Crampon x={-45} y={3} angle={-20} />
          <Tete x={30} y={-26} />
        </g>
      );

    case 'marche':
      return (
        <g transform={transform}>
          {/* Les crampons pendent dans le DOS, au bout de leurs lacets passés
              sur l'épaule. Posés devant, près du visage, ils se lisaient
              comme un téléphone porté à l'oreille. */}
          <path d="M-9 -45 Q -14 -42 -15 -36" stroke={SOMBRE} strokeWidth="1.4" fill="none" />
          <path d="M-20 -37 l7 3 l-2.5 5.5 l-7 -3 Z" fill={SOMBRE} />
          <path d="M-18 -30 l7 3 l-2.5 5.5 l-7 -3 Z" fill={SOMBRE} />

          <path d="M-4 -13 Q -8 -8 -10 -3" {...JAMBE} />
          <path d="M5 -13 L6 -3" {...JAMBE} />
          <Crampon x={-15} y={-2} angle={-8} />
          <Crampon x={2} y={-2} />
          <path d="M-8 -25 L9 -25 L9 -12 L-6 -12 Z" fill={SOMBRE} />
          <path d="M-10 -45 q10 -3.5 20 0 L9 -25 L-9 -25 Z" fill={maillot} />
          {/* Le lacet passe sur l'épaule, la main le retient. */}
          <path d="M-9 -45 Q 0 -50 8 -46" stroke={SOMBRE} strokeWidth="1.6" fill="none" />
          <path d="M10 -44 Q 11 -48 8 -50" {...MEMBRE} />
          {/* L'autre bras serre le ballon contre la hanche. */}
          <path d="M-10 -44 Q -17 -36 -16 -26" {...MEMBRE} />
          <path d="M-10 -44 L-13 -40" stroke={maillot} strokeWidth="6.5" strokeLinecap="round" />
          <path d="M10 -44 L11 -47" stroke={maillot} strokeWidth="6.5" strokeLinecap="round" />
          <Tete x={0} y={-53} />
        </g>
      );
  }
}
