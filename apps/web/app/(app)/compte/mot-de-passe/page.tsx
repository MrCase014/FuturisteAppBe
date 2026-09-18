import Link from 'next/link';
import { Card, SectionTitle } from '@/components/kit';
import { requireSessionProfile } from '@/lib/supabase/session';
import { ChangePasswordForm } from './change-form';

export const metadata = { title: 'Mot de passe · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/** Changement volontaire, depuis l'espace personnel. */
export default async function MotDePassePage() {
  const profile = await requireSessionProfile();

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="font-display text-h1">Mot de passe</h1>
      <p className="mt-1 text-small text-content-secondary">
        Compte de {profile.firstName} {profile.lastName}
      </p>

      <Card className="mt-5">
        <SectionTitle>Changer mon mot de passe</SectionTitle>
        <ChangePasswordForm />
      </Card>

      <p className="mt-4 text-caption text-content-secondary">
        Vous ne vous souvenez plus de votre mot de passe actuel ? Déconnectez-vous et utilisez{' '}
        <Link href="/mot-de-passe-oublie" className="text-futuriste-violet underline">
          mot de passe oublié
        </Link>{' '}
        : vous recevrez un lien par e-mail.
      </p>

      <p className="mt-6 text-center text-small">
        <Link href="/tableau-de-bord" className="text-futuriste-violet underline">
          Retour au tableau de bord
        </Link>
      </p>
    </main>
  );
}
