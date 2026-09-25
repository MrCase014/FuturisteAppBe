import type { ReactNode } from 'react';
import { ILLU } from './palette';

/**
 * Les briques communes à toutes les scènes.
 *
 * POURQUOI CES ILLUSTRATIONS SONT DESSINÉES, ET NON PHOTOGRAPHIÉES
 *
 * L'académie forme des mineurs. Une photographie d'enfant identifiable ne
 * s'affiche pas sans le consentement écrit de sa famille, et ce consentement
 * se retire (docs/12). Une illustration ne pose aucune de ces questions : on
 * peut la mettre en page d'accueil publique, la partager, l'imprimer, sans
 * qu'aucun enfant ne soit exposé.
 *
 * Elles sont dessinées ici, en SVG, plutôt que chargées en image : quelques
 * kilo-octets au lieu de plusieurs centaines, nettes sur tous les écrans, et
 * aux couleurs du club parce qu'elles lisent les mêmes jetons que le reste.
 *
 * Contrairement aux schémas tactiques, dont la géométrie porte du SENS et
 * vit donc dans `packages/diagrams` pour servir le web ET le mobile, ces
 * dessins sont décoratifs. Le mobile aura les siens, adaptés à son moteur de
 * rendu ; les partager n'apporterait rien.
 */

export interface SceneProps {
  /** Décrit la scène pour qui ne la voit pas. Obligatoire : docs/12 §7. */
  alt: string;
  className?: string;
}

/** Ciel dégradé, soleil bas, et son halo. */
export function Ciel({ soleilX = 320, soleilY = 54 }: { soleilX?: number; soleilY?: number }) {
  return (
    <g>
      <rect x="0" y="0" width="400" height="260" fill={ILLU.sky} />
      <rect x="0" y="0" width="400" height="118" fill={ILLU.skyDeep} opacity="0.55" />
      {/* Le halo se construit en deux cercles opaques plutôt qu'en
          transparence : un jaune pâle à 45 % sur un ciel bleu vire au gris-vert. */}
      <circle cx={soleilX} cy={soleilY} r="44" fill={ILLU.sunGlow} opacity="0.85" />
      <circle cx={soleilX} cy={soleilY} r="30" fill={ILLU.sun} />
    </g>
  );
}

/**
 * Le mur de parpaings qui ferme presque tous les terrains de quartier.
 *
 * Les rangées sont décalées d'une demi-brique, comme un vrai appareillage :
 * une grille régulière se voit immédiatement comme un motif, pas comme un mur.
 */
export function MurDeParpaings({ y = 96, hauteur = 52 }: { y?: number; hauteur?: number }) {
  const rangees = Math.max(1, Math.round(hauteur / 13));
  const hRangee = hauteur / rangees;
  const lignes: ReactNode[] = [];

  for (let r = 0; r < rangees; r += 1) {
    const yr = y + r * hRangee;
    lignes.push(
      <line key={`h${r}`} x1="0" y1={yr} x2="400" y2={yr} stroke={ILLU.wallLine} strokeWidth="1" />,
    );
    const decalage = r % 2 === 0 ? 0 : 26;
    for (let x = decalage; x <= 400; x += 52) {
      lignes.push(
        <line
          key={`v${r}-${x}`}
          x1={x}
          y1={yr}
          x2={x}
          y2={yr + hRangee}
          stroke={ILLU.wallLine}
          strokeWidth="1"
        />,
      );
    }
  }

  return (
    <g>
      <rect x="0" y={y} width="400" height={hauteur} fill={ILLU.wall} />
      {lignes}
      <rect x="0" y={y + hauteur - 3} width="400" height="3" fill={ILLU.wallLine} opacity="0.7" />
    </g>
  );
}

/** Le sol : terre battue, ocre, avec ses irrégularités. */
export function TerreBattue({ y = 148 }: { y?: number }) {
  return (
    <g>
      <rect x="0" y={y} width="400" height={260 - y} fill={ILLU.dust} />
      <path
        d={`M0 ${y + 26} Q 90 ${y + 18} 180 ${y + 28} T 400 ${y + 22} L400 260 L0 260 Z`}
        fill={ILLU.dustDeep}
        opacity="0.55"
      />
      <ellipse cx="86" cy={y + 52} rx="54" ry="7" fill={ILLU.dustShadow} opacity="0.35" />
      <ellipse cx="300" cy={y + 68} rx="70" ry="8" fill={ILLU.dustShadow} opacity="0.28" />
    </g>
  );
}

/** L'ombre portée d'une figure, écrasée par le soleil au zénith. */
export function Ombre({ cx, cy, rx = 20 }: { cx: number; cy: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.22} fill={ILLU.dustShadow} opacity="0.45" />;
}

/**
 * Un ballon.
 *
 * Un pentagone au centre et cinq coutures qui filent vers le bord : c'est ce
 * qui se lit comme un ballon à 9 unités de rayon. La version précédente
 * ajoutait deux arcs sur les côtés, et l'ensemble se lisait comme un visage.
 */
export function Ballon({ cx, cy, r = 9 }: { cx: number; cy: number; r?: number }) {
  const pentagone = Array.from({ length: 5 }, (_, i) => {
    const a = (Math.PI / 180) * (-90 + i * 72);
    return `${(cx + Math.cos(a) * r * 0.42).toFixed(2)},${(cy + Math.sin(a) * r * 0.42).toFixed(2)}`;
  }).join(' ');

  const coutures = Array.from({ length: 5 }, (_, i) => {
    const a = (Math.PI / 180) * (-54 + i * 72);
    return (
      <line
        key={i}
        x1={cx + Math.cos(a) * r * 0.42}
        y1={cy + Math.sin(a) * r * 0.42}
        x2={cx + Math.cos(a) * r * 0.94}
        y2={cy + Math.sin(a) * r * 0.94}
        stroke={ILLU.ballLine}
        strokeWidth={r * 0.13}
        strokeLinecap="round"
      />
    );
  });

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={ILLU.ball}
        stroke={ILLU.ballLine}
        strokeWidth={r * 0.13}
      />
      <polygon points={pentagone} fill={ILLU.ballLine} />
      {coutures}
    </g>
  );
}

/** Le cadre commun : proportions fixes, texte alternatif obligatoire. */
export function Scene({ alt, className = '', children }: SceneProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 400 260"
      role="img"
      aria-label={alt}
      className={`w-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {children}
    </svg>
  );
}
