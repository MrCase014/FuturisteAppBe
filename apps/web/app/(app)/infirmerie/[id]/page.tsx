import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { GENDER_LABEL, isMedicalRole } from '@futuriste/core';
import { Alert, Avatar, Card, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { playerClearance, playerClinicalRecord, playerDetail } from '@/lib/data/people';
import { ClearanceForm, ClinicalForm } from './forms';

export const dynamic = 'force-dynamic';

/**
 * Fiche de soin d'un joueur.
 *
 * Deux blocs volontairement séparés à l'écran, parce qu'ils ont deux
 * destinataires : le dossier clinique reste chez le soignant, l'aptitude part
 * vers le coach et la famille. Les mélanger dans un seul formulaire ferait tôt
 * ou tard écrire un diagnostic dans le champ que tout le monde lit.
 */
export default async function FicheSoinPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireSessionProfile();
  if (!isMedicalRole(profile.role)) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { id } = await params;
  const [player, clinical, clearance] = await Promise.all([
    playerDetail(supabase, id),
    playerClinicalRecord(supabase, id),
    playerClearance(supabase, id),
  ]);
  if (!player) notFound();

  return (
    <div className="space-y-5">
      <Link href="/infirmerie" className="text-small text-futuriste-violet underline">
        ← Infirmerie
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
      </div>

      <Card>
        <SectionTitle>Dossier clinique</SectionTitle>
        <ClinicalForm
          playerId={player.id}
          clinicalNotes={clinical?.clinicalNotes ?? ''}
          heightCm={clinical?.heightCm === null || !clinical ? '' : String(clinical.heightCm)}
          weightKg={clinical?.weightKg === null || !clinical ? '' : String(clinical.weightKg)}
        />
      </Card>

      <Card>
        <SectionTitle>Aptitude déclarée</SectionTitle>
        <ClearanceForm
          playerId={player.id}
          status={clearance?.status ?? 'FIT'}
          until={clearance?.until ?? ''}
          publicReason={clearance?.publicReason ?? ''}
          emergencyInstructions={clearance?.emergencyInstructions ?? ''}
          emergencyContact={clearance?.emergencyContact ?? ''}
        />
      </Card>

      <Alert tone="good">
        Le suivi de progression, les évaluations techniques et le profil de jeu de cet enfant ne
        vous sont pas accessibles : ce sont des données de performance, sans usage clinique. La
        séparation vaut dans les deux sens.
      </Alert>
    </div>
  );
}
