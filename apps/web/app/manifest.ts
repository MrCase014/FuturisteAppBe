import type { MetadataRoute } from 'next';

/**
 * Le manifeste d'installation.
 *
 * C'est ce fichier qui permet d'ajouter FUTURISTE à l'écran d'accueil d'un
 * téléphone : l'application s'ouvre alors en plein écran, avec son icône et
 * ses couleurs, sans barre d'adresse. Il n'y a ni App Store ni Play Store à
 * traverser, et rien à réinstaller à chaque mise à jour — c'est ce qui permet
 * à une académie de diffuser son outil à trente familles en un lien.
 *
 * `display: standalone` et non `fullscreen` : on garde la barre d'état du
 * téléphone, donc l'heure et la batterie. Un coach au bord du terrain a
 * besoin de savoir quelle heure il est.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FUTURISTE ACADÉMIE FC',
    short_name: 'FUTURISTE',
    description:
      'Le centre de formation FUTURISTE ACADÉMIE FC : méthodologie, joueurs, séances et suivi, pour les filles et les garçons de 6 à 18 ans.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAFAFC',
    theme_color: '#7C3AED',
    lang: 'fr',
    categories: ['sports', 'education'],
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // `maskable` : Android découpe l'icône en cercle, en goutte ou en carré
      // selon le téléphone. Sans cette version aux marges plus larges, le logo
      // se fait rogner.
      { src: '/icone-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
