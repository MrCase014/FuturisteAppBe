import { redirect } from 'next/navigation';
import { Card, DomainChip, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { listDomainsWithCompetencies } from '@/lib/data/library';
import type { DomainCode } from '@futuriste/core';

export const metadata = { title: 'Référentiel · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/**
 * 5.1 — Le référentiel : 8 domaines, leurs compétences.
 *
 * C'est la colonne vertébrale de la méthodologie : tout exercice, toute
 * évaluation et tout objectif s'y rattachent. L'écran affiche aussi combien
 * d'exercices couvrent chaque domaine — un domaine à zéro exercice signale un
 * trou dans la bibliothèque, pas dans la méthode.
 */
export default async function ReferentielPage() {
  await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const domains = await listDomainsWithCompetencies(supabase);
  const total = domains.reduce((sum, d) => sum + d.competencies.length, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Référentiel</h1>
        <p className="mt-1 text-small text-content-secondary">
          {domains.length} domaines de développement, {total} compétences.
        </p>
      </div>

      {domains.map((domain) => (
        <Card key={domain.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle>{domain.labelFr}</SectionTitle>
            <DomainChip code={domain.code as DomainCode} />
          </div>

          <p className="text-caption text-content-secondary">
            {domain.competencies.length} compétences ·{' '}
            {domain.exerciseCount === 0 ? (
              <span className="text-status-warning">aucun exercice ne le couvre</span>
            ) : (
              `${domain.exerciseCount} exercice${domain.exerciseCount > 1 ? 's' : ''}`
            )}
          </p>

          <ul className="mt-3 grid gap-1 text-small text-content-secondary sm:grid-cols-2">
            {domain.competencies.map((competency) => (
              <li key={competency.id}>{competency.labelFr}</li>
            ))}
          </ul>
        </Card>
      ))}

      <p className="text-caption text-content-secondary">
        L&apos;édition du référentiel et la méthodologie par âge arrivent dans la suite de la phase
        5.
      </p>
    </div>
  );
}
