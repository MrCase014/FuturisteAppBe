import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isMedicalRole } from '@futuriste/core';
import { Alert, Card, EmptyState, SectionTitle, StatTile } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { listClearances, listPlayers } from '@/lib/data/people';

export const metadata = { title: 'Infirmerie · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  FIT: 'Apte',
  ADAPTED: 'Aménagé',
  UNFIT: 'Indisponible',
};

/**
 * Écran d'accueil du personnel soignant.
 *
 * Il répond à la question que se pose un médecin en arrivant : qui ne joue pas
 * aujourd'hui, et pourquoi. Les joueurs aptes sont relégués en bas : un écran
 * de soin se lit par exception, pas par exhaustivité.
 */
export default async function InfirmeriePage() {
  const profile = await requireSessionProfile();
  // Un écran que la base viderait entièrement ne doit pas s'ouvrir : mieux vaut
  // une page absente qu'une page vide qu'on prend pour une panne.
  if (!isMedicalRole(profile.role)) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const [players, clearances] = await Promise.all([
    listPlayers(supabase),
    listClearances(supabase),
  ]);

  const byPlayer = new Map(clearances.map((c) => [c.playerId, c]));
  const unfit = clearances.filter((c) => c.status === 'UNFIT');
  const adapted = clearances.filter((c) => c.status === 'ADAPTED');
  const followed = clearances.filter((c) => c.status !== 'FIT');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Infirmerie</h1>
        <p className="mt-1 text-small text-content-secondary">
          Suivi médical des joueurs de l&apos;académie.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile value={String(unfit.length)} label="Indisponibles" />
        <StatTile value={String(adapted.length)} label="Aménagés" />
        <StatTile value={String(players.length)} label="Joueurs suivis" />
      </div>

      <section>
        <SectionTitle>À surveiller</SectionTitle>
        {followed.length === 0 ? (
          <EmptyState message="Aucune restriction en cours. Tous les joueurs sont aptes." />
        ) : (
          <Card>
            <ul className="divide-y divide-surface-border">
              {followed.map((clearance) => {
                const player = players.find((p) => p.id === clearance.playerId);
                return (
                  <li key={clearance.playerId}>
                    <Link
                      href={`/infirmerie/${clearance.playerId}`}
                      className="flex items-center gap-3 py-3 hover:bg-surface-raised"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-medium text-content-primary">
                          {player ? `${player.firstName} ${player.lastName}` : 'Joueur'}
                        </span>
                        <span className="block truncate text-caption text-content-secondary">
                          {STATUS_LABEL[clearance.status] ?? clearance.status}
                          {clearance.until && ` jusqu'au ${clearance.until}`}
                          {clearance.publicReason && ` · ${clearance.publicReason}`}
                        </span>
                      </span>
                      <span aria-hidden className="shrink-0 text-content-muted">
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <SectionTitle>Tous les joueurs</SectionTitle>
        <Card>
          <ul className="divide-y divide-surface-border">
            {players.map((player) => {
              const clearance = byPlayer.get(player.id);
              return (
                <li key={player.id}>
                  <Link
                    href={`/infirmerie/${player.id}`}
                    className="flex items-center gap-3 py-2.5 hover:bg-surface-raised"
                  >
                    <span className="min-w-0 flex-1 truncate text-body text-content-primary">
                      {player.firstName} {player.lastName}
                      <span className="ml-2 text-caption text-content-muted">{player.age} ans</span>
                    </span>
                    <span className="shrink-0 text-caption text-content-secondary">
                      {clearance ? (STATUS_LABEL[clearance.status] ?? clearance.status) : 'Apte'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <Alert tone="good">
        Vous accédez aux dossiers cliniques parce que vous êtes soignant. La direction et les coachs
        n&apos;y ont pas accès : ils ne voient que l&apos;aptitude que vous déclarez, sans le motif.
        Chacune de vos saisies est tracée dans le journal.
      </Alert>
    </div>
  );
}
