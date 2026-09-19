import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FOOT_LABEL, GENDER_LABEL, PLAYER_STATUS_LABEL } from '@futuriste/core';
import { Alert, Avatar, Card, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { playerDetail, playerMedical } from '@/lib/data/people';

export const dynamic = 'force-dynamic';

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-surface-border py-2 last:border-0">
      <dt className="text-content-secondary">{label}</dt>
      <dd className="text-right text-content-primary">{value}</dd>
    </div>
  );
}

/**
 * D5 / C5 — Fiche joueur, deux variantes.
 *
 * La variante « coach » n'est pas une version amputée de la variante
 * « direction » : le dossier médical ne lui est pas caché par cette page, il
 * lui est refusé par PostgreSQL. `playerMedical()` renvoie null à un coach même
 * s'il appelait l'API directement, sans passer par cet écran.
 *
 * C'est la différence entre masquer et protéger.
 */
export default async function FicheJoueurPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { id } = await params;
  const player = await playerDetail(supabase, id);
  // Un joueur hors de son périmètre ne remonte pas : pour le coach, il n'existe
  // pas. On ne distingue donc pas « introuvable » de « interdit » — cette
  // distinction renseignerait sur l'existence d'un enfant.
  if (!player) notFound();

  const isStaff = profile.role === 'SUPER_ADMIN' || profile.role === 'ACADEMY_DIRECTOR';
  const medical = isStaff ? await playerMedical(supabase, id) : null;

  return (
    <div className="space-y-5">
      <Link href="/joueurs" className="text-small text-futuriste-violet underline">
        ← Tous les joueurs
      </Link>

      <div className="flex items-center gap-3">
        <Avatar
          initials={`${player.firstName[0] ?? ''}${player.lastName[0] ?? ''}`.toUpperCase()}
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-h1 text-content-primary">
            {player.firstName} {player.lastName}
          </h1>
          <p className="text-small text-content-secondary">
            {player.age} ans · {GENDER_LABEL[player.gender] ?? player.gender}
            {player.teamNames.length > 0 && ` · ${player.teamNames.join(', ')}`}
          </p>
        </div>
        {isStaff && (
          <Link
            href={`/joueurs/${player.id}/modifier`}
            className="shrink-0 text-small text-futuriste-violet underline"
          >
            Modifier
          </Link>
        )}
      </div>

      <Card>
        <SectionTitle>Informations</SectionTitle>
        <dl className="text-small">
          <Line label="Date de naissance" value={player.birthDate} />
          <Line label="Statut" value={PLAYER_STATUS_LABEL[player.status] ?? player.status} />
          <Line
            label="Numéro de maillot"
            value={player.jerseyNumber === null ? '—' : String(player.jerseyNumber)}
          />
          <Line
            label="Pied fort"
            value={player.dominantFoot ? (FOOT_LABEL[player.dominantFoot] ?? '—') : '—'}
          />
          <Line label="Poste préféré" value={player.preferredPosition ?? '—'} />
          <Line
            label="Autres postes"
            value={
              player.experiencedPositions.length > 0 ? player.experiencedPositions.join(', ') : '—'
            }
          />
          <Line label="Arrivé le" value={player.joinedAt} />
        </dl>
      </Card>

      {(player.objectivesNote || player.observations) && (
        <Card>
          <SectionTitle>Suivi</SectionTitle>
          {player.objectivesNote && (
            <p className="text-body text-content-primary">{player.objectivesNote}</p>
          )}
          {player.observations && (
            <p className="mt-3 text-small text-content-secondary">{player.observations}</p>
          )}
        </Card>
      )}

      {isStaff ? (
        <Card>
          <SectionTitle>Dossier médical</SectionTitle>
          {medical ? (
            <>
              <dl className="text-small">
                <Line
                  label="Taille"
                  value={medical.heightCm === null ? '—' : `${medical.heightCm} cm`}
                />
                <Line
                  label="Poids"
                  value={medical.weightKg === null ? '—' : `${medical.weightKg} kg`}
                />
              </dl>
              {medical.medicalNotes && (
                <p className="mt-3 rounded-md bg-surface-raised p-3 text-small text-content-primary">
                  {medical.medicalNotes}
                </p>
              )}
            </>
          ) : (
            <p className="text-small text-content-secondary">Aucune information médicale.</p>
          )}
          <p className="mt-3 text-caption text-content-secondary">
            Réservé à la direction. Les coachs, les parents et le joueur lui-même n&apos;y ont aucun
            accès — c&apos;est la base de données qui le refuse, pas cet écran.
          </p>
        </Card>
      ) : (
        <Alert tone="good">
          Le dossier médical de cet enfant n&apos;est accessible qu&apos;à la direction de
          l&apos;académie. En cas de besoin pendant une séance, adressez-vous à elle.
        </Alert>
      )}

      <p className="text-caption text-content-secondary">
        Le radar des huit domaines, les évaluations et les objectifs arrivent en phase 8.
      </p>
    </div>
  );
}
