import { notFound, redirect } from 'next/navigation';
import { Avatar, Card, EmptyState } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { listCoaches } from '@/lib/data/people';

export const metadata = { title: 'Coachs · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/** D7 — Liste des coachs et de leurs affectations. Écran de direction. */
export default async function CoachsPage() {
  const profile = await requireSessionProfile();
  const isStaff = profile.role === 'SUPER_ADMIN' || profile.role === 'ACADEMY_DIRECTOR';
  if (!isStaff) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const coaches = await listCoaches(supabase);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Coachs</h1>
        <p className="mt-1 text-small text-content-secondary">
          Un coach ne voit que les joueurs des équipes qui lui sont affectées.
        </p>
      </div>

      {coaches.length === 0 ? (
        <EmptyState message="Aucun coach enregistré." />
      ) : (
        <Card>
          <ul className="divide-y divide-surface-border">
            {coaches.map((coach) => (
              <li key={coach.id} className="flex items-center gap-3 py-3">
                <Avatar
                  initials={`${coach.firstName[0] ?? ''}${coach.lastName[0] ?? ''}`.toUpperCase()}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-content-primary">
                    {coach.firstName} {coach.lastName}
                    {!coach.isActive && (
                      <span className="ml-2 text-caption text-content-muted">compte désactivé</span>
                    )}
                  </span>
                  <span className="block truncate text-caption text-content-secondary">
                    {coach.teamNames.length > 0
                      ? coach.teamNames.join(', ')
                      : 'Aucune équipe affectée'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-caption text-content-secondary">
        L&apos;activité détaillée d&apos;un coach — séances animées, évaluations saisies — arrive
        avec les séances, en phase 6.
      </p>
    </div>
  );
}
