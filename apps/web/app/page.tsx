import Link from 'next/link';
import { LandingPreview } from '@/components/maquettes/landing-preview';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <LandingPreview />
      <p className="mt-10 border-t border-surface-border pt-4 text-small text-content-secondary">
        Phase 1 — fondations.{' '}
        <Link href="/maquettes" className="text-futuriste-violet underline">
          Voir les 10 maquettes d&apos;écrans
        </Link>
      </p>
    </main>
  );
}
