import type { Metadata, Viewport } from 'next';
import { translate } from '@futuriste/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'FUTURISTE ACADÉMIE FC',
    template: '%s · FUTURISTE ACADÉMIE FC',
  },
  description: translate('app.tagline'),
  applicationName: 'FUTURISTE ACADÉMIE FC',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  // iOS ignore le manifeste : ce sont ces deux réglages qui donnent le plein
  // écran et le nom sous l'icône sur un iPhone.
  appleWebApp: {
    capable: true,
    title: 'FUTURISTE',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
  // `viewportFit: cover` : sur un téléphone à encoche, le violet de l'en-tête
  // va jusqu'au bord au lieu de laisser une bande blanche.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
