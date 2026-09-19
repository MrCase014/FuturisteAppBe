import colors from '../tokens/colors.json';
import scale from '../tokens/scale.json';

export type ThemeMode = 'light' | 'dark';

export type DomainCode =
  | 'INTELLIGENCE'
  | 'PHYSIQUE'
  | 'VITESSE'
  | 'EDUCATION'
  | 'MENTAL'
  | 'SOCIAL'
  | 'TECHNIQUE'
  | 'TACTIQUE';

export type EvaluationLevel = 1 | 2 | 3 | 4 | 5;

export const tokens = { colors, scale } as const;

/**
 * Couleur d'un domaine, pour le mode demandé.
 * L'ordre des slots est validé (séparation daltonisme) : voir docs/08-DESIGN-SYSTEM.md.
 */
export function domainColor(code: DomainCode, mode: ThemeMode = 'light'): string {
  const domain = colors.domains.find((d) => d.code === code);
  if (!domain) throw new Error(`Domaine inconnu : ${code}`);
  return domain[mode];
}

/**
 * Vrai si ce domaine passe sous 3:1 de contraste en mode clair.
 * Dans ce cas un libellé visible ou la vue tableau est OBLIGATOIRE :
 * la couleur ne porte jamais l'information seule.
 */
export function domainNeedsLabelRelief(code: DomainCode): boolean {
  return colors.domains.find((d) => d.code === code)?.lowContrastLight ?? false;
}

export function levelColor(level: EvaluationLevel, mode: ThemeMode = 'light'): string {
  const entry = colors.levels.find((l) => l.level === level);
  if (!entry) throw new Error(`Niveau invalide : ${level}`);
  return entry[mode];
}

export function levelLabel(level: EvaluationLevel, locale: 'fr' | 'en' = 'fr'): string {
  const entry = colors.levels.find((l) => l.level === level);
  if (!entry) throw new Error(`Niveau invalide : ${level}`);
  return locale === 'fr' ? entry.labelFr : entry.labelEn;
}

export const DOMAIN_ORDER: readonly DomainCode[] = colors.domains.map((d) => d.code as DomainCode);
