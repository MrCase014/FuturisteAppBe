import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { Alert, Card } from '@/components/kit';
import { LoginForm } from './login-form';

export const metadata = { title: 'Connexion · FUTURISTE ACADÉMIE FC' };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string; erreur?: string }>;
}) {
  const { suite, erreur } = await searchParams;
  const configured = isSupabaseConfigured();

  const messages: Record<string, string> = {
    lien_invalide: 'Ce lien de connexion est incomplet. Demandez-en un nouveau.',
    lien_expire: 'Ce lien a expiré. Demandez-en un nouveau.',
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-caption uppercase tracking-[0.2em] text-content-muted">
          Futuriste Académie FC
        </p>
        <h1 className="mt-1 font-display text-h1 text-futuriste-violet">Connexion</h1>
        <p className="mt-2 text-small text-content-secondary">
          Les comptes sont créés par l&apos;académie. Il n&apos;y a pas d&apos;inscription libre.
        </p>
      </div>

      {erreur && messages[erreur] && (
        <div className="mb-4">
          <Alert tone="serious">{messages[erreur]}</Alert>
        </div>
      )}

      {!configured && (
        <div className="mb-4">
          <Alert tone="warning">
            La connexion n&apos;est pas encore configurée sur ce serveur. Les deux variables
            Supabase doivent être renseignées dans l&apos;hébergement.
          </Alert>
        </div>
      )}

      <Card>
        <LoginForm suite={suite ?? '/tableau-de-bord'} disabled={!configured} />
      </Card>

      <p className="mt-4 text-center text-small">
        <Link href="/mot-de-passe-oublie" className="text-futuriste-violet underline">
          Mot de passe oublié ?
        </Link>
      </p>
      <p className="mt-6 text-center text-caption text-content-muted">
        <Link href="/" className="underline">
          Retour à l&apos;accueil
        </Link>
      </p>
    </main>
  );
}
