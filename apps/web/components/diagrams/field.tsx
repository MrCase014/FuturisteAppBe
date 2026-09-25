import type { PointerEvent as ReactPointerEvent, ReactNode, Ref } from 'react';
import type { DiagramCanvas, DiagramElement, Point } from '@futuriste/diagrams';
import {
  BALL_RADIUS,
  FIGURE_COLORS,
  GOAL_WIDTHS,
  MOTION_STYLES,
  PLAYER_RADIUS,
  TEAM_STYLES,
  ZONE_STYLES,
  fieldGeometry,
} from '@futuriste/diagrams';

/**
 * Le dessin d'un schéma, à un instant donné.
 *
 * Volontairement sans état : on lui passe les positions calculées par
 * `@futuriste/diagrams`, il dessine. Le mobile fera le même composant avec
 * `react-native-svg` en repartant des mêmes constantes — c'est pour cela que
 * les couleurs et les épaisseurs vivent dans le paquet et non ici.
 *
 * Le repère du fichier va de 0 à 100 sur les deux axes. On le projette sur un
 * rectangle aux vraies proportions du terrain : un carré de 12 × 12 m reste
 * carré, un demi-terrain de 45 × 40 reste plus long que large, et les joueurs
 * restent ronds dans les deux cas.
 */

/**
 * Les pointes de flèche. SVG ne sait pas colorer un `marker` d'après le trait
 * qui le porte : il en faut un par couleur, déclaré une fois pour tout le
 * dessin. D'où cette liste, dérivée des styles de déplacement plutôt
 * qu'écrite à la main — ajouter un type de flèche n'obligera pas à y penser.
 */
const ARROW_HEADS = [...new Set(Object.values(MOTION_STYLES).map((m) => m.stroke))].map(
  (color, index) => ({ id: `fut-head-${index}`, color }),
);

const headIdFor = (stroke: string): string =>
  ARROW_HEADS.find((h) => h.color === stroke)?.id ?? ARROW_HEADS[0]!.id;

/** Une ligne ondulée : la conduite de balle, et elle seule (docs/14 §3). */
function wavyPath(points: readonly Point[], amplitude: number): string {
  const segments: string[] = [`M ${points[0]!.x} ${points[0]!.y}`];
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1]!;
    const to = points[i]!;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    // Normale unitaire : de quoi faire osciller le trait de part et d'autre.
    const nx = -dy / length;
    const ny = dx / length;
    const waves = Math.max(2, Math.round(length / 6));
    for (let w = 1; w <= waves; w += 1) {
      const ratio = w / waves;
      const previous = (w - 1) / waves;
      const side = w % 2 === 0 ? -amplitude : amplitude;
      const cx = from.x + dx * ((previous + ratio) / 2) + nx * side;
      const cy = from.y + dy * ((previous + ratio) / 2) + ny * side;
      segments.push(`Q ${cx} ${cy} ${from.x + dx * ratio} ${from.y + dy * ratio}`);
    }
  }
  return segments.join(' ');
}

/** Décale une ligne brisée sur le côté : sert au double trait du pressing. */
function offsetPoints(points: readonly Point[], distance: number): Point[] {
  return points.map((point, i) => {
    const from = points[Math.max(0, i - 1)]!;
    const to = points[Math.min(points.length - 1, i + 1)]!;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: point.x + (-dy / length) * distance, y: point.y + (dx / length) * distance };
  });
}

function Arrow({ element }: { element: Extract<DiagramElement, { kind: 'ARROW' }> }) {
  const style = MOTION_STYLES[element.motion];
  const head = headIdFor(style.stroke);
  const line = (pts: readonly Point[], marker: boolean) => ({
    fill: 'none' as const,
    stroke: style.stroke,
    strokeWidth: style.width,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: style.dash ?? undefined,
    markerEnd: marker ? `url(#${head})` : undefined,
    points: pts.map((p) => `${p.x},${p.y}`).join(' '),
  });

  if (style.wavy) {
    return (
      <path
        d={wavyPath(element.points, 1.4)}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.width}
        strokeLinecap="round"
        markerEnd={`url(#${head})`}
      />
    );
  }

  if (style.doubled) {
    return (
      <g>
        <polyline {...line(offsetPoints(element.points, 0.9), false)} />
        <polyline {...line(offsetPoints(element.points, -0.9), true)} />
      </g>
    );
  }

  return <polyline {...line(element.points, true)} />;
}

