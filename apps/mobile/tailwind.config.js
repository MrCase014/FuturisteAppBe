/** Le mobile utilise EXACTEMENT le même preset que le web : un seul design system. */
const preset = require('@futuriste/ui/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset'), preset],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
};
