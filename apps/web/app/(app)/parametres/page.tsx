import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert, Card, EmptyState, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { AcademySettingsForm } from './settings-form';

export const metadata = { title: 'Paramètres · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

const AUDIT_LABELS: Record<string, string> = {
  ACADEMY_SETTINGS_UPDATED: "Paramètres de l'académie modifiés",
};

/**
 * D26 — Paramètres de l'académie (livrable 3.5).
 *
 * Le formulaire s'affiche pour tout le monde, mais seul le personnel peut
 * enregistrer : c'est PostgreSQL qui refuse, pas cette page. Les coachs et les
 * familles ne voient d'ailleurs jamais l'entrée « Gérer » dans leur navigation.
 */
export default async function ParametresPage() {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const isStaff = profile.role === 'SUPER_ADMIN' || profile.role === 'ACADEMY_DIRECTOR';

  const [academy, audit] = await Promise.all([
    supabase
      .from('academies')
      .select('name, city, country, default_locale, logo_url, created_at')
      .eq('id', profile.academyId)
      .maybeSingle(),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (!academy.data) {
    return (
      <EmptyState message="Les paramètres de votre académie n'ont pas pu être lus. Reconnectez-vous, puis signalez-le si cela persiste." />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Paramètres</h1>
        <p className="mt-1 text-small text-content-secondary">
          Identité de l&apos;académie et journal des modifications.
        </p>
      </div>

      <Card>
        <SectionTitle>Gérer l&apos;académie</SectionTitle>
        <ul className="divide-y divide-surface-border">
          {[
            { href: '/equipes', label: 'Équipes', hint: 'Effectifs, staff, affectations' },
            { href: '/categories', label: 'Catégories', hint: 'De U7 à U18, et leur méthodologie' },
            ...(isStaff
              ? [{ href: '/coachs', label: 'Coachs', hint: 'Qui encadre quelle équipe' }]
              : []),
            { href: '/joueurs', label: 'Joueurs', hint: 'Rechercher, filtrer, consulter' },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center gap-3 py-3 hover:bg-surface-raised"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-body text-content-primary">{link.label}</span>
                  <span className="block text-caption text-content-secondary">{link.hint}</span>
                </span>
                <span aria-hidden className="text-content-muted">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle>Académie</SectionTitle>
        {isStaff ? (
          <AcademySettingsForm
            name={academy.data.name}
            city={academy.data.city ?? ''}
            country={academy.data.country ?? ''}
            locale={academy.data.default_locale}
          />
        ) : (
          <dl className="space-y-2 text-small">
            <div className="flex justify-between border-b border-surface-border pb-2">
              <dt className="text-content-secondary">Nom</dt>
              <dd>{academy.data.name}</dd>
            </div>
            <div className="flex justify-between border-b border-surface-border pb-2">
              <dt className="text-content-secondary">Ville</dt>
              <dd>{academy.data.city ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-content-secondary">Langue</dt>
              <dd>{academy.data.default_locale === 'en' ? 'English' : 'Français'}</dd>
            </div>
          </dl>
        )}
      </Card>

      <Card>
        <SectionTitle>Saison et logo</SectionTitle>
        <p className="text-small text-content-secondary">
          La gestion des saisons et l&apos;envoi du logo arrivent en phase 4, avec le stockage de
          fichiers. Les couleurs de l&apos;académie restent celles du design system.
        </p>
      </Card>

      <Card>
        <SectionTitle>Journal des modifications</SectionTitle>
        {!isStaff ? (
          <Alert tone="good">
            Le journal est réservé à la direction. Votre compte n&apos;y a pas accès — et c&apos;est
            la base qui le refuse, pas cet écran.
          </Alert>
        ) : audit.data && audit.data.length > 0 ? (
          <ul className="divide-y divide-surface-border text-small">
            {audit.data.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-content-primary">
                  {AUDIT_LABELS[entry.action] ?? entry.action}
                </span>
                <time
                  dateTime={entry.created_at}
                  className="shrink-0 text-caption tabular-nums text-content-secondary"
                >
                  {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-content-secondary">
            Aucune modification enregistrée pour l&apos;instant.
          </p>
        )}
        <p className="mt-3 text-caption text-content-secondary">
          Le journal ne peut être ni modifié ni effacé, y compris par la direction : aucune
          politique d&apos;écriture ou de suppression n&apos;existe en base. C&apos;est ce qui en
          fait une preuve.
        </p>
      </Card>
    </div>
  );
}