/**
 * Taille de police d'une étiquette de zone.
 *
 * SVG ne sait pas mesurer un texte avant de le dessiner, et le rendu se fait
 * côté serveur : il n'y a rien à interroger. On estime donc la largeur — une
 * lettre occupe environ la moitié de sa hauteur — et on rétrécit jusqu'à ce
 * que l'étiquette tienne dans sa zone. Sans cela, « Occuper la largeur »
 * débordait d'une zone étroite et se posait sur les joueurs.
 */
const GLYPH_RATIO = 0.58; // mesuré sur la police du produit, à vue de rendu
const LABEL_PADDING = 2; // pour ne pas coller au bord de la zone

function labelSize(label: string, width: number): number {
  const ideal = 2.8;
  const available = Math.max(4, width - LABEL_PADDING);
  const estimated = label.length * ideal * GLYPH_RATIO;
  if (estimated <= available) return ideal;
  return Math.max(1.6, available / (label.length * GLYPH_RATIO));
}

function Zone({ element }: { element: Extract<DiagramElement, { kind: 'ZONE' }> }) {
  const style = ZONE_STYLES[element.purpose];
  const common = {
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: 0.5,
    strokeDasharray: style.dash ?? undefined,
  };
  return (
    <g>
      {element.shape === 'CIRCLE' ? (
        <ellipse
          cx={element.x + element.w / 2}
          cy={element.y + element.h / 2}
          rx={element.w / 2}
          ry={element.h / 2}
          {...common}
        />
      ) : (
        <rect x={element.x} y={element.y} width={element.w} height={element.h} rx={1} {...common} />
      )}
      {style.hatched && (
        <rect
          x={element.x}
          y={element.y}
          width={element.w}
          height={element.h}
          rx={1}
          fill="url(#fut-hatch)"
          stroke="none"
        />
      )}
      {element.label && (
        <text
          x={element.x + element.w / 2}
          y={element.y + 3.4}
          textAnchor="middle"
          fontSize={labelSize(element.label, element.w)}
          fill={style.stroke}
        >
          {element.label}
        </text>
      )}
    </g>
  );
}

