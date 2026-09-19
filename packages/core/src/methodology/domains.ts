import domainsData from '../../data/domains.json';

/**
 * Les 8 domaines de développement FUTURISTE et leurs compétences.
 *
 * SOURCE UNIQUE : `data/domains.json`. Ce même fichier alimente le seed SQL
 * (`supabase/seed/generate.mjs`), pour que le référentiel du code et celui de
 * la base ne puissent pas diverger — sans quoi le Session Studio proposerait
 * des exercices rattachés à des compétences qui n'existent pas en base.
 *
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

export const DOMAINS: readonly DomainDefinition[] = domainsData as readonly DomainDefinition[];

export const DOMAIN_ORDER: readonly DomainCode[] = DOMAINS.map((d) => d.code);

export function getDomain(code: DomainCode): DomainDefinition {
  const domain = DOMAINS.find((d) => d.code === code);
  if (!domain) throw new Error(`Domaine inconnu : ${code}`);
  return domain;
}

export const TOTAL_COMPETENCIES = DOMAINS.reduce((sum, d) => sum + d.competencies.length, 0);

/** Code stable d'une compétence, utilisé comme clé en base. */
export function competencyCode(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
