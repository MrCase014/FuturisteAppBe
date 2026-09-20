/**
 * Les sections de la méthodologie par catégorie (docs/11 §5).
 *
 * CE QUE CE FICHIER EST, ET CE QU'IL N'EST PAS
 *
 * Il décrit la FORME du contenu : quelles sections existent, dans quel ordre
 * elles se lisent, et comment elles s'intitulent. Le contenu lui-même vit en
 * base, dans la table `methodology`, parce que la direction doit pouvoir le
 * corriger sans attendre une livraison.
 *
 * Il ne décide RIEN. Une section « Interdits » qui dit « aucune note en U7 »
 * est un texte pour les coachs ; la règle, elle, est appliquée par
 * `packages/core/src/methodology/reliability.ts` et vérifiée par des tests.
 * Si la règle ne tenait qu'à ce texte, il suffirait de le réécrire pour
 * afficher des notes à des enfants de six ans.
 */

export type MethodologySectionKey = 'PRIORITES' | 'FORMAT' | 'EVALUATION' | 'REPERE' | 'INTERDITS';

export interface MethodologySectionDefinition {
  key: MethodologySectionKey;
  /** Intitulé par défaut. Une section peut le remplacer par le sien. */
  titleFr: string;
  order: number;
}

export const METHODOLOGY_SECTIONS: readonly MethodologySectionDefinition[] = [
  { key: 'PRIORITES', titleFr: 'Priorités', order: 1 },
  { key: 'FORMAT', titleFr: 'Format de jeu', order: 2 },
  { key: 'EVALUATION', titleFr: 'Évaluation', order: 3 },
  { key: 'REPERE', titleFr: 'Point de repère', order: 4 },
  { key: 'INTERDITS', titleFr: 'Interdits', order: 5 },
];

const BY_KEY = new Map(METHODOLOGY_SECTIONS.map((s) => [s.key, s]));

export function isMethodologySectionKey(value: string): value is MethodologySectionKey {
  return BY_KEY.has(value as MethodologySectionKey);
}

export function methodologySectionTitle(key: string, override?: string | null): string {
  if (override && override.trim() !== '') return override.trim();
  return BY_KEY.get(key as MethodologySectionKey)?.titleFr ?? key;
}

export function methodologySectionOrder(key: string): number {
  // Une section inconnue — ajoutée à la main en base — se range à la fin
  // plutôt que de disparaître : on ne perd jamais le travail de la direction.
  return BY_KEY.get(key as MethodologySectionKey)?.order ?? 99;
}

export interface MethodologyEntry {
  key: string;
  titleFr: string;
  bodyFr: string;
}

/** Trie les sections d'une catégorie dans l'ordre de lecture. */
export function sortMethodologySections<T extends { key: string }>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => {
    const delta = methodologySectionOrder(a.key) - methodologySectionOrder(b.key);
    return delta !== 0 ? delta : a.key.localeCompare(b.key);
  });
}

/**
 * Longueur maximale d'une section, en caractères.
 *
 * Ce n'est pas une limite technique : `text` n'en a pas. C'est une limite de
 * lecture. Un coach consulte la méthodologie sur son téléphone, au bord du
 * terrain, entre deux ateliers. Au-delà, il ne lit plus — et une consigne
 * qu'on ne lit pas ne vaut pas mieux qu'une consigne absente.
 */
export const METHODOLOGY_BODY_MAX = 600;

export const METHODOLOGY_TITLE_MAX = 60;

export type MethodologyProblem =
  'TITRE_VIDE' | 'TITRE_TROP_LONG' | 'CORPS_VIDE' | 'CORPS_TROP_LONG';

export const METHODOLOGY_PROBLEM_MESSAGES: Record<MethodologyProblem, string> = {
  TITRE_VIDE: 'Donnez un intitulé à cette section.',
  TITRE_TROP_LONG: `L'intitulé dépasse ${METHODOLOGY_TITLE_MAX} caractères.`,
  CORPS_VIDE: 'Une section vide ne dit rien : écrivez-la ou supprimez-la.',
  CORPS_TROP_LONG: `Le texte dépasse ${METHODOLOGY_BODY_MAX} caractères — personne ne le lira au bord du terrain.`,
};

/** Ce qui cloche dans une section, avant de l'enregistrer. */
export function methodologyProblems(input: {
  titleFr: string;
  bodyFr: string;
}): MethodologyProblem[] {
  const problems: MethodologyProblem[] = [];
  const title = input.titleFr.trim();
  const body = input.bodyFr.trim();

  if (title === '') problems.push('TITRE_VIDE');
  else if (title.length > METHODOLOGY_TITLE_MAX) problems.push('TITRE_TROP_LONG');

  if (body === '') problems.push('CORPS_VIDE');
  else if (body.length > METHODOLOGY_BODY_MAX) problems.push('CORPS_TROP_LONG');

  return problems;
}
