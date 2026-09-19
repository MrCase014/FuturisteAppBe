/**
 * Génère tokens/theme.css depuis tokens/colors.json.
 * Une seule source de vérité : les valeurs claires ET sombres viennent du JSON.
 * Lancer après toute modification de la palette :  pnpm --filter @futuriste/ui tokens
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const colors = JSON.parse(readFileSync(join(here, '../tokens/colors.json'), 'utf8'));

/** @type {[string, {light:string,dark:string}][]} */
const pairs = [
  ['violet', colors.brand.violet],
  ['violet-deep', colors.brand.violetDeep],
  ['sky', colors.brand.sky],
  ['sky-deep', colors.brand.skyDeep],
  ['ink', colors.brand.ink],
  ['surface-app', colors.surface.app],
  ['surface-card', colors.surface.card],
  ['surface-raised', colors.surface.raised],
  ['surface-border', colors.surface.border],
  ['text-primary', colors.text.primary],
  ['text-secondary', colors.text.secondary],
  ['text-muted', colors.text.muted],
  ...colors.domains.map((d) => [`domain-${d.code.toLowerCase()}`, d]),
  ...colors.levels.map((l) => [`level-${l.level}`, l]),
];

const line = ([name, value], mode) => `  --fut-${name}: ${value[mode]};`;
const block = (mode) => pairs.map((p) => line(p, mode)).join('\n');

const css = `/* GÉNÉRÉ par scripts/generate-theme-css.mjs — ne pas éditer à la main.
   Source : tokens/colors.json. Voir docs/08-DESIGN-SYSTEM.md.
   Le mode sombre n'est pas un inversement automatique : chaque valeur est choisie. */
:root {
${block('light')}
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${block('dark')}
    color-scheme: dark;
  }
}

:root[data-theme='dark'] {
${block('dark')}
  color-scheme: dark;
}
`;

writeFileSync(join(here, '../tokens/theme.css'), css);
console.log(`theme.css généré — ${pairs.length} jetons, 2 modes.`);
