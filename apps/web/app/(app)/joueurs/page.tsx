import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GENDER_LABEL, PLAYER_STATUS_LABEL } from '@futuriste/core';
import { Avatar, Card, EmptyState, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { listPlayers, listTeams, parsePlayerStatus } from '@/lib/data/people';
import { PlayerFilters } from './filters';

export const metadata = { title: 'Joueurs · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/**
 * D4 / C4 — Liste des joueurs.
 *
 * Un seul écran pour le directeur et pour le coach. Ce n'est pas une économie
 * de code : c'est la garantie que le coach ne voit pas « la liste filtrée »
 * mais bien tout ce à quoi il a droit, ni plus ni moins, décidé par la base.
 */
export default async function JoueursPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; equipe?: string; statut?: string }>;
}) {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { q, equipe, statut } = await searchParams;
  const isStaff = profile.role === 'SUPER_ADMIN' || profile.role === 'ACADEMY_DIRECTOR';

  const [players, teams] = await Promise.all([
    listPlayers(supabase, { search: q, teamId: equipe, status: parsePlayerStatus(statut) }),
    listTeams(supabase),
  ]);

  const filtered = Boolean(q || equipe || statut);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-h1 text-content-primary">Joueurs</h1>
          <p className="mt-1 text-small text-content-secondary">
            {isStaff
              ? "Tous les joueurs de l'académie."
              : 'Les joueurs de vos équipes, et eux seuls.'}
          </p>
        </div>
        {isStaff && (
          <Link
            href="/joueurs/nouveau"
            className="inline-flex min-h-touch items-center rounded-md bg-futuriste-violet px-4
                       text-body font-medium text-white hover:bg-futuriste-violet-deep"
          >
            Ajouter un joueur
          </Link>
        )}
      </div>

      <Card>
        <PlayerFilters teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
      </Card>

      <p className="text-small text-content-secondary">
        {players.length} joueur{players.length > 1 ? 's' : ''}
        {filtered ? ' correspondant à votre recherche' : ''}
      </p>

      {players.length === 0 ? (
        <EmptyState
          message={
            filtered
              ? 'Aucun joueur ne correspond. Essayez avec moins de filtres.'
              : "Aucun joueur pour l'instant."
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-surface-border">
            {players.map((player) => (
              <li key={player.id}>
                <Link
                  href={`/joueurs/${player.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-surface-raised"
                >
                  <Avatar
                    initials={`${player.firstName[0] ?? ''}${player.lastName[0] ?? ''}`.toUpperCase()}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-medium text-content-primary">
                      {player.firstName} {player.lastName}
                      {player.jerseyNumber !== null && (
                        <span className="ml-2 text-caption text-content-muted">
                          n° {player.jerseyNumber}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-caption text-content-secondary">
                      {player.age} ans · {GENDER_LABEL[player.gender] ?? player.gender}
                      {player.teamNames.length > 0 && ` · ${player.teamNames.join(', ')}`}
                    </span>
                  </span>
                  {player.status !== 'ACTIVE' && (
                    <span className="shrink-0 rounded-full bg-surface-raised px-2.5 py-1 text-caption text-content-secondary">
                      {PLAYER_STATUS_LABEL[player.status] ?? player.status}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section>
        <SectionTitle>À venir</SectionTitle>
        <p className="text-caption text-content-secondary">
          L&apos;export de la liste arrive avec les statistiques, en phase 10.
        </p>
      </section>
    </div>
  );
}