function Figure({ element, at }: { element: DiagramElement; at: Point }) {
  switch (element.kind) {
    case 'PLAYER': {
      const style = TEAM_STYLES[element.team];
      return (
        <g>
          <circle
            cx={at.x}
            cy={at.y}
            r={PLAYER_RADIUS}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
          />
          {element.number !== undefined && (
            <text
              x={at.x}
              y={at.y + 1.2}
              textAnchor="middle"
              fontSize={3.2}
              fontWeight={700}
              fill={style.text}
            >
              {element.number}
            </text>
          )}
          {element.label && (
            <text
              x={at.x}
              y={at.y - PLAYER_RADIUS - 1}
              textAnchor="middle"
              fontSize={2.6}
              fill={FIGURE_COLORS.text}
            >
              {element.label}
            </text>
          )}
        </g>
      );
    }
    case 'GK': {
      const style = TEAM_STYLES[element.team];
      return (
        <g>
          <circle cx={at.x} cy={at.y} r={PLAYER_RADIUS} fill={style.fill} />
          {/* L'anneau épais distingue le gardien sans recourir à une couleur de plus. */}
          <circle
            cx={at.x}
            cy={at.y}
            r={PLAYER_RADIUS + 0.9}
            fill="none"
            stroke={FIGURE_COLORS.keeperRing}
            strokeWidth={1}
          />
          <text
            x={at.x}
            y={at.y + 1.2}
            textAnchor="middle"
            fontSize={3}
            fontWeight={700}
            fill={FIGURE_COLORS.keeperText}
          >
            G
          </text>
        </g>
      );
    }
    case 'BALL':
      return (
        <circle
          cx={at.x}
          cy={at.y}
          r={BALL_RADIUS}
          fill={FIGURE_COLORS.ball}
          stroke={FIGURE_COLORS.ballStroke}
          strokeWidth={0.6}
        />
      );
    case 'CONE':
      return (
        <polygon
          points={`${at.x},${at.y - 2.2} ${at.x + 1.9},${at.y + 1.6} ${at.x - 1.9},${at.y + 1.6}`}
          fill={FIGURE_COLORS.cone}
          stroke={FIGURE_COLORS.coneStroke}
          strokeWidth={0.3}
        />
      );
    case 'GOAL': {
      const width = GOAL_WIDTHS[element.size];
      return (
        <g transform={`rotate(${element.rotation} ${at.x} ${at.y})`}>
          <line
            x1={at.x - width / 2}
            y1={at.y}
            x2={at.x + width / 2}
            y2={at.y}
            stroke={FIGURE_COLORS.goal}
            strokeWidth={1.1}
            strokeLinecap="round"
          />
          <line
            x1={at.x - width / 2}
            y1={at.y}
            x2={at.x - width / 2}
            y2={at.y - 2.4}
            stroke={FIGURE_COLORS.goal}
            strokeWidth={0.8}
          />
          <line
            x1={at.x + width / 2}
            y1={at.y}
            x2={at.x + width / 2}
            y2={at.y - 2.4}
            stroke={FIGURE_COLORS.goal}
            strokeWidth={0.8}
          />
        </g>
      );
    }
    case 'TEXT':
      // `dominantBaseline` n'est pas une coquetterie : sans lui, le texte
      // s'écrit AU-DESSUS de son point, alors que c'est sur ce point qu'on
      // l'attrape. On touchait donc à côté de ce qu'on voyait.
      return (
        <text
          x={at.x}
          y={at.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={4.2}
          fontWeight={600}
          fill={FIGURE_COLORS.text}
        >
          {element.text}
        </text>
      );
    default:
      return null;
  }
}

export function DiagramField({
  diagram,
  positions,
  altText,
  svgRef,
  overlay,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  className = 'w-full rounded-md',
}: {
  diagram: DiagramCanvas;
  positions: Map<string, Point>;
  altText: string;
  /**
   * Les quatre accessoires suivants ne servent qu'à l'ÉDITEUR (phase 5.7). Le
   * lecteur ne les passe pas, et se comporte exactement comme avant.
   *
   * Pourquoi l'éditeur réutilise ce composant plutôt que d'avoir le sien : ce
   * que le coach déplace doit être, au pixel près, ce qu'il verra à la
   * lecture. Deux dessins séparés finiraient par diverger, et l'écart ne se
   * verrait qu'une fois le schéma publié.
   */
  svgRef?: Ref<SVGSVGElement>;
  overlay?: ReactNode;
  onPointerDown?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  className?: string;
}) {
  // La géométrie vient du paquet : l'éditeur convertit les doigts en
  // coordonnées avec EXACTEMENT les mêmes nombres (packages/diagrams/geometry).
  const { height, scaleY, viewBox } = fieldGeometry(diagram.field);

  const at = (element: DiagramElement): Point => {
    if (!('x' in element)) return { x: 0, y: 0 };
    const moved = positions.get(element.id);
    const point = moved ?? { x: element.x, y: element.y };
    return { x: point.x, y: point.y * scaleY };
  };

  const zones = diagram.elements.filter((e) => e.kind === 'ZONE');
  const arrows = diagram.elements.filter((e) => e.kind === 'ARROW');
  const figures = diagram.elements.filter((e) => e.kind !== 'ZONE' && e.kind !== 'ARROW');

  const scaled = (points: readonly Point[]): Point[] =>
    points.map((p) => ({ x: p.x, y: p.y * scaleY }));

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label={altText}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <defs>
        <pattern
          id="fut-hatch"
          width="3"
          height="3"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="3"
            stroke={ZONE_STYLES.OCCUPER.stroke}
            strokeWidth="0.45"
            opacity="0.5"
          />
        </pattern>
        {ARROW_HEADS.map((head) => (
          <marker
            key={head.id}
            id={head.id}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill={head.color} />
          </marker>
        ))}
      </defs>

      <rect x="0" y="0" width="100" height={height} rx="1.5" className="fill-diagram-grass" />
      <rect
        x="0"
        y="0"
        width="100"
        height={height}
        rx="1.5"
        fill="none"
        className="stroke-diagram-line"
        strokeWidth="0.7"
      />

      <g>
        {zones.map((zone) => {
          const z = zone as Extract<DiagramElement, { kind: 'ZONE' }>;
          return <Zone key={z.id} element={{ ...z, y: z.y * scaleY, h: z.h * scaleY }} />;
        })}
      </g>
      <g>
        {arrows.map((arrow) => {
          const a = arrow as Extract<DiagramElement, { kind: 'ARROW' }>;
          return <Arrow key={a.id} element={{ ...a, points: scaled(a.points) }} />;
        })}
      </g>
      <g>
        {figures.map((element) => (
          <Figure key={element.id} element={element} at={at(element)} />
        ))}
      </g>
      {overlay}
    </svg>
  );
}
