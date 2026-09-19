import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  FOOT_LABEL,
  GENDER_LABEL,
  PLAYER_STATUS_LABEL,
  canReadClinicalRecord,
  isStaffRole,
} from '@futuriste/core';
import { Alert, Avatar, Card, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { playerClearance, playerClinicalRecord, playerDetail } from '@/lib/data/people';
import { ClearanceCard } from '@/components/medical/clearance-card';

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

  const isStaff = isStaffRole(profile.role);
  const isMedical = canReadClinicalRecord(profile.role);

  // Les deux lectures sont lancées sans condition de rôle : RLS renvoie null à
  // qui n'y a pas droit. Ce sont les politiques qui décident, pas ce fichier.
  const [clinical, clearance] = await Promise.all([
    playerClinicalRecord(supabase, id),
    playerClearance(supabase, id),
  ]);

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

      <ClearanceCard clearance={clearance} />

      {isMedical ? (
        <Card>
          <SectionTitle>Dossier clinique</SectionTitle>
          {clinical ? (
            <>
              <dl className="text-small">
                <Line
                  label="Taille"
                  value={clinical.heightCm === null ? '—' : `${clinical.heightCm} cm`}
                />
                <Line
                  label="Poids"
                  value={clinical.weightKg === null ? '—' : `${clinical.weightKg} kg`}
                />
              </dl>
              {clinical.clinicalNotes && (
                <p className="mt-3 rounded-md bg-surface-raised p-3 text-small text-content-primary">
                  {clinical.clinicalNotes}
                </p>
              )}
            </>
          ) : (
            <p className="text-small text-content-secondary">Aucune note clinique.</p>
          )}
          <p className="mt-3 text-caption text-content-secondary">
            Secret médical. Ni la direction, ni les coachs, ni la famille n&apos;accèdent à cette
            fiche — c&apos;est la base de données qui le refuse, pas cet écran. Chaque consultation
            est tracée.
          </p>
        </Card>
      ) : (
        <Alert tone="good">
          {isStaff
            ? "Le dossier clinique de cet enfant relève du médecin du club et des kinésithérapeutes. La direction n'y a pas accès : un diagnostic appartient au soignant et à la famille."
            : "Le dossier clinique de cet enfant est couvert par le secret médical. Ce que vous devez savoir pour l'encadrer figure ci-dessus, dans l'aptitude."}
        </Alert>
      )}

      <p className="text-caption text-content-secondary">
        Le radar des huit domaines, les évaluations et les objectifs arrivent en phase 8.
      </p>
    </div>
  );
}
