/**
 * Les 8 domaines de développement FUTURISTE et leurs compétences.
 * L'ordre des domaines suit l'ordre de slots validé du design system
 * (séparation daltonisme) : voir docs/08-DESIGN-SYSTEM.md.
 */
export type DomainCode =
  | 'INTELLIGENCE'
  | 'PHYSIQUE'
  | 'VITESSE'
  | 'EDUCATION'
  | 'MENTAL'
  | 'SOCIAL'
  | 'TECHNIQUE'
  | 'TACTIQUE';

export interface DomainDefinition {
  code: DomainCode;
  /** Position dans la palette validée — ne jamais réordonner. */
  slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  labelFr: string;
  competencies: readonly string[];
}

export const DOMAINS: readonly DomainDefinition[] = [
  {
    code: 'INTELLIGENCE',
    slot: 1,
    labelFr: 'Intelligence',
    competencies: [
      "prise d'information",
      'perception',
      'anticipation',
      'décision',
      'orientation du corps',
      "occupation de l'espace",
      "création d'espace",
      'déplacement sans ballon',
      'reconnaissance des supériorités',
      'timing',
    ],
  },
  {
    code: 'PHYSIQUE',
    slot: 2,
    labelFr: 'Physique',
    competencies: [
      'coordination',
      'équilibre',
      'mobilité',
      'agilité',
      'endurance',
      'explosivité',
      'puissance',
      'récupération',
    ],
  },
  {
    code: 'VITESSE',
    slot: 3,
    labelFr: 'Vitesse',
    competencies: [
      'vitesse de réaction',
      'accélération',
      'vitesse maximale',
      'changement de direction',
      'vitesse avec ballon',
      'vitesse de décision',
    ],
  },
  {
    code: 'EDUCATION',
    slot: 4,
    labelFr: 'Éducation',
    competencies: [
      'discipline',
      'hygiène',
      'sommeil',
      'nutrition',
      'école',
      'responsabilité',
      "respect de l'arbitre",
      'fair-play',
    ],
  },
  {
    code: 'MENTAL',
    slot: 5,
    labelFr: 'Mental',
    competencies: [
      'confiance',
      'concentration',
      'courage',
      'persévérance',
      "gestion de l'erreur",
      'compétitivité',
      'autonomie',
      'leadership',
    ],
  },
  {
    code: 'SOCIAL',
    slot: 6,
    labelFr: 'Social',
    competencies: [
      'communication',
      'respect',
      'coopération',
      "esprit d'équipe",
      'leadership collectif',
    ],
  },
  {
    code: 'TECHNIQUE',
    slot: 7,
    labelFr: 'Technique',
    competencies: [
      'conduite',
      'contrôle',
      'contrôle orienté',
      'passe courte',
      'passe longue',
      'réception',
      'dribble',
      '1 contre 1 offensif',
      'finition',
      'pied faible',
      'jeu aérien',
      'protection du ballon',
    ],
  },
  {
    code: 'TACTIQUE',
    slot: 8,
    labelFr: 'Tactique',
    competencies: [
      'largeur',
      'profondeur',
      'intervalles',
      'lignes de passe',
      'supériorité numérique',
      'pressing',
      'couverture',
      'transition offensive',
      'transition défensive',
      'sortie de balle',
      'progression',
      'finition collective',
    ],
  },
] as const;

export const DOMAIN_ORDER: readonly DomainCode[] = DOMAINS.map((d) => d.code);

export function getDomain(code: DomainCode): DomainDefinition {
  const domain = DOMAINS.find((d) => d.code === code);
  if (!domain) throw new Error(`Domaine inconnu : ${code}`);
  return domain;
}

export const TOTAL_COMPETENCIES = DOMAINS.reduce((sum, d) => sum + d.competencies.length, 0);
