import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { playerDetail } from '@/lib/data/people';
import { PlayerForm } from '../../player-form';

export const metadata = { title: 'Modifier un joueur · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/** D6 — Modification. */
export default async function ModifierJoueurPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireSessionProfile();
  const isStaff = profile.role === 'SUPER_ADMIN' || profile.role === 'ACADEMY_DIRECTOR';
  if (!isStaff) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { id } = await params;
  const player = await playerDetail(supabase, id);
  if (!player) notFound();

  return (
    <div className="space-y-5">
      <Link href={`/joueurs/${id}`} className="text-small text-futuriste-violet underline">
        ← Retour à la fiche
      </Link>
      <h1 className="font-display text-h1 text-content-primary">
        {player.firstName} {player.lastName}
      </h1>
      <PlayerForm
        values={{
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          birthDate: player.birthDate,
          gender: player.gender,
          jerseyNumber: player.jerseyNumber === null ? '' : String(player.jerseyNumber),
          dominantFoot: player.dominantFoot ?? '',
          status: player.status,
          preferredPosition: player.preferredPosition ?? '',
          objectivesNote: player.objectivesNote ?? '',
          observations: player.observations ?? '',
        }}
      />
    </div>
  );
}
