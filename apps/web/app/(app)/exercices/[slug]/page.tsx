import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SESSION_PHASES } from '@futuriste/core';
import { Card, DomainChip, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { DiagramSection } from '@/components/diagrams/diagram-section';
import { exerciseDetail, exerciseDiagrams } from '@/lib/data/library';

export const dynamic = 'force-dynamic';

const PHASE_LABEL = new Map(SESSION_PHASES.map((p) => [p.phase, p.labelFr]));
const LEVEL_LABEL: Record<string, string> = {
  DECOUVERTE: 'Découverte',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE: 'Avancé',
};

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <ul className="list-disc space-y-1 pl-5 text-body text-content-secondary">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 5.3 — Fiche d'exercice.
 *
 * Ordonnée comme un coach la lit au bord du terrain : d'abord ce qu'il faut
 * faire, ensuite ce qu'il faut regarder, enfin comment adapter. Les erreurs
 * fréquentes viennent avant les variantes — on corrige plus souvent qu'on ne
 * complexifie.
 */
export default async function FicheExercicePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { slug } = await params;
  const exercise = await exerciseDetail(supabase, slug);
  if (!exercise) notFound();
  const diagrams = await exerciseDiagrams(supabase, exercise.id);

  return (
    <div className="space-y-5">
      <Link href="/exercices" className="text-small text-futuriste-violet underline">
        ← Bibliothèque
      </Link>

      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="font-display text-h1 text-content-primary">{exercise.name}</h1>
          {exercise.domainCode && <DomainChip code={exercise.domainCode} />}
        </div>
        <p className="mt-1 text-body text-content-secondary">{exercise.objective}</p>
      </div>

      <Card>
        <dl className="grid grid-cols-2 gap-3 text-small sm:grid-cols-4">
          <div>
            <dt className="text-caption text-content-secondary">Durée</dt>
            <dd className="tabular-nums">{exercise.durationMin} min</dd>
          </div>
          <div>
            <dt className="text-caption text-content-secondary">Joueurs</dt>
            <dd className="tabular-nums">
              {exercise.playersMin}–{exercise.playersMax}
              {exercise.goalkeepers > 0 && ` + ${exercise.goalkeepers} GB`}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-content-secondary">Espace</dt>
            <dd className="tabular-nums">
              {exercise.areaLengthM && exercise.areaWidthM
                ? `${exercise.areaLengthM} × ${exercise.areaWidthM} m`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-content-secondary">Niveau</dt>
            <dd>{LEVEL_LABEL[exercise.level] ?? exercise.level}</dd>
          </div>
        </dl>
        <p className="mt-3 text-caption text-content-secondary">
          {exercise.ageGroupCodes.length > 0
            ? `Catégories : ${exercise.ageGroupCodes.join(', ')}`
            : 'Toutes catégories'}
          {exercise.defaultPhase &&
            ` · Phase : ${PHASE_LABEL.get(exercise.defaultPhase) ?? exercise.defaultPhase}`}
        </p>
        {exercise.equipment.length > 0 && (
          <p className="mt-1 text-caption text-content-secondary">
            Matériel : {exercise.equipment.join(', ')}
          </p>
        )}
      </Card>

      <DiagramSection diagrams={diagrams} />

      <Card>
        <SectionTitle>Déroulé</SectionTitle>
        <p className="text-body text-content-primary">{exercise.description}</p>
        {exercise.coachInstructions && (
          <div className="mt-4 rounded-md border-l-4 border-l-futuriste-violet bg-surface-raised p-3">
            <p className="text-caption font-semibold uppercase tracking-wide text-content-secondary">
              Consigne au coach
            </p>
            <p className="mt-1 text-body text-content-primary">{exercise.coachInstructions}</p>
          </div>
        )}
      </Card>

      <Card className="space-y-5">
        <List title="Points d’observation" items={exercise.observationPoints} />
        <List title="Erreurs fréquentes" items={exercise.commonMistakes} />
        <List title="Variantes" items={exercise.variations} />
      </Card>

      {(exercise.progression || exercise.regression) && (
        <Card>
          <SectionTitle>Adapter en direct</SectionTitle>
          <dl className="space-y-2 text-small">
            {exercise.progression && (
              <div>
                <dt className="text-content-secondary">Si c’est trop facile</dt>
                <dd className="text-content-primary">{exercise.progression}</dd>
              </div>
            )}
            {exercise.regression && (
              <div>
                <dt className="text-content-secondary">Si c’est trop dur</dt>
                <dd className="text-content-primary">{exercise.regression}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}
    </div>
  );
}
