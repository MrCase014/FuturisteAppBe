import Link from 'next/link';
import { Alert, Card, EmptyState, SectionTitle, StatTile } from '@/components/kit';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { attendanceSummary, coachOverview, visibleTeams } from '@/lib/data/dashboard';

/**
 * C1 — Tableau de bord coach (livrable 3.4).
 *
 * Volontairement centré sur ce qui appelle une action de sa part : ses
 * équipes, les joueurs qu'il n'a pas évalués depuis un mois. Un coach ouvre
 * cet écran entre deux entraînements, pas pour contempler des statistiques.
 */
export async function CoachDashboard({
  supabase,
  firstName,
}: {
  supabase: SupabaseServerClient;
  firstName: string;
}) {
  const [overview, teams, attendance] = await Promise.all([
    coachOverview(supabase),
    visibleTeams(supabase),
    attendanceSummary(supabase),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Bonjour {firstName}</h1>
        <p className="mt-1 text-small text-content-secondary">
          Vous ne voyez ici que vos équipes et vos joueurs.
        </p>
      </div>

      <Card className="border-l-4 border-l-futuriste-violet">
        <p className="text-caption uppercase tracking-wide text-content-secondary">
          Prochaine séance
        </p>
        {overview.upcomingSessions > 0 ? (
          <p className="mt-1 font-display text-h2">
            {overview.upcomingSessions} séance{overview.upcomingSessions > 1 ? 's' : ''} à venir
          </p>
        ) : (
          <>
            <p className="mt-1 font-display text-h2 text-content-secondary">Aucune séance prévue</p>
            <p className="mt-1 text-small text-content-secondary">
              La planification et le Session Studio arrivent en phase 6.
            </p>
          </>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatTile value={String(overview.playersCount)} label="Mes joueurs" />
        <StatTile value={String(overview.teamsCount)} label="Mes équipes" />
        <StatTile
          value={attendance.rate === null ? '—' : `${Math.round(attendance.rate)} %`}
          label="Présence"
        />
      </div>

      <section>
        <SectionTitle>À faire</SectionTitle>
        {overview.unevaluatedPlayers > 0 ? (
          <Alert tone="warning">
            {overview.unevaluatedPlayers} de vos joueurs n&apos;ont pas été évalués depuis plus de
            30 jours. Une évaluation régulière est ce qui rend la progression lisible pour eux comme
            pour leurs parents.
          </Alert>
        ) : (
          <Alert tone="good">Tous vos joueurs ont été évalués dans les 30 derniers jours.</Alert>
        )}
      </section>

      <section>
        <SectionTitle>Mes équipes</SectionTitle>
        {teams.length === 0 ? (
          <EmptyState message="Aucune équipe ne vous est affectée pour l'instant. C'est la direction de l'académie qui procède aux affectations." />
        ) : (
          <Card>
            <ul className="divide-y divide-surface-border">
              {teams.map((team) => (
                <li key={team.id} className="flex items-center justify-between py-2.5">
                  <span className="text-body text-content-primary">{team.name}</span>
                  <span className="text-small tabular-nums text-content-secondary">
                    {team.playersCount} joueur{team.playersCount > 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <Card>
        <SectionTitle>Préparer</SectionTitle>
        <Link href="/exercices" className="text-body text-futuriste-violet underline">
          Chercher un exercice
        </Link>
        <p className="mt-1 text-caption text-content-secondary">
          Filtrez par catégorie, domaine et nombre de joueurs présents.
        </p>
      </Card>

      <p className="text-caption text-content-secondary">
        {overview.activeGoals} objectif{overview.activeGoals > 1 ? 's' : ''} actif
        {overview.activeGoals > 1 ? 's' : ''} sur vos joueurs. Le suivi détaillé arrive en phase 8.
      </p>
    </div>
  );
}
