import Link from 'next/link';
import { Card, SectionTitle } from '@/components/kit';
import { ROLE_LABEL, requireSessionProfile } from '@/lib/supabase/session';

export const metadata = { title: 'Mon compte · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/** Espace personnel : ce que l'académie sait de vous, et ce que vous pouvez changer. */
export default async function ComptePage() {
  const profile = await requireSessionProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Mon compte</h1>
        <p className="mt-1 text-small text-content-secondary">
          {profile.firstName} {profile.lastName} · {ROLE_LABEL[profile.role]}
        </p>
      </div>

      <Card>
        <SectionTitle>Mes informations</SectionTitle>
        <dl className="space-y-2 text-small">
          <div className="flex justify-between border-b border-surface-border pb-2">
            <dt className="text-content-secondary">Nom</dt>
            <dd>
              {profile.firstName} {profile.lastName}
            </dd>
          </div>
          <div className="flex justify-between border-b border-surface-border pb-2">
            <dt className="text-content-secondary">Adresse e-mail</dt>
            <dd className="truncate pl-3">{profile.email ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-secondary">Rôle</dt>
            <dd>{ROLE_LABEL[profile.role]}</dd>
          </div>
        </dl>
        <p className="mt-3 text-caption text-content-secondary">
          Votre nom et votre rôle sont gérés par l&apos;académie. Contactez la direction pour les
          faire corriger.
        </p>
      </Card>

      <Card>
        <SectionTitle>Sécurité</SectionTitle>
        <Link href="/compte/mot-de-passe" className="text-body text-futuriste-violet underline">
          Changer mon mot de passe
        </Link>
        <p className="mt-2 text-caption text-content-secondary">
          Changer votre mot de passe déconnecte automatiquement vos autres appareils.
        </p>
      </Card>
    </div>
  );
}
