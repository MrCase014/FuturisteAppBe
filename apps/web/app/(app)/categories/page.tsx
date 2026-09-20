import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, EmptyState, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { listAgeGroups } from '@/lib/data/people';

export const metadata = { title: 'Catégories · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/**
 * D11 / D12 — Catégories U7 → U18.
 *
 * Le référentiel des catégories vient de la méthodologie FUTURISTE
 * (`packages/core`), la base ne fait que porter les réglages propres à
 * l'académie : durée de séance, fréquence, objectifs.
 */
export default async function CategoriesPage() {
  await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const groups = await listAgeGroups(supabase);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Catégories</h1>
        <p className="mt-1 text-small text-content-secondary">
          De U7 à U18. Chaque catégorie porte sa propre méthodologie.
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptyState message="Aucune catégorie n'est encore définie." />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <SectionTitle>
                  <Link
                    href={`/categories/${group.code.toLowerCase()}`}
                    className="text-futuriste-violet underline"
                  >
                    {group.code} · {group.labelFr}
                  </Link>
                </SectionTitle>
                <span className="text-caption text-content-secondary">
                  {group.minAge}–{group.maxAge} ans
                </span>
              </div>

              <dl className="grid grid-cols-3 gap-3 text-small">
                <div>
                  <dt className="text-caption text-content-secondary">Séance</dt>
                  <dd className="tabular-nums">{group.sessionDurationMin} min</dd>
                </div>
                <div>
                  <dt className="text-caption text-content-secondary">Par semaine</dt>
                  <dd className="tabular-nums">{group.sessionsPerWeek}</dd>
                </div>
                <div>
                  <dt className="text-caption text-content-secondary">Équipes</dt>
                  <dd className="tabular-nums">{group.teamsCount}</dd>
                </div>
              </dl>

              {group.objectives && (
                <p className="mt-3 text-small text-content-secondary">{group.objectives}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="text-caption text-content-secondary">
        Ouvrez une catégorie pour lire sa méthodologie — priorités, format de jeu, évaluation. La
        direction l&apos;y modifie directement.
      </p>
    </div>
  );
}
