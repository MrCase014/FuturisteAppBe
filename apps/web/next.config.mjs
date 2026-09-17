/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les packages partagés sont du TypeScript non compilé : Next les transpile.
  transpilePackages: ['@futuriste/ui', '@futuriste/core', '@futuriste/i18n', '@futuriste/supabase'],
};

export default nextConfig;
