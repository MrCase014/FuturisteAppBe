import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SESSION_PHASES, isStaffRole } from '@futuriste/core';
import { Card, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { sessionDetail } from '@/lib/data/sessions';
import { SessionActions } from './session-actions';

export const dynamic = 'force-dynamic';

const PHASE_LABEL = new Map(SESSION_PHASES.map((p) => [p.phase, p.labelFr]));

/**
 * 6.3 — La fiche d'une séance.
 *
 * Ordonnée comme elle se déroule : le coach la lit de haut en bas, au bord du
 * terrain. Un bloc sans exercice s'affiche comme tel — il fait partie de la
 * séance, et le taire laisserait croire à un oubli plutôt qu'à un choix.
 */
export default async function FicheSeancePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { id } = await params;
  const session = await sessionDetail(supabase, id);
  if (!session) notFound();

  const quand = new Date(session.scheduledAt).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/seances" className="text-small text-futuriste-violet underline">
          ← Les séances
        </Link>
        <h1 className="mt-1 font-display text-h1 text-content-primary">{session.title}</h1>
        <p className="mt-1 text-body text-content-secondary">
          {quand} · {session.durationMin} min
          {session.teamName ? ` · ${session.teamName}` : ''}
          {session.playersExpected ? ` · ${session.playersExpected} joueurs attendus` : ''}
        </p>
      </div>

      <Card className="space-y-2">
        <SectionTitle>Le déroulé</SectionTitle>
        <ol className="space-y-2">
          {session.blocks.map((block) => (
            <li
              key={block.id}
              className={`rounded-md border p-3 ${
                block.exerciseId ? 'border-surface-border' : 'border-dashed border-status-warning'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-futuriste-violet text-caption font-bold text-white">
                  {block.orderIndex}
                </span>
                <span className="w-14 shrink-0 text-right text-small tabular-nums text-content-secondary">
                  {block.durationMin} min
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-caption uppercase tracking-wide text-content-muted">
                    {PHASE_LABEL.get(block.phase as never) ?? block.phase}
                  </p>
                  {block.exerciseSlug ? (
                    <>
                      <Link
                        href={`/exercices/${block.exerciseSlug}`}
                        className="text-body text-futuriste-violet underline"
                      >
                        {block.exerciseName}
                      </Link>
                      <p className="text-caption text-content-secondary">
                        {block.exerciseObjective}
                      </p>
                      {block.adaptedPlayersCount && block.adaptedPlayersCount > 1 && (
                        <p className="text-caption text-content-muted">
                          {block.adaptedPlayersCount} ateliers en parallèle — prévoyez le matériel.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-body text-content-primary">{block.customTitle}</p>
                      <p className="text-caption text-content-secondary">{block.customNotes}</p>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {(isStaffRole(profile.role) || profile.role === 'COACH') && (
        <SessionActions
          sessionId={session.id}
          title={session.title}
          scheduledAt={session.scheduledAt}
        />
      )}

      {session.coachNotes && (
        <Card>
          <SectionTitle>Notes</SectionTitle>
          <p className="text-body text-content-secondary">{session.coachNotes}</p>
        </Card>
      )}
    </div>
  );
}
