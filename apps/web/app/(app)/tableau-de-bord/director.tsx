import { reliabilityNoteFr } from '@futuriste/core';
import { Alert, Card, EmptyState, SectionTitle, StatTile } from '@/components/kit';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import {
  academyOverview,
  attendanceSummary,
  domainAverages,
  overdueGoalsCount,
  playersWithoutRecentEvaluation,
} from '@/lib/data/dashboard';

/**
 * D1 — Tableau de bord directeur (livrable 3.3).
 *
 * Tous les nombres viennent de la base, à travers RLS. Aucun n'est écrit en
 * dur : un écran de pilotage qui affiche des chiffres décoratifs est pire
 * qu'un écran vide, parce qu'on le croit.
 */
export async function DirectorDashboard({
  supabase,
  academyId,
}: {
  supabase: SupabaseServerClient;
  academyId: string;
}) {
  const [overview, domains, attendance, overdue, unevaluated] = await Promise.all([
    academyOverview(supabase, academyId),
    domainAverages(supabase),
    attendanceSummary(supabase),
    overdueGoalsCount(supabase),
    playersWithoutRecentEvaluation(supabase),
  ]);

  const alerts: { tone: 'warning' | 'serious'; text: string }[] = [];
  if (unevaluated > 0) {
    alerts.push({
      tone: unevaluated > 5 ? 'serious' : 'warning',
      text: `${unevaluated} joueur${unevaluated > 1 ? 's' : ''} sans évaluation depuis plus de 30 jours.`,
    });
  }
  if (overdue > 0) {
    alerts.push({
      tone: 'warning',
      text: `${overdue} objectif${overdue > 1 ? 's dépassent' : ' dépasse'} sa date cible.`,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Pilotage</h1>
        <p className="mt-1 text-small text-content-secondary">
          Ces nombres sont ceux que la base accepte de montrer à votre compte.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value={String(overview?.playersCount ?? 0)} label="Joueurs actifs" />
        <StatTile value={String(overview?.coachesCount ?? 0)} label="Coachs" />
        <StatTile value={String(overview?.ageGroupsCount ?? 0)} label="Catégories" />
        <StatTile
          value={attendance.rate === null ? '—' : `${Math.round(attendance.rate)} %`}
          label="Présence"
        />
      </div>

      {attendance.rate === null && (
        <p className="text-caption text-content-secondary">
          La présence reste vide tant qu&apos;aucune séance n&apos;a été pointée. La prise de
          présence arrive en phase 7 ; afficher 0 % laisserait croire que personne ne vient.
        </p>
      )}

      <section>
        <SectionTitle>Alertes</SectionTitle>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Alert key={alert.text} tone={alert.tone}>
                {alert.text}
              </Alert>
            ))}
          </div>
        ) : (
          <Alert tone="good">
            Rien à signaler : aucun retard d&apos;évaluation ni d&apos;objectif.
          </Alert>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Niveau moyen par domaine</SectionTitle>
          {domains.length === 0 ? (
            <p className="text-small text-content-secondary">
              Aucune évaluation saisie pour l&apos;instant. Les moyennes apparaîtront dès les
              premières évaluations de coachs.
            </p>
          ) : (
            <>
              <table className="w-full text-small">
                <caption className="sr-only">
                  Niveau moyen par domaine de développement, sur 5
                </caption>
                <thead>
                  <tr className="text-left text-content-secondary">
                    <th scope="col" className="py-1 font-medium">
                      Domaine
                    </th>
                    <th scope="col" className="py-1 text-right font-medium">
                      Moyenne
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((domain) => {
                    const note = reliabilityNoteFr(domain.sampleSize);
                    return (
                      <tr key={domain.code} className="border-t border-surface-border">
                        <th scope="row" className="py-1.5 font-normal">
                          {domain.labelFr}
                          {note && (
                            <span className="block text-caption text-content-muted">{note}</span>
                          )}
                        </th>
                        <td className="py-1.5 text-right tabular-nums">
                          {domain.average.toFixed(1)} / 5
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-caption text-content-secondary">
                Une moyenne appuyée sur moins de cinq évaluations est signalée comme indicative :
                elle ne suffit pas à réorienter une méthodologie.
              </p>
            </>
          )}
        </Card>

        <Card>
          <SectionTitle>Activité</SectionTitle>
          <dl className="space-y-2 text-small">
            <div className="flex justify-between border-b border-surface-border pb-2">
              <dt className="text-content-secondary">Équipes</dt>
              <dd className="tabular-nums">{overview?.teamsCount ?? 0}</dd>
            </div>
            <div className="flex justify-between border-b border-surface-border pb-2">
              <dt className="text-content-secondary">Séances (30 derniers jours)</dt>
              <dd className="tabular-nums">{overview?.sessions30d ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-content-secondary">Objectifs actifs</dt>
              <dd className="tabular-nums">{overview?.activeGoals ?? 0}</dd>
            </div>
          </dl>
          {(overview?.sessions30d ?? 0) === 0 && (
            <p className="mt-3 text-caption text-content-secondary">
              Aucune séance enregistrée : la planification arrive en phase 6.
            </p>
          )}
        </Card>
      </div>

      {overview === null && (
        <EmptyState message="Les chiffres de l'académie n'ont pas pu être lus. Reconnectez-vous, puis signalez-le si cela persiste." />
      )}
    </div>
  );
}
