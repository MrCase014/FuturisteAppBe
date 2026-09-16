import fr from '../locales/fr/common.json';
import en from '../locales/en/common.json';

export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Le français est la langue principale de la V1. */
export const DEFAULT_LOCALE: Locale = 'fr';

export const resources = { fr, en } as const;

type Dictionary = typeof fr;

/** Chemins de clés valides, ex. 'domains.TECHNIQUE'. Vérifié à la compilation. */
export type TranslationKey = DeepKeys<Dictionary>;

type DeepKeys<T> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: T[K] extends Record<string, unknown>
          ? `${K}.${DeepKeys<T[K]>}`
          : K;
      }[keyof T & string]
    : never;

/**
 * Traduction. Aucun texte ne doit être écrit en dur dans un écran,
 * même pendant la phase française seule (docs/03-ARBORESCENCE.md, règle 4).
 */
export function translate(key: TranslationKey, locale: Locale = DEFAULT_LOCALE): string {
  const dict = resources[locale] as unknown as Record<string, unknown>;
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : key;
}

export function createTranslator(locale: Locale = DEFAULT_LOCALE) {
  return (key: TranslationKey) => translate(key, locale);
}
