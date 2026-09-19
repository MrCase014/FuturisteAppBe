import Link from 'next/link';
import { Alert, Card } from '@/components/kit';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { ResetForm } from './reset-form';

export const metadata = { title: 'Mot de passe oublié · FUTURISTE ACADÉMIE FC' };

export default function MotDePasseOubliePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="font-display text-h1 text-futuriste-violet">Mot de passe oublié</h1>
        <p className="mt-2 text-small text-content-secondary">
          Nous vous envoyons un lien pour en choisir un nouveau.
        </p>
      </div>

      {!isSupabaseConfigured() && (
        <div className="mb-4">
          <Alert tone="warning">
            Cette fonction n&apos;est pas encore configurée sur ce serveur.
          </Alert>
        </div>
      )}

      <Card>
        <ResetForm disabled={!isSupabaseConfigured()} />
      </Card>

      <p className="mt-6 text-center text-small">
        <Link href="/connexion" className="text-futuriste-violet underline">
          Retour à la connexion
        </Link>
      </p>
    </main>
  );
}
