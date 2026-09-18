import Link from 'next/link';
import { Alert, Card } from '@/components/kit';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSessionFresh } from '@/lib/supabase/password';
import { ResetPasswordForm } from './reset-form';

export const metadata = { title: 'Nouveau mot de passe · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/** Destination du lien de réinitialisation reçu par e-mail. */
export default async function NouveauMotDePassePage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  const usable = Boolean(user) && isSessionFresh(user?.last_sign_in_at);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-caption uppercase tracking-[0.2em] text-content-muted">
          Futuriste Académie FC
        </p>
        <h1 className="mt-1 font-display text-h1 text-futuriste-violet">Nouveau mot de passe</h1>
        <p className="mt-2 text-small text-content-secondary">
          Choisissez-en un que vous retiendrez. Vos autres appareils seront déconnectés.
        </p>
      </div>

      {!supabase ? (
        <Card>
          <Alert tone="warning">{SUPABASE_UNAVAILABLE_MESSAGE}</Alert>
        </Card>
      ) : usable ? (
        <Card>
          <ResetPasswordForm />
        </Card>
      ) : (
        <Card>
          <Alert tone="serious">
            Ce lien n&apos;est plus valable. Par sécurité, un lien de réinitialisation ne sert
            qu&apos;une fois et pendant un temps limité.
          </Alert>
          <p className="mt-4 text-small">
            <Link href="/mot-de-passe-oublie" className="text-futuriste-violet underline">
              Demander un nouveau lien
            </Link>
          </p>
        </Card>
      )}

      <p className="mt-6 text-center text-caption text-content-muted">
        <Link href="/connexion" className="underline">
          Retour à la connexion
        </Link>
      </p>
    </main>
  );
}
