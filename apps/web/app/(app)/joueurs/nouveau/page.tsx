import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSessionProfile } from '@/lib/supabase/session';
import { PlayerForm } from '../player-form';

export const metadata = { title: 'Nouveau joueur · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/** D6 — Création. Réservé à la direction, qui seule peut écrire en base. */
export default async function NouveauJoueurPage() {
  const profile = await requireSessionProfile();
  const isStaff = profile.role === 'SUPER_ADMIN' || profile.role === 'ACADEMY_DIRECTOR';
  // Un coach n'a pas à voir ce formulaire : la base refuserait l'écriture, mais
  // proposer un écran qui échouera systématiquement serait une mauvaise manière.
  if (!isStaff) notFound();

  return (
    <div className="space-y-5">
      <Link href="/joueurs" className="text-small text-futuriste-violet underline">
        ← Tous les joueurs
      </Link>
      <h1 className="font-display text-h1 text-content-primary">Nouveau joueur</h1>
      <PlayerForm canEditMedical />
    </div>
  );
}
