import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  DOMAINS,
  MISMATCH_LABEL,
  SESSION_PHASES,
  mostLimitingCriterion,
  searchExercises,
  type AgeGroupCode,
  type DomainCode,
  type SessionPhase,
} from '@futuriste/core';
import { Alert, Card, DomainChip, EmptyState } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { listExercises } from '@/lib/data/library';
import { ExerciseFilters } from './filters';

export const metadata = { title: 'Exercices · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

const PHASE_LABEL = new Map(SESSION_PHASES.map((p) => [p.phase, p.labelFr]));
const DOMAIN_CODES = new Set(DOMAINS.map((d) => d.code));

/**
 * 5.2 — Bibliothèque d'exercices, avec filtres croisés.
 *
 * Le test de recette est chronométré : trouver « U11 · intelligence ·
 * 16 joueurs » en moins de vingt secondes. D'où deux choix : les filtres
 * vivent dans l'URL (donc se mettent en favori), et une recherche vide dit
 * QUEL critère écarte le plus d'exercices, au lieu d'afficher « aucun
 * résultat » et de laisser tâtonner.
 */
export default async function ExercicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categorie?: string;
    domaine?: string;
    joueurs?: string;
    phase?: string;
  }>;
}) {
  await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { q, categorie, domaine, joueurs, phase } = await searchParams;
  const exercises = await listExercises(supabase);

  const players = Number(joueurs);
  const outcome = searchExercises(exercises, {
    text: q,
    ageGroup: categorie ? (categorie as AgeGroupCode) : undefined,
    // Un domaine inventé dans l'URL ne doit pas vider la page en silence :
    // on l'ignore, comme un filtre qu'on n'aurait pas coché.
    domain:
      domaine && DOMAIN_CODES.has(domaine as DomainCode) ? (domaine as DomainCode) : undefined,
    playersPresent: Number.isFinite(players) && players > 0 ? players : undefined,
    phase: phase ? (phase as SessionPhase) : undefined,
  });

  const limiting = mostLimitingCriterion(outcome);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Exercices</h1>
        <p className="mt-1 text-small text-content-secondary">
          {exercises.length} exercices dans la bibliothèque de l&apos;académie.
        </p>
      </div>

      <Card>
        <ExerciseFilters />
      </Card>

      <p className="text-small text-content-secondary">
        {outcome.matches.length} exercice{outcome.matches.length > 1 ? 's' : ''} correspondent.
      </p>

      {outcome.matches.length === 0 ? (
        <>
          <EmptyState message="Aucun exercice ne correspond à cette combinaison." />
          {limiting && (
            <Alert tone="warning">
              C&apos;est <strong>{MISMATCH_LABEL[limiting]}</strong> qui écarte le plus
              d&apos;exercices ({outcome.excludedBy[limiting]}). Relâchez ce critère en premier.
            </Alert>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {outcome.matches.map((exercise) => (
            <Card key={exercise.id}>
              <Link href={`/exercices/${exercise.slug}`} className="block">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-display text-h3 text-content-primary">{exercise.name}</h2>
                  {exercise.domainCode && <DomainChip code={exercise.domainCode} />}
                </div>
                <p className="mt-1 text-small text-content-secondary">{exercise.objective}</p>
                <p className="mt-2 text-caption text-content-muted">
                  {exercise.durationMin} min · {exercise.playersMin}–{exercise.playersMax} joueurs
                  {exercise.ageGroupCodes.length > 0 && ` · ${exercise.ageGroupCodes.join(', ')}`}
                  {exercise.defaultPhase &&
                    ` · ${PHASE_LABEL.get(exercise.defaultPhase) ?? exercise.defaultPhase}`}
                </p>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <p className="text-caption text-content-secondary">
        Les schémas animés et les vidéos arrivent dans la suite de la phase 5.
      </p>
    </div>
  );
}
