import { ILLU } from './palette';
import { Joueur } from './joueur';
import {
  Ballon,
  Ciel,
  MurDeParpaings,
  Ombre,
  Scene,
  TerreBattue,
  type SceneProps,
} from './primitives';

/**
 * Les scènes illustrées de FUTURISTE ACADÉMIE FC.
 *
 * Elles racontent le football tel qu'il se joue ici : terre battue ocre, mur
 * de parpaings au fond, soleil bas, maillots violets. Pas un gazon anglais
 * sous un ciel gris — ce serait l'image d'un autre club.
 *
 * Chacune porte un texte alternatif obligatoire, et pèse quelques
 * kilo-octets : elles se chargent sur un téléphone au bord du terrain, là où
 * une photographie de 800 Ko ne s'afficherait jamais.
 */

export { Ballon } from './primitives';

/** Scène d'accueil : un entraînement ordinaire, un après-midi ordinaire. */
export function TerrainDeTerre({ alt, className }: SceneProps) {
  return (
    <Scene alt={alt} className={className}>
      <Ciel soleilX={334} soleilY={48} />
      <MurDeParpaings y={92} hauteur={56} />
      <TerreBattue y={148} />

      <Ombre cx={96} cy={214} rx={26} />
      <Ombre cx={196} cy={224} rx={24} />
      <Ombre cx={286} cy={208} rx={22} />

      <Joueur pose="course" x={96} y={214} echelle={1.5} />
      <Joueur pose="frappe" x={196} y={224} echelle={1.55} maillot={ILLU.jersey} />
      <Joueur pose="debout" x={286} y={208} echelle={1.35} maillot={ILLU.jerseyAlt} miroir />

      <Ballon cx={238} cy={206} r={11} />
      <path
        d="M214 214 q14 -12 24 -8"
        stroke={ILLU.dustShadow}
        strokeWidth="2"
        strokeDasharray="5 4"
        fill="none"
        opacity="0.8"
      />
    </Scene>
  );
}

/** En route pour l'entraînement : le ballon sous le bras, les crampons sur l'épaule. */
export function EnRouteVersLeStade({ alt, className }: SceneProps) {
  return (
    <Scene alt={alt} className={className}>
      <Ciel soleilX={68} soleilY={56} />
      <MurDeParpaings y={104} hauteur={44} />
      <TerreBattue y={148} />

      {/* Le chemin qui file vers le terrain, hors du cadre. */}
      <path d="M0 260 L150 168 L214 168 L120 260 Z" fill={ILLU.dustDeep} opacity="0.45" />

      <Ombre cx={252} cy={226} rx={30} />
      <Joueur pose="marche" x={252} y={226} echelle={1.75} miroir />
      <Ballon cx={281} cy={181} r={13} />

      {/* Trois brins d'herbe sèche : le terrain n'est jamais tout à fait nu. */}
      <path
        d="M46 238 l4 -14 M52 240 l1 -12 M58 238 l5 -13"
        stroke={ILLU.leaf}
        strokeWidth="2"
        opacity="0.7"
      />
      <path d="M340 246 l3 -12 M346 248 l1 -11" stroke={ILLU.leaf} strokeWidth="2" opacity="0.7" />
    </Scene>
  );
}

/** Un duel : le moment où l'on apprend le plus. */
export function DuelAuSoleil({ alt, className }: SceneProps) {
  return (
    <Scene alt={alt} className={className}>
      <Ciel soleilX={200} soleilY={40} />
      <MurDeParpaings y={98} hauteur={50} />
      <TerreBattue y={148} />

      <Ombre cx={158} cy={220} rx={28} />
      <Ombre cx={244} cy={220} rx={28} />

      <Joueur pose="course" x={158} y={220} echelle={1.6} maillot={ILLU.jersey} />
      <Joueur pose="course" x={244} y={220} echelle={1.6} maillot={ILLU.jerseyAlt} miroir />
      <Ballon cx={201} cy={212} r={10} />

      {/* La poussière soulevée par les appuis. */}
      <g opacity="0.5" fill={ILLU.dustShadow}>
        <ellipse cx="136" cy="222" rx="13" ry="4" />
        <ellipse cx="268" cy="222" rx="13" ry="4" />
        <circle cx="124" cy="214" r="3" />
        <circle cx="280" cy="216" r="2.5" />
      </g>
    </Scene>
  );
}

