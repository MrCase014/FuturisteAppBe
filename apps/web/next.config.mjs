/**
 * En-têtes de sécurité HTTP.
 *
 * Ils ne remplacent rien de ce qui est fait côté base : ils traitent des
 * attaques que RLS ne voit pas — le navigateur d'un parent piégé sur un autre
 * site, une page FUTURISTE affichée dans un cadre invisible pour lui faire
 * cliquer à son insu, ou une ressource injectée dans la page.
 *
 * `connect-src` autorise supabase.co parce que c'est là que l'application
 * parle : toute autre destination est refusée par le navigateur lui-même.
 */
const securityHeaders = [
  // Le site n'est jamais servi en clair, y compris pour les sous-domaines.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Personne n'affiche FUTURISTE dans un cadre : parade au détournement de clic.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Pas de réinterprétation du type d'un fichier servi.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // L'URL complète d'une page interne ne fuite pas vers un site tiers.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Aucune API sensible du navigateur n'est demandée par cette application.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js injecte ses scripts d'hydratation en ligne.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "media-src 'self' blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les packages partagés sont du TypeScript non compilé : Next les transpile.
  transpilePackages: [
    '@futuriste/ui',
    '@futuriste/core',
    '@futuriste/i18n',
    '@futuriste/supabase',
    '@futuriste/diagrams',
  ],
  // Ne pas annoncer la version du serveur : une information offerte à qui
  // cherche une faille connue.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
