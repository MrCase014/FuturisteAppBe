import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GENDER_LABEL } from '@futuriste/core';
import { Card, EmptyState, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { listAgeGroups, listTeams } from '@/lib/data/people';
import { CreateTeamForm } from './create-form';

export const metadata = { title: 'Équipes · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/**
 * D13 / C2 — Équipes.
 *
 * Le directeur voit celles de son académie, le coach uniquement celles qui lui
 * sont affectées. Même page, même code : c'est RLS qui fait la différence.
 */
export default async function EquipesPage() {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const isStaff = profile.role === 'SUPER_ADMIN' || profile.role === 'ACADEMY_DIRECTOR';
  const [teams, ageGroups] = await Promise.all([
    listTeams(supabase),
    isStaff ? listAgeGroups(supabase) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Équipes</h1>
        <p className="mt-1 text-small text-content-secondary">
          {isStaff ? "Toutes les équipes de l'académie." : 'Les équipes qui vous sont affectées.'}
        </p>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          message={
            isStaff
              ? "Aucune équipe pour l'instant."
              : "Aucune équipe ne vous est affectée. C'est la direction qui procède aux affectations."
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-surface-border">
            {teams.map((team) => (
              <li key={team.id}>
                <Link
                  href={`/equipes/${team.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-surface-raised"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-medium text-content-primary">
                      {team.name}
                    </span>
                    <span className="block truncate text-caption text-content-secondary">
                      {team.ageGroupCode ?? '—'} · {GENDER_LABEL[team.gender] ?? team.gender} ·{' '}
                      {team.season}
                      {team.coachNames.length > 0 && ` · ${team.coachNames.join(', ')}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-small tabular-nums text-content-secondary">
                    {team.playersCount} joueur{team.playersCount > 1 ? 's' : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isStaff && (
        <Card>
          <SectionTitle>Créer une équipe</SectionTitle>
          <CreateTeamForm
            ageGroups={ageGroups.map((g) => ({ id: g.id, label: `${g.code} · ${g.labelFr}` }))}
          />
        </Card>
      )}

      <p className="text-caption text-content-secondary">
        L&apos;affectation des joueurs et des coachs se fait depuis la fiche de chaque équipe.
      </p>
    </div>
  );
}
