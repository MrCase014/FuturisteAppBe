import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isStaffRole, methodologySectionTitle } from '@futuriste/core';
import { Card, EmptyState, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { ageGroupByCode, methodologyForAgeGroup } from '@/lib/data/people';
import { SectionForm } from './section-form';

export const dynamic = 'force-dynamic';

/**
 * D12 — La méthodologie d'une catégorie (5.9).
 *
 * Le même écran pour tous, deux usages : le coach lit avant sa séance, la
 * direction corrige. C'est voulu — une page « administration » séparée
 * produit toujours, à la longue, deux textes qui ne disent plus la même
 * chose.
 *
 * Ce que l'écran ne fait PAS : appliquer ces consignes. « Aucune note en
 * U7 » est ici un texte pour les coachs ; la règle est appliquée par
 * `packages/core` et vérifiée par des tests. Si elle ne tenait qu'à ce
 * texte, il suffirait de le réécrire pour noter des enfants de six ans.
 */
export default async function CategoriePage({ params }: { params: Promise<{ code: string }> }) {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { code } = await params;
  const group = await ageGroupByCode(supabase, code);
  if (!group) notFound();

  const sections = await methodologyForAgeGroup(supabase, group.id);
  const peutModifier = isStaffRole(profile.role);

  return (
    <div className="space-y-5">
      <Link href="/categories" className="text-small text-futuriste-violet underline">
        ← Catégories
      </Link>

      <div>
        <h1 className="font-display text-h1 text-content-primary">{group.labelFr}</h1>
        <p className="mt-1 text-small text-content-secondary">
          {group.minAge}–{group.maxAge} ans · {group.sessionDurationMin} min ·{' '}
          {group.sessionsPerWeek} séances par semaine
        </p>
        {group.objectives && (
          <p className="mt-2 text-body text-content-primary">{group.objectives}</p>
        )}
      </div>

      {sections.length === 0 ? (
        <EmptyState message="Aucune méthodologie n'est encore écrite pour cette catégorie." />
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const titre = methodologySectionTitle(section.key, section.titleFr);
            return (
              <Card key={section.id} className="space-y-3">
                <SectionTitle>{titre}</SectionTitle>
                <p className="whitespace-pre-line text-body text-content-primary">
                  {section.bodyFr}
                </p>
                {peutModifier && (
                  <details className="border-t border-surface-border pt-3">
                    <summary className="min-h-touch cursor-pointer text-small text-futuriste-violet">
                      Modifier cette section
                    </summary>
                    <div className="pt-3">
                      <SectionForm
                        id={section.id}
                        sectionKey={section.key}
                        code={group.code}
                        titleFr={titre}
                        bodyFr={section.bodyFr}
                      />
                    </div>
                  </details>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-caption text-content-secondary">
        {peutModifier
          ? 'Vous modifiez ici le texte lu par tous les coachs de l’académie. Les règles appliquées par l’application — pas de note en U7, PLAYER DNA à partir de U13 — ne se changent pas depuis cet écran.'
          : 'Ce texte est écrit par la direction de l’académie.'}
      </p>
    </div>
  );
}