/** Le gardien : le seul qui ait le droit d'utiliser ses mains, et le devoir d'oser. */
export function GardienQuiPlonge({ alt, className }: SceneProps) {
  return (
    <Scene alt={alt} className={className}>
      <Ciel soleilX={60} soleilY={50} />
      <MurDeParpaings y={100} hauteur={48} />
      <TerreBattue y={148} />

      {/* La cage, resserrée : le gardien doit dominer la scène, pas le but. */}
      <g stroke={ILLU.figure} strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M128 182 L128 116 L300 116 L300 182" />
      </g>
      <g stroke={ILLU.figure} strokeWidth="0.8" opacity="0.28">
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`m${i}`} x1={136 + i * 24} y1="118" x2={136 + i * 24} y2="182" />
        ))}
        {Array.from({ length: 3 }, (_, i) => (
          <line key={`t${i}`} x1="130" y1={132 + i * 18} x2="298" y2={132 + i * 18} />
        ))}
      </g>

      <Ombre cx={206} cy={216} rx={44} />
      <Joueur pose="garde" x={176} y={196} echelle={1.5} maillot={ILLU.jerseyAlt} rotation={-22} />
      <Ballon cx={276} cy={132} r={11} />
      <path
        d="M330 96 q-30 12 -50 30"
        stroke={ILLU.dustShadow}
        strokeWidth="2.5"
        strokeDasharray="7 6"
        fill="none"
      />
    </Scene>
  );
}

/** Le coach et son groupe : la consigne avant l'atelier. */
export function CoachEtSonGroupe({ alt, className }: SceneProps) {
  return (
    <Scene alt={alt} className={className}>
      <Ciel soleilX={330} soleilY={52} />
      <MurDeParpaings y={96} hauteur={52} />
      <TerreBattue y={148} />

      {/* Le tableau d'ateliers, posé sur son trépied. */}
      <g>
        <rect
          x="42"
          y="132"
          width="66"
          height="48"
          rx="3"
          fill={ILLU.ball}
          stroke={ILLU.figure}
          strokeWidth="2.5"
        />
        <path
          d="M56 146 h38 M56 156 h30 M56 166 h34"
          stroke={ILLU.jersey}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M58 180 L48 216 M92 180 L102 216"
          stroke={ILLU.figure}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      <Ombre cx={160} cy={220} rx={24} />
      <Ombre cx={216} cy={226} rx={20} />
      <Ombre cx={262} cy={222} rx={20} />
      <Ombre cx={308} cy={228} rx={20} />

      <Joueur pose="debout" x={160} y={220} echelle={1.7} maillot={ILLU.figureSoft} />
      <Joueur pose="debout" x={216} y={226} echelle={1.15} maillot={ILLU.jersey} miroir />
      <Joueur pose="debout" x={262} y={222} echelle={1.08} maillot={ILLU.jerseyAlt} miroir />
      <Joueur pose="debout" x={308} y={228} echelle={1.2} maillot={ILLU.jersey} miroir />

      <Ballon cx={188} cy={232} r={9} />
    </Scene>
  );
}

/**
 * Vignette carrée : un ballon posé, au repos.
 *
 * Sert aux écrans vides. Un écran vide sans image dit « il n'y a rien » ;
 * avec celle-ci, il dit « il n'y a rien ENCORE », ce qui n'est pas la même
 * chose quand on vient de créer son académie.
 */
export function BallonAuRepos({ alt, className = '' }: SceneProps) {
  return (
    <svg viewBox="0 0 160 120" role="img" aria-label={alt} className={`w-full ${className}`}>
      <rect x="0" y="0" width="160" height="120" rx="10" fill={ILLU.dust} />
      <path d="M0 78 Q 40 70 80 78 T 160 74 L160 120 L0 120 Z" fill={ILLU.dustDeep} opacity="0.5" />
      <ellipse cx="80" cy="92" rx="30" ry="6" fill={ILLU.dustShadow} opacity="0.45" />
      <Ballon cx={80} cy={76} r={18} />
      <path
        d="M26 96 l3 -13 M33 98 l1 -11 M124 94 l3 -12"
        stroke={ILLU.leaf}
        strokeWidth="2"
        opacity="0.75"
      />
      <circle cx="132" cy="26" r="14" fill={ILLU.sun} opacity="0.9" />
    </svg>
  );
}
