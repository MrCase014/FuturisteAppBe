import { DOMAINS, type DomainCode } from '@futuriste/core';
import { domainColor } from '@futuriste/ui';

export type RadarPoint = { code: DomainCode; level: number };

/**
 * PLAYER DEVELOPMENT PROFILE — radar 8 domaines.
 *
 * Une seule série : pas de légende (le titre nomme la série), étiquetage direct
 * sur chaque axe, et une vue tableau accompagne toujours le graphique
 * (docs/08 §8). Échelle unique 0-5, jamais deux axes.
 */
export function PlayerRadar({ data, size = 260 }: { data: RadarPoint[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 46;
  const max = 5;

  const ordered = DOMAINS.map((d) => ({
    code: d.code,
    labelFr: d.labelFr,
    level: data.find((p) => p.code === d.code)?.level ?? 0,
  }));

  const angleFor = (i: number) => (Math.PI * 2 * i) / ordered.length - Math.PI / 2;
  const pointAt = (i: number, value: number) => {
    const r = (value / max) * radius;
    return [cx + r * Math.cos(angleFor(i)), cy + r * Math.sin(angleFor(i))] as const;
  };

  const polygon = ordered
    .map((p, i) => pointAt(i, p.level))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

  const summary = ordered.map((p) => `${p.labelFr} ${p.level}/5`).join(', ');

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height={size}
      role="img"
      aria-label={`Profil de développement : ${summary}`}
    >
      {[1, 2, 3, 4, 5].map((ring) => (
        <polygon
          key={ring}
          points={ordered
            .map((_, i) => pointAt(i, ring))
            .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
            .join(' ')}
          fill="none"
          stroke="var(--fut-surface-border)"
          strokeWidth={1}
        />
      ))}

      <polygon
        points={polygon}
        fill="var(--fut-violet)"
        fillOpacity={0.18}
        stroke="var(--fut-violet)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {ordered.map((p, i) => {
        const [x, y] = pointAt(i, p.level);
        const [lx, ly] = pointAt(i, max + 0.85);
        return (
          <g key={p.code}>
            <circle
              cx={x}
              cy={y}
              r={4}
              fill={domainColor(p.code)}
              stroke="white"
              strokeWidth={1.5}
            />
            <text
              x={lx}
              y={ly}
              textAnchor={lx > cx + 6 ? 'start' : lx < cx - 6 ? 'end' : 'middle'}
              dominantBaseline="middle"
              fontSize={10}
              fill="var(--fut-text-secondary)"
            >
              {p.labelFr}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Vue tableau : toujours disponible derrière un graphique (docs/08 §8, règle 4). */
export function RadarTable({ data }: { data: RadarPoint[] }) {
  return (
    <table className="w-full text-small">
      <caption className="sr-only">Niveaux par domaine de développement</caption>
      <thead>
        <tr className="text-left text-content-secondary">
          <th scope="col" className="py-1 font-medium">
            Domaine
          </th>
          <th scope="col" className="py-1 text-right font-medium">
            Niveau
          </th>
        </tr>
      </thead>
      <tbody>
        {DOMAINS.map((d) => (
          <tr key={d.code} className="border-t border-surface-border">
            <th scope="row" className="py-1 font-normal text-content-primary">
              {d.labelFr}
            </th>
            <td className="py-1 text-right tabular-nums text-content-primary">
              {data.find((p) => p.code === d.code)?.level ?? '—'} / 5
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
