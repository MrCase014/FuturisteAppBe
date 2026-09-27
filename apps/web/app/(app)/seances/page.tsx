import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isStaffRole } from '@futuriste/core';
import { Card, EmptyState, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { listSessions } from '@/lib/data/sessions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  PLANNED: 'Prévue',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

/** Date et heure, telles qu'un coach les lit — pas un horodatage. */
function lisible(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 6.3 — La liste des séances. */
export default async function SeancesPage() {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const sessions = await listSessions(supabase);
  const peutPreparer = isStaffRole(profile.role) || profile.role === 'COACH';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-h1 text-content-primary">Séances</h1>
          <p className="mt-1 text-body text-content-secondary">
            Ce qui est prévu, et ce qui a été fait.
          </p>
        </div>
        {peutPreparer && (
          <Link
            href="/seances/nouvelle"
            className="inline-flex min-h-touch items-center rounded-md bg-futuriste-violet px-4 text-body font-medium text-white"
          >
            Préparer une séance
          </Link>
        )}
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          message="Aucune séance pour l’instant."
          action={peutPreparer ? 'Préparez la première : quatre questions suffisent.' : undefined}
        />
      ) : (
        <Card className="space-y-2">
          <SectionTitle>{sessions.length} séance(s)</SectionTitle>
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/seances/${session.id}`}
                  className="block rounded-md border border-surface-border p-3 hover:bg-surface-raised"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-body font-medium text-content-primary">
                      {session.title}
                    </span>
                    <span className="text-caption text-content-muted">
                      {STATUS_LABEL[session.status] ?? session.status}
                    </span>
                  </div>
                  <p className="text-caption text-content-secondary">
                    {lisible(session.scheduledAt)} · {session.durationMin} min
                    {session.teamName ? ` · ${session.teamName}` : ''} · {session.blockCount} blocs
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
