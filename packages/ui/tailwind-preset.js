/**
 * FUTURISTE ACADÉMIE FC — preset Tailwind partagé web + mobile.
 *
 * Chaque couleur pointe vers une variable CSS, avec la valeur claire en repli.
 * Le repli permet au mobile (NativeWind) de fonctionner avant que le thème
 * sombre natif n'arrive en Phase 11 ; sur le web, theme.css fournit les deux modes.
 * Source unique : tokens/colors.json.
 */
const colors = require('./tokens/colors.json');
const scale = require('./tokens/scale.json');

const v = (name, fallback) => `var(--fut-${name}, ${fallback})`;

const domainColors = Object.fromEntries(
  colors.domains.map((d) => [d.code.toLowerCase(), v(`domain-${d.code.toLowerCase()}`, d.light)]),
);
const levelColors = Object.fromEntries(
  colors.levels.map((l) => [String(l.level), v(`level-${l.level}`, l.light)]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        futuriste: {
          violet: v('violet', colors.brand.violet.light),
          'violet-deep': v('violet-deep', colors.brand.violetDeep.light),
          sky: v('sky', colors.brand.sky.light),
          'sky-deep': v('sky-deep', colors.brand.skyDeep.light),
          ink: v('ink', colors.brand.ink.light),
        },
        surface: {
          app: v('surface-app', colors.surface.app.light),
          card: v('surface-card', colors.surface.card.light),
          raised: v('surface-raised', colors.surface.raised.light),
          border: v('surface-border', colors.surface.border.light),
        },
        content: {
          primary: v('text-primary', colors.text.primary.light),
          secondary: v('text-secondary', colors.text.secondary.light),
          muted: v('text-muted', colors.text.muted.light),
        },
        domain: domainColors,
        level: levelColors,
        status: colors.status,
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: scale.fontSize,
      borderRadius: scale.radius,
      boxShadow: scale.shadow,
      minHeight: { touch: scale.minTouchTarget.default, field: scale.minTouchTarget.field },
      minWidth: { touch: scale.minTouchTarget.default },
    },
  },
  plugins: [],
};
