import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { GENDER_LABEL } from '@futuriste/core';
import { Alert, Card, EmptyState, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { listCoaches, listPlayers } from '@/lib/data/people';
import { removeCoach, removePlayerFromTeam } from '../actions';
import { AddPlayer, AssignCoach } from './assign';

export const dynamic = 'force-dynamic';

/**
 * D14 / C3 — Détail d'une équipe : effectif et staff.
 *
 * C'est l'écran du test de recette de la phase 4 : créer une équipe, y mettre
 * des joueurs, affecter un coach — puis vérifier que ce coach voit ces joueurs
 * et aucun autre.
 */
export default async function FicheEquipePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { id } = await params;
  const isStaff = profile.role === 'SUPER_ADMIN' || profile.role === 'ACADEMY_DIRECTOR';

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, season, gender, age_groups(code, label_fr)')
    .eq('id', id)
    .maybeSingle();
  // Une équipe hors périmètre ne remonte pas : pour le coach, elle n'existe pas.
  if (!team) notFound();

  const [{ data: memberships }, { data: staff }, allPlayers, allCoaches] = await Promise.all([
    supabase
      .from('player_team_memberships')
      .select('id, player_id, players(first_name, last_name, jersey_number)')
      .eq('team_id', id)
      .eq('is_active', true),
    supabase
      .from('team_coaches')
      .select('coach_id, role, profiles(first_name, last_name)')
      .eq('team_id', id),
    isStaff ? listPlayers(supabase) : Promise.resolve([]),
    isStaff ? listCoaches(supabase) : Promise.resolve([]),
  ]);

  const roster = (memberships ?? [])
    .map((m) => {
      const p = m.players as {
        first_name: string;
        last_name: string;
        jersey_number: number | null;
      } | null;
      return p
        ? {
            membershipId: m.id,
            playerId: m.player_id,
            name: `${p.first_name} ${p.last_name}`,
            jersey: p.jersey_number,
          }
        : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  const coaches = (staff ?? [])
    .map((c) => {
      const p = c.profiles as { first_name: string; last_name: string } | null;
      return p ? { id: c.coach_id, name: `${p.first_name} ${p.last_name}`, role: c.role } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const inTeam = new Set(roster.map((r) => r.playerId));
  const assigned = new Set(coaches.map((c) => c.id));
  const group = team.age_groups as { code: string; label_fr: string } | null;

  return (
    <div className="space-y-5">
      <Link href="/equipes" className="text-small text-futuriste-violet underline">
        ← Toutes les équipes
      </Link>

      <div>
        <h1 className="font-display text-h1 text-content-primary">{team.name}</h1>
        <p className="mt-1 text-small text-content-secondary">
          {group?.code ?? '—'} · {GENDER_LABEL[team.gender] ?? team.gender} · saison {team.season}
        </p>
      </div>

      <Card>
        <SectionTitle>Staff</SectionTitle>
        {coaches.length === 0 ? (
          <p className="text-small text-content-secondary">Aucun coach affecté.</p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {coaches.map((coach) => (
              <li key={coach.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-body text-content-primary">{coach.name}</span>
                {isStaff && (
                  <form action={removeCoach}>
                    <input type="hidden" name="teamId" value={team.id} />
                    <input type="hidden" name="coachId" value={coach.id} />
                    <button
                      type="submit"
                      className="min-h-touch px-2 text-caption text-content-secondary underline
                                 hover:text-content-primary"
                    >
                      Retirer
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {isStaff && (
          <div className="mt-4">
            <AssignCoach
              teamId={team.id}
              candidates={allCoaches
                .filter((c) => !assigned.has(c.id) && c.isActive)
                .map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` }))}
            />
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Effectif · {roster.length}</SectionTitle>
        {roster.length === 0 ? (
          <EmptyState message="Aucun joueur dans cette équipe pour l'instant." />
        ) : (
          <ul className="divide-y divide-surface-border">
            {roster.map((row) => (
              <li key={row.membershipId} className="flex items-center justify-between gap-3 py-2">
                <Link
                  href={`/joueurs/${row.playerId}`}
                  className="min-w-0 flex-1 truncate text-body text-content-primary hover:underline"
                >
                  {row.name}
                  {row.jersey !== null && (
                    <span className="ml-2 text-caption text-content-muted">n° {row.jersey}</span>
                  )}
                </Link>
                {isStaff && (
                  <form action={removePlayerFromTeam}>
                    <input type="hidden" name="teamId" value={team.id} />
                    <input type="hidden" name="membershipId" value={row.membershipId} />
                    <button
                      type="submit"
                      className="min-h-touch px-2 text-caption text-content-secondary underline
                                 hover:text-content-primary"
                    >
                      Retirer
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {isStaff && (
          <div className="mt-4">
            <AddPlayer
              teamId={team.id}
              season={team.season}
              candidates={allPlayers
                .filter((p) => !inTeam.has(p.id))
                .map((p) => ({ id: p.id, label: `${p.firstName} ${p.lastName} · ${p.age} ans` }))}
            />
          </div>
        )}
      </Card>

      {isStaff && (
        <Alert tone="good">
          Retirer un joueur ne l&apos;efface pas : son appartenance est close, et son historique de
          progression reste attaché à l&apos;équipe qu&apos;il a quittée.
        </Alert>
      )}
    </div>
  );
}
