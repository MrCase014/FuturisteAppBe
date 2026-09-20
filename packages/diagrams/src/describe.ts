/**
 * Dire un schéma avec des mots.
 *
 * Deux usages, un seul calcul (docs/14 §7) :
 *  - le texte alternatif, pour qui n'a pas accès à l'image ;
 *  - la vue « étapes », qui liste les images-clés en texte — utile aussi au
 *    coach pressé qui parcourt du regard plutôt que d'attendre l'animation.
 *
 * Écrire ces phrases à la main dans chaque schéma serait le meilleur moyen
 * qu'elles cessent de décrire le schéma après la première correction.
 */
import type { DiagramCanvas, GamePhase, Team } from './schema';
import { PHASE_SHORT } from './animation';

const TEAM_NOUN: Record<Team, [string, string]> = {
  A: ['joueur de l’équipe A', 'joueurs de l’équipe A'],
  B: ['joueur de l’équipe B', 'joueurs de l’équipe B'],
  JOKER: ['joker', 'jokers'],
  NEUTRE: ['joueur neutre', 'joueurs neutres'],
};

const ZONE_NOUN: Record<string, string> = {
  OCCUPER: 'zone à occuper',
  PROTEGER: 'zone à protéger',
  INTERDITE: 'zone interdite',
  CIBLE: 'zone cible',
  NEUTRE: 'zone',
};

const plural = (count: number, [one, many]: [string, string]): string =>
  `${count} ${count > 1 ? many : one}`;

export interface DiagramStep {
  /** Numéro affiché, à partir de 1. */
  index: number;
  t: number;
  phase: GamePhase | null;
  phaseLabel: string | null;
  caption: string | null;
}

export interface DiagramDescription {
  alt: string;
  steps: DiagramStep[];
}

/** Le décompte des figurants, dans l'ordre où un coach les nomme. */
function inventory(diagram: DiagramCanvas): string[] {
  const teams = new Map<Team, number>();
  let keepers = 0;
  let cones = 0;
  let goals = 0;
  const zones: string[] = [];

  for (const element of diagram.elements) {
    switch (element.kind) {
      case 'PLAYER':
        teams.set(element.team, (teams.get(element.team) ?? 0) + 1);
        break;
      case 'GK':
        keepers += 1;
        break;
      case 'CONE':
        cones += 1;
        break;
      case 'GOAL':
        goals += 1;
        break;
      case 'ZONE':
        zones.push(element.label ?? ZONE_NOUN[element.purpose] ?? 'zone');
        break;
      default:
        break;
    }
  }

  const parts: string[] = [];
  for (const team of ['A', 'B', 'JOKER', 'NEUTRE'] as const) {
    const count = teams.get(team);
    if (count) parts.push(plural(count, TEAM_NOUN[team]));
  }
  if (keepers > 0) parts.push(plural(keepers, ['gardien', 'gardiens']));
  if (goals > 0) parts.push(plural(goals, ['but', 'buts']));
  if (cones > 0) parts.push(plural(cones, ['cône', 'cônes']));
  for (const zone of zones) parts.push(zone);
  return parts;
}

/**
 * Décrit le schéma. `diagram.alt`, s'il est fourni, l'emporte : un auteur
 * qui a pris le temps d'écrire la phrase juste sait mieux que ce calcul.
 */
export function describeDiagram(diagram: DiagramCanvas): DiagramDescription {
  const steps: DiagramStep[] = diagram.keyframes.map((frame, i) => ({
    index: i + 1,
    t: frame.t,
    phase: frame.phase ?? null,
    phaseLabel: frame.phase ? PHASE_SHORT[frame.phase] : null,
    caption: frame.caption ?? null,
  }));

  if (diagram.alt && diagram.alt.trim() !== '') {
    return { alt: diagram.alt.trim(), steps };
  }

  const { lengthM, widthM } = diagram.field;
  const parts = inventory(diagram);
  const sentences: string[] = [
    `Schéma sur ${lengthM} × ${widthM} m` + (parts.length > 0 ? ` : ${parts.join(', ')}.` : '.'),
  ];

  if (steps.length >= 2) {
    const phases = steps.map((s) => s.phaseLabel).filter((p): p is string => p !== null);
    sentences.push(
      phases.length > 0
        ? `${steps.length} étapes : ${phases.join(', puis ')}.`
        : `${steps.length} étapes animées.`,
    );
  }

  return { alt: sentences.join(' '), steps };
}
